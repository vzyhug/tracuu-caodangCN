import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const seed = spawnSync(process.execPath, ['scripts/import-firestore.mjs', '--project', 'demo-tra-cuu'], { stdio: 'inherit', env: process.env });
assert.equal(seed.status, 0);
const endpoint = 'http://127.0.0.1:5001/demo-tra-cuu/asia-southeast1/traCuuSinhVien';
const call = async data => {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
  return { status: response.status, body: await response.json() };
};
let response = await call({ mssv: '26104020001' });
assert.equal(response.status, 200, JSON.stringify(response.body));
assert.equal(response.body.result.thongTinSinhVien.mssv, '26104020001');
assert.equal(response.body.result.lichHocDuKien.length, 3);
assert(response.body.result.monDaHoc.every(m => m.daHoc === true));
response = await call({ mssv: '26104150548' });
assert.equal(response.status, 200);
assert.equal(response.body.result.lichHocDuKien.length, 7);
assert.equal(response.body.result.lichHocDuKien.filter(m => m.canXacMinh).length, 4);
response = await call({ mssv: 'abc' });
assert.equal(response.status, 400);
assert.equal(response.body.error.status, 'INVALID_ARGUMENT');
response = await call({ mssv: '99999999999' });
assert.equal(response.status, 404);
assert.equal(response.body.error.status, 'NOT_FOUND');
const directRead = await fetch('http://127.0.0.1:8080/v1/projects/demo-tra-cuu/databases/(default)/documents/sinh_vien/26104020001');
assert.equal(directRead.status, 403, 'Client reads must be denied by Firestore rules.');
// Re-import must keep the same document count and identifiers.
const secondSeed = spawnSync(process.execPath, ['scripts/import-firestore.mjs', '--project', 'demo-tra-cuu'], { stdio: 'inherit', env: process.env });
assert.equal(secondSeed.status, 0);
const { getFirestore } = await import('firebase-admin/firestore');
const { initializeApp } = await import('firebase-admin/app');
initializeApp({ projectId: 'demo-tra-cuu' });
const db = getFirestore();
for (const [collection, count] of [['sinh_vien', 86], ['mon_hoc', 34], ['tkb', 91]]) {
  assert.equal((await db.collection(collection).get()).size, count);
}
console.log('PASS: callable + Firestore + rules + invalid/not-found + cohort/status filtering + idempotent import.');
