// Builds synthetic examples; never bundles the real student directory into the web app.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async file => JSON.parse(await fs.readFile(path.join(root, '../mongodb', file), 'utf8'));
const original = await read('sinh_vien.json');
const ids = ['26104020001', '26104150548'];
const students = ids.map((id, index) => {
  const student = original.find(s => s._id === id);
  return { _id: `0000000000${index + 1}`, hoTen: index ? 'Sinh viên minh họa đợt 2' : 'Sinh viên minh họa đợt 1',
    daoTao: student.daoTao, theoDoiHocTap: student.theoDoiHocTap };
});
const fields = ['maLop', 'maMon', 'hocKy', 'namHoc', 'dotTuyenSinh', 'soTinChi', 'ngayBatDau', 'ngayKetThuc', 'buoiHoc', 'huongDan', 'onTapKiemTraGiuaKy', 'cacGiaiDoan', 'ghiChuChung'];
const schedules = (await read('tkb.json')).filter(r => students.some(s => s.daoTao.maLop === r.maLop && r.dotTuyenSinh.includes(s.daoTao.dot)))
  .map(r => Object.fromEntries(fields.map(f => [f, r[f]])));
const data = { students, subjects: await read('mon_hoc.json'), schedules };
await fs.mkdir(path.join(root, 'src/data'), { recursive: true });
await fs.writeFile(path.join(root, 'src/data/demo.json'), JSON.stringify(data, null, 2) + '\n');
console.log('Đã tạo 2 sinh viên minh họa, không chứa thông tin cá nhân từ danh sách thật.');
