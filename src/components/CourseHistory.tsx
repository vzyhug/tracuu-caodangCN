import { CheckCircle2, HelpCircle, BookOpen } from 'lucide-react';
import type { NamedHistory } from '../types';

export default function CourseHistory({ courses, unknown = false }: { courses: NamedHistory[]; unknown?: boolean }) {
  if (!courses.length) {
    return (
      <div className="empty-inline">
        <p>{unknown ? 'Không có môn học nào thuộc diện chưa rõ trạng thái.' : 'Chưa có môn học nào được ghi nhận đã hoàn thành.'}</p>
      </div>
    );
  }

  return (
    <div className="huit-history-grid">
      {courses.map((course, index) => (
        <article className="history-card-item" key={`${course.maMon}-${course.hocKy}-${course.namHoc}-${index}`}>
          <div className={`history-status-indicator ${unknown ? 'unknown' : 'completed'}`}>
            {unknown ? <HelpCircle size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div className="history-card-info">
            <h4 className="history-course-name">{course.tenMon}</h4>
            <div className="history-meta">
              <span className="code-badge">{course.maMon}</span>
              <span className="term-text">Học kỳ {course.hocKy} · Năm học {course.namHoc}</span>
            </div>
          </div>
          <div className="history-status-badge">
            <span className={unknown ? 'badge-warning' : 'badge-success'}>
              {unknown ? 'Cần xác nhận' : 'Đã học'}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
