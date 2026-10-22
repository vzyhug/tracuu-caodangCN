export interface HistoryCourse { maMon: string; daHoc: boolean | null }
export interface Student {
  _id: string; hoTen: string;
  daoTao: { maLop: string; dot: number; nganhHoc: string; bacDaoTao: string };
  theoDoiHocTap: { hocKy: number; namHoc: string; monHoc: HistoryCourse[] }[];
}
export interface Subject { _id: string; tenMon: string; nhom?: string }
export interface Session { ngay: string; gioBatDau: string; gioKetThuc: string; muiGio: string; loai: string }
export interface Schedule {
  maLop: string; maMon: string; hocKy: number; namHoc: string; dotTuyenSinh: number[];
  soTinChi: number; ngayBatDau: string; ngayKetThuc: string; buoiHoc: Session[];
  huongDan: { soGio: number; lichGoc: string };
  onTapKiemTraGiuaKy: { soGio: number; lichGoc: string };
  cacGiaiDoan: { giaiDoan: number; thoiGianGoc: string; noiDung: string }[];
  ghiChuChung: string;
}
export interface LookupInput { mssv: string; hocKy: number; namHoc: string }
export type NamedHistory = HistoryCourse & { tenMon: string; hocKy: number; namHoc: string };
export type PlannedCourse = Schedule & { tenMon: string; trangThaiHocTap: string; canXacMinh: boolean };
export interface LookupResult {
  thongTinSinhVien: { mssv: string; hoTen: string; maLop: string; dot: number; nganhHoc: string; bacDaoTao: string };
  hocKy: number; namHoc: string; monDaHoc: NamedHistory[]; monChuaRoTrangThai: NamedHistory[];
  lichHocDuKien: PlannedCourse[]; canhBao: string[];
}
export function parseInput(data: unknown): LookupInput {
  if (!data || typeof data !== 'object') throw new Error('Vui lòng nhập mã số sinh viên.');
  const input = data as Record<string, unknown>;
  const mssv = typeof input.mssv === 'string' ? input.mssv.trim() : '';
  if (!/^\d{11}$/.test(mssv)) throw new Error('Mã số sinh viên phải gồm 11 chữ số.');
  const hocKy = input.hocKy ?? 2;
  const namHoc = input.namHoc ?? '2026-2027';
  if (typeof hocKy !== 'number' || !Number.isInteger(hocKy) || hocKy < 1 || hocKy > 3) throw new Error('Học kỳ không hợp lệ.');
  if (typeof namHoc !== 'string' || !/^\d{4}-\d{4}$/.test(namHoc) || Number(namHoc.slice(5)) !== Number(namHoc.slice(0, 4)) + 1) throw new Error('Năm học không hợp lệ.');
  return { mssv, hocKy, namHoc };
}
export function buildLookup(student: Student, subjects: Subject[], schedules: Schedule[], input: LookupInput): LookupResult {
  const catalog = new Map(subjects.map(s => [s._id, s.tenMon]));
  const history = student.theoDoiHocTap.flatMap(term => term.monHoc.map(mon => ({
    maMon: mon.maMon, daHoc: mon.daHoc, tenMon: catalog.get(mon.maMon) || mon.maMon,
    hocKy: term.hocKy, namHoc: term.namHoc,
  })));
  const completed = new Set(history.filter(m => m.daHoc === true).map(m => m.maMon));
  const seen = new Set<string>();
  const monDaHoc = history.filter(m => {
    if (m.daHoc !== true || seen.has(m.maMon)) return false;
    seen.add(m.maMon); return true;
  });
  const scheduled = schedules.filter(s => s.maLop === student.daoTao.maLop && s.dotTuyenSinh.includes(student.daoTao.dot)
    && s.hocKy === input.hocKy && s.namHoc === input.namHoc);
  const lichHocDuKien = scheduled.filter(s => !completed.has(s.maMon)).map(s => {
    const matches = history.filter(m => m.maMon === s.maMon);
    const status = matches.some(m => m.daHoc === false) ? 'chua_hoc' : matches.some(m => m.daHoc === null) ? 'chua_xac_dinh' : 'chua_co_lich_su';
    // Explicit allowlist: no birth date/place, raw PDFs or extra database fields in response.
    return {
      maLop: s.maLop, maMon: s.maMon, hocKy: s.hocKy, namHoc: s.namHoc, dotTuyenSinh: s.dotTuyenSinh,
      tenMon: catalog.get(s.maMon) || s.maMon, soTinChi: s.soTinChi,
      ngayBatDau: s.ngayBatDau, ngayKetThuc: s.ngayKetThuc, buoiHoc: s.buoiHoc,
      huongDan: s.huongDan, onTapKiemTraGiuaKy: s.onTapKiemTraGiuaKy,
      cacGiaiDoan: s.cacGiaiDoan, ghiChuChung: s.ghiChuChung,
      trangThaiHocTap: status, canXacMinh: status === 'chua_xac_dinh',
    };
  }).sort((a, b) => a.ngayBatDau.localeCompare(b.ngayBatDau) || a.maMon.localeCompare(b.maMon));
  const unknown = history.filter(m => m.daHoc === null && !completed.has(m.maMon));
  return {
    thongTinSinhVien: {
      mssv: student._id, hoTen: student.hoTen, maLop: student.daoTao.maLop,
      dot: student.daoTao.dot, nganhHoc: student.daoTao.nganhHoc, bacDaoTao: student.daoTao.bacDaoTao,
    },
    hocKy: input.hocKy, namHoc: input.namHoc, monDaHoc, monChuaRoTrangThai: unknown, lichHocDuKien,
    canhBao: [
      ...(unknown.length ? ['Các môn chưa rõ trạng thái vẫn được giữ trong lịch dự kiến để đối chiếu.'] : []),
      ...(!scheduled.length ? ['Chưa có thời khóa biểu cho lớp và học kỳ đã chọn.'] : []),
    ],
  };
}
