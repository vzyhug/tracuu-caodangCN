import { useState } from 'react';
import { CalendarDays, Clock, Video, Info, ChevronDown, ChevronUp, BookOpen, Layers } from 'lucide-react';
import type { PlannedCourse } from '../types';

export function formatDate(value: string) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

const weekday = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).format(
    new Date(`${value}T12:00:00+07:00`)
  );

interface ScheduleViewProps {
  courses: PlannedCourse[];
}

export default function ScheduleView({ courses }: ScheduleViewProps) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  if (!courses.length) {
    return (
      <div className="empty-inline">
        <CalendarDays size={32} />
        <h3>Không có môn học trong kế hoạch học kỳ này</h3>
        <p>Các môn học có thể đã hoàn thành hoặc chưa mở lớp cho học kỳ hiện tại.</p>
      </div>
    );
  }

  const toggleExpand = (code: string) => {
    setExpandedCourse(prev => (prev === code ? null : code));
  };

  return (
    <div className="huit-course-accordion-list">
      {courses.map(course => {
        const isExpanded = expandedCourse === course.maMon;

        return (
          <article className="huit-course-panel" key={course.maMon}>
            {/* Header của môn học */}
            <div className="panel-header" onClick={() => toggleExpand(course.maMon)} role="button" tabIndex={0}>
              <div className="course-title-col">
                <div className="course-tags">
                  <span className="course-code-tag">{course.maMon}</span>
                  <span className="course-class-tag">Lớp: {course.maLop}</span>
                  {course.canXacMinh && <span className="status-warning">Chờ xác minh</span>}
                </div>
                <h3 className="course-name-title">{course.tenMon}</h3>
                <div className="course-duration">
                  <CalendarDays size={14} />
                  <span>Thời gian học: <strong>{formatDate(course.ngayBatDau)}</strong> — <strong>{formatDate(course.ngayKetThuc)}</strong></span>
                </div>
              </div>

              <div className="course-header-actions">
                <span className="credit-badge">
                  <BookOpen size={14} />
                  {course.soTinChi} Tín chỉ
                </span>
                <button
                  type="button"
                  className="expand-btn"
                  aria-expanded={isExpanded}
                  aria-label="Xem chi tiết môn học"
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {/* Danh sách các buổi học cụ thể theo đúng khung giờ */}
            <div className="panel-sessions-strip">
              <div className="sessions-title">
                <Clock size={15} />
                <span>Lịch các buổi học trực tuyến (Google Meet):</span>
              </div>
              <div className="sessions-grid">
                {course.buoiHoc.map((session, i) => {
                  const isReview = session.loai !== 'huong_dan';
                  return (
                    <div className={`session-card ${isReview ? 'review' : ''}`} key={`${session.ngay}-${i}`}>
                      <div className="session-index">Buổi {i + 1}</div>
                      <div className="session-body">
                        <span className="session-type-name">
                          {isReview ? 'Ôn tập & kiểm tra giữa kỳ' : 'Hướng dẫn học tập trực tuyến'}
                        </span>
                        <div className="session-date-time">
                          <strong className="session-date">{weekday(session.ngay)}, {formatDate(session.ngay)}</strong>
                          <span className="session-hours">
                            <Clock size={13} />
                            Tối {session.gioBatDau} – {session.gioKetThuc}
                          </span>
                        </div>
                        <div className="session-place">
                          <Video size={13} />
                          <span>Google Meet (Học trực tuyến)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chi tiết tiến trình các giai đoạn học tập */}
            {isExpanded && (
              <div className="panel-expanded-details">
                <div className="stages-title">
                  <Layers size={15} />
                  <span>Mốc tiến trình các giai đoạn học tập:</span>
                </div>

                <div className="stages-timeline">
                  {course.cacGiaiDoan.map(stage => (
                    <div className="timeline-item" key={stage.giaiDoan}>
                      <div className="timeline-marker">{stage.giaiDoan}</div>
                      <div className="timeline-content">
                        <strong>Giai đoạn {stage.giaiDoan} ({stage.thoiGianGoc})</strong>
                        <p>{stage.noiDung}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {course.ghiChuChung && (
                  <div className="general-note">
                    <Info size={14} />
                    <p>{course.ghiChuChung}</p>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
