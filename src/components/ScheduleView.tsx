import { CalendarDays, Clock3, Info } from 'lucide-react';
import type { PlannedCourse } from '../types';
export function formatDate(value: string) { const [y, m, d] = value.split('-'); return `${d}/${m}/${y}`; }
const weekday = (value: string) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(`${value}T12:00:00+07:00`));
export default function ScheduleView({ courses }: { courses: PlannedCourse[] }) {
  if (!courses.length) return <div className="empty-inline"><CalendarDays size={28} /><h3>Không có môn trong lịch dự kiến</h3><p>Các môn có lịch có thể đã nằm trong danh sách đã học. Kiểm tra thông báo của học kỳ ở phía trên.</p></div>;
  return <div className="schedule-list">{courses.map(course => <article className="course-card" key={course.maMon}>
    <div className="course-header"><div><span className="course-code">{course.maMon}</span><h3>{course.tenMon}</h3></div><span className="credit">{course.soTinChi} tín chỉ</span></div>
    <div className="course-period"><CalendarDays size={15} aria-hidden="true" /> {formatDate(course.ngayBatDau)} — {formatDate(course.ngayKetThuc)}
      {course.canXacMinh && <span className="status-warning">Chưa rõ trạng thái đã học</span>}</div>
    <div className="sessions">{course.buoiHoc.map((session, i) => <div className={`session ${session.loai !== 'huong_dan' ? 'review' : ''}`} key={`${session.ngay}-${i}`}>
      <span className="session-number">{String(i + 1).padStart(2, '0')}</span><div><span className="session-kind">{session.loai === 'huong_dan' ? 'Hướng dẫn học tập' : 'Ôn tập & kiểm tra giữa kỳ'}</span>
        <strong>{weekday(session.ngay)}, {formatDate(session.ngay)}</strong><span className="session-time"><Clock3 size={13} aria-hidden="true" />{session.gioBatDau} – {session.gioKetThuc}</span></div>
    </div>)}</div>
    <details className="course-details"><summary><Info size={14} aria-hidden="true" /> Tiến trình học và ghi chú</summary>
      {course.cacGiaiDoan.map(stage => <div className="stage" key={stage.giaiDoan}><strong>Giai đoạn {stage.giaiDoan} · {stage.thoiGianGoc}</strong><p>{stage.noiDung}</p></div>)}
      <p className="source-note">{course.ghiChuChung}</p></details>
  </article>)}</div>;
}
