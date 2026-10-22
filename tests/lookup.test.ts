import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildLookup, parseInput, type Student, type Subject, type Schedule } from '../functions/src/domain';
const load = (name: string) => JSON.parse(fs.readFileSync(new URL(`../data/private/${name}.json`, import.meta.url), 'utf8'));
const students: Student[] = load('sinh_vien').map((r: { id: string; data: Student }) => ({ ...r.data, _id: r.id }));
const subjects: Subject[] = load('mon_hoc').map((r: { id: string; data: Subject }) => ({ ...r.data, _id: r.id }));
const schedules: Schedule[] = load('tkb').map((r: { data: Schedule }) => r.data);

test('MSSV must be a string with 11 digits; term and year are validated', () => {
  assert.equal(parseInput({ mssv: ' 26104020001 ' }).mssv, '26104020001');
  for (const invalid of [null, {}, { mssv: 26104020001 }, { mssv: '../abc' }, { mssv: '26104020001', hocKy: '2' }, { mssv: '26104020001', namHoc: '2026-2028' }]) {
    assert.throws(() => parseInput(invalid));
  }
});
test('All 86 students have the correct cohort schedule with no learned course or duplicate', () => {
  assert.equal(students.length, 86);
  const catalog = new Set(subjects.map(m => m._id));
  for (const student of students) {
    const input = parseInput({ mssv: student._id });
    const result = buildLookup(student, subjects, schedules, input);
    const applicable = schedules.filter(s => s.maLop === student.daoTao.maLop && s.dotTuyenSinh.includes(student.daoTao.dot));
    assert.equal(applicable.length, student.daoTao.dot === 1 ? 3 : 7);
    const learned = new Set(student.theoDoiHocTap.flatMap(t => t.monHoc).filter(m => m.daHoc === true).map(m => m.maMon));
    assert.deepEqual(new Set(result.lichHocDuKien.map(m => m.maMon)), new Set(applicable.filter(s => !learned.has(s.maMon)).map(s => s.maMon)));
    assert.equal(new Set(result.lichHocDuKien.map(m => m.maMon)).size, result.lichHocDuKien.length);
    assert(result.monDaHoc.every(m => m.daHoc === true && catalog.has(m.maMon)));
    assert(result.lichHocDuKien.every(m => !learned.has(m.maMon) && catalog.has(m.maMon)));
    assert(!JSON.stringify(result).includes('maMonGoc'));
    assert(!JSON.stringify(result).includes('maThamChieu'));
    assert(!JSON.stringify(result).includes('ngaySinh'));
    assert(!JSON.stringify(result).includes('noiSinh'));
    assert(!JSON.stringify(result).includes('noiDungGoc'));
  }
});
test('Unknown common courses remain in planned schedule and are flagged for review', () => {
  const student = students.find(s => s._id === '26104150548')!;
  const result = buildLookup(student, subjects, schedules, parseInput({ mssv: student._id }));
  assert.equal(result.lichHocDuKien.length, 7);
  assert.equal(result.lichHocDuKien.filter(m => m.canXacMinh).length, 4);
  assert(result.lichHocDuKien.filter(m => m.canXacMinh).every(m => m.trangThaiHocTap === 'chua_xac_dinh'));
  assert(result.canhBao.length > 0);
});
test('Completed courses take priority over an unknown record in a later term', () => {
  const student = structuredClone(students.find(s => s._id === '26104150548')!);
  student.theoDoiHocTap.push({ hocKy: 1, namHoc: '2025-2026', monHoc: [{ maMon: 'MHMC0105', daHoc: true }] });
  const result = buildLookup(student, subjects, schedules, parseInput({ mssv: student._id }));
  assert(!result.lichHocDuKien.some(m => m.maMon === 'MHMC0105'));
  assert(!result.monChuaRoTrangThai.some(m => m.maMon === 'MHMC0105'));
  assert(result.monDaHoc.some(m => m.maMon === 'MHMC0105'));
});
test('An empty semester reports no schedule rather than falling back to another semester', () => {
  const result = buildLookup(students[0], subjects, schedules, parseInput({ mssv: students[0]._id, hocKy: 1 }));
  assert.equal(result.lichHocDuKien.length, 0);
  assert(result.canhBao.some(c => c.includes('Chưa có thời khóa biểu')));
});
test('Firestore export preserves unique document identity and one course code', () => {
  for (const name of ['sinh_vien', 'mon_hoc', 'tkb']) {
    const docs = load(name);
    assert.equal(docs.length, new Set(docs.map((d: { id: string }) => d.id)).size);
    assert(docs.every((d: { id: string; data: Record<string, unknown> }) => !d.id.includes('/') && !('_id' in d.data)));
  }
  assert.equal(schedules.length, 91);
  assert.equal(subjects.length, 34);
});
