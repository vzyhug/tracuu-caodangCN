import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(root, process.argv[2] || '../mongodb');
const out = path.join(root, 'data/private');
await fs.mkdir(out, { recursive: true });
const catalog = new Set(JSON.parse(await fs.readFile(path.join(source, 'mon_hoc.json'), 'utf8')).map(m => m._id));
for (const collection of ['mon_hoc', 'sinh_vien', 'tkb']) {
  const input = JSON.parse(await fs.readFile(path.join(source, collection + '.json'), 'utf8'));
  const records = input.map(record => {
    const { _id, ...data } = record;
    const id = collection === 'tkb'
      ? createHash('sha256').update(JSON.stringify([data.maLop, data.maMon, data.hocKy, data.namHoc])).digest('hex').slice(0, 32)
      : _id;
    if (typeof id !== 'string' || !id || id.includes('/')) throw Error('Document ID không hợp lệ: ' + collection);
    if (collection === 'tkb' && !catalog.has(data.maMon)) throw Error('Mã môn không có trong danh mục.');
    if (collection === 'sinh_vien') for (const t of data.theoDoiHocTap) for (const m of t.monHoc) {
      if (!catalog.has(m.maMon)) throw Error('Mã môn lịch sử không có trong danh mục.');
    }
    if (JSON.stringify(data).includes('maMonGoc') || JSON.stringify(data).includes('maThamChieu')) throw Error('Dữ liệu còn mã môn song song.');
    return { id, data };
  });
  if (new Set(records.map(r => r.id)).size !== records.length) throw Error('Trùng document ID: ' + collection);
  await fs.writeFile(path.join(out, collection + '.json'), JSON.stringify(records, null, 2) + '\n');
  console.log(`${collection}: ${records.length} documents → data/private/${collection}.json`);
}
