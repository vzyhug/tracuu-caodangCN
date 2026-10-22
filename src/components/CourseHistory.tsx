import { Check, CircleHelp } from 'lucide-react';
import type { NamedHistory } from '../types';
export default function CourseHistory({ courses, unknown = false }: { courses: NamedHistory[]; unknown?: boolean }) {
  if (!courses.length) return <div className="empty-inline"><p>{unknown ? 'Không có môn chưa rõ trạng thái.' : 'Chưa có môn được ghi nhận đã học.'}</p></div>;
  return <div className="history-list">{courses.map((course, index) => <article className="history-row" key={`${course.maMon}-${course.hocKy}-${course.namHoc}-${index}`}>
    <span className={`history-icon ${unknown ? 'unknown' : ''}`}>{unknown ? <CircleHelp size={19} /> : <Check size={19} />}</span>
    <div><h3>{course.tenMon}</h3><p>{course.maMon} <span>·</span> Học kỳ {course.hocKy} <span>·</span> {course.namHoc}</p></div>
    <span className={unknown ? 'status-warning' : 'status-complete'}>{unknown ? 'Chưa xác định' : 'Đã học'}</span>
  </article>)}</div>;
}
