import { GraduationCap, BadgeCheck } from 'lucide-react';
import type { LookupResult } from '../types';
export default function StudentCard({ student }: { student: LookupResult['thongTinSinhVien'] }) {
  return <section className="student-card" aria-labelledby="student-name">
    <div className="avatar"><GraduationCap size={30} aria-hidden="true" /></div>
    <div className="student-main"><div className="eyebrow"><BadgeCheck size={14} aria-hidden="true" /> THÔNG TIN SINH VIÊN</div>
      <h2 id="student-name">{student.hoTen}</h2><p>MSSV <strong>{student.mssv}</strong></p></div>
    <dl className="student-details"><div><dt>Lớp</dt><dd>{student.maLop}</dd></div>
      <div><dt>Ngành học</dt><dd>{student.nganhHoc}</dd></div>
      <div><dt>Đào tạo</dt><dd>{student.bacDaoTao} · Đợt {student.dot}</dd></div></dl>
  </section>;
}
