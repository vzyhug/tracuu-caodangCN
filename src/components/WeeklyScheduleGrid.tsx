import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Printer, RotateCcw, Clock, Video } from 'lucide-react';
import type { PlannedCourse } from '../types';

interface WeeklyScheduleGridProps {
  courses: PlannedCourse[];
  defaultDate?: string;
}

type ViewMode = 'all' | 'study' | 'exam';

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateVN(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

const WEEKDAYS = [
  { name: 'Thứ 2', short: 'T2' },
  { name: 'Thứ 3', short: 'T3' },
  { name: 'Thứ 4', short: 'T4' },
  { name: 'Thứ 5', short: 'T5' },
  { name: 'Thứ 6', short: 'T6' },
  { name: 'Thứ 7', short: 'T7' },
  { name: 'Chủ Nhật', short: 'CN' },
];

const SHIFTS = [
  { id: 'morning', label: 'Sáng', sub: '07:00 – 11:30' },
  { id: 'afternoon', label: 'Chiều', sub: '12:30 – 17:00' },
  { id: 'evening', label: 'Tối', sub: '17:30 – 21:30' },
] as const;

export default function WeeklyScheduleGrid({ courses, defaultDate }: WeeklyScheduleGridProps) {
  // Tìm ngày có buổi học đầu tiên hoặc ngày hiện tại
  const initialDate = useMemo(() => {
    if (defaultDate) return new Date(`${defaultDate}T00:00:00`);
    const allSessions = courses.flatMap(c => c.buoiHoc.map(b => b.ngay)).sort();
    if (allSessions.length > 0) {
      return new Date(`${allSessions[0]}T00:00:00`);
    }
    return new Date();
  }, [courses, defaultDate]);

  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(initialDate));
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // Tính 7 ngày trong tuần hiện tại
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(currentMonday, i);
      const iso = formatDateISO(date);
      const display = formatDateVN(date);
      return {
        ...WEEKDAYS[i],
        date,
        iso,
        display,
        isToday: iso === formatDateISO(new Date()),
      };
    });
  }, [currentMonday]);

  // Gom các buổi học vào từng ngày và ca
  const gridSessions = useMemo(() => {
    const map = new Map<string, Array<{
      course: PlannedCourse;
      session: PlannedCourse['buoiHoc'][number];
      shift: 'morning' | 'afternoon' | 'evening';
    }>>();

    for (const course of courses) {
      for (const session of course.buoiHoc) {
        // Lọc theo chế độ xem
        if (viewMode === 'study' && session.loai !== 'huong_dan') continue;
        if (viewMode === 'exam' && session.loai === 'huong_dan') continue;

        // Phân loại ca dựa vào giờ bắt đầu
        const startHour = parseInt(session.gioBatDau.split(':')[0], 10) || 19;
        let shift: 'morning' | 'afternoon' | 'evening' = 'evening';
        if (startHour < 12) shift = 'morning';
        else if (startHour < 17) shift = 'afternoon';

        const key = `${session.ngay}_${shift}`;
        const list = map.get(key) || [];
        list.push({ course, session, shift });
        map.set(key, list);
      }
    }
    return map;
  }, [courses, viewMode]);

  // Đếm tổng số buổi trong tuần đang xem
  const totalInWeek = useMemo(() => {
    let count = 0;
    for (const day of weekDays) {
      for (const shift of SHIFTS) {
        const items = gridSessions.get(`${day.iso}_${shift.id}`);
        if (items) count += items.length;
      }
    }
    return count;
  }, [gridSessions, weekDays]);

  const handlePrevWeek = () => setCurrentMonday(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentMonday(prev => addDays(prev, 7));
  const handleCurrentWeek = () => setCurrentMonday(getMonday(initialDate));
  const handlePrint = () => window.print();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setCurrentMonday(getMonday(new Date(`${e.target.value}T00:00:00`)));
    }
  };

  return (
    <div className="huit-schedule-section">
      {/* Thanh điều khiển HUIT */}
      <div className="huit-controls-bar">
        <div className="view-mode-toggles" role="group" aria-label="Chế độ xem lịch">
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'study' ? 'active' : ''}`}
            onClick={() => setViewMode('study')}
          >
            Lịch học
          </button>
          <button
            type="button"
            className={`toggle-btn ${viewMode === 'exam' ? 'active' : ''}`}
            onClick={() => setViewMode('exam')}
          >
            Lịch thi
          </button>
        </div>

        <div className="date-picker-wrap">
          <Calendar size={16} className="picker-icon" />
          <input
            type="date"
            className="huit-date-input"
            value={formatDateISO(currentMonday)}
            onChange={handleDateChange}
            aria-label="Chọn ngày xem lịch"
          />
          <span className="week-range-text">
            Tuần: <strong>{weekDays[0].display}</strong> — <strong>{weekDays[6].display}</strong>
          </span>
        </div>

        <div className="action-buttons-wrap">
          <button type="button" className="action-btn" onClick={handleCurrentWeek} title="Về tuần có lịch">
            <RotateCcw size={14} />
            <span>Hiện tại</span>
          </button>
          <button type="button" className="action-btn print-btn" onClick={handlePrint} title="In thời khóa biểu">
            <Printer size={14} />
            <span>In lịch</span>
          </button>
          <div className="nav-btn-group">
            <button type="button" className="action-btn nav-btn" onClick={handlePrevWeek} title="Tuần trước">
              <ChevronLeft size={16} />
              <span>Trở về</span>
            </button>
            <button type="button" className="action-btn nav-btn" onClick={handleNextWeek} title="Tuần tiếp theo">
              <span>Tiếp</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Thanh Chú thích màu các ô tiết học */}
      <div className="schedule-legend-bar">
        <div className="legend-header-label">
          <span>Chú thích màu tiết học:</span>
        </div>
        <div className="legend-chips-wrap">
          <div className="legend-chip chip-elearning">
            <span className="chip-color-square green" />
            <span><strong>E-Learning</strong> (Tự học trực tuyến)</span>
          </div>
          <div className="legend-chip chip-meet">
            <span className="chip-color-square light-blue" />
            <span><strong>Google Meet</strong> (Buổi học trực tuyến)</span>
          </div>
          <div className="legend-chip chip-exam">
            <span className="chip-color-square yellow" />
            <span><strong>Tổng ôn / Thi</strong> (Ôn tập & kiểm tra giữa kỳ / Cuối kỳ)</span>
          </div>
        </div>
        <div className="week-total-counter">
          Tuần này: <strong>{totalInWeek}</strong> buổi học / thi
        </div>
      </div>

      {/* Bảng Lịch dạng Lưới (Grid) */}
      <div className="huit-grid-container">
        <table className="huit-schedule-table">
          <thead>
            <tr>
              <th className="col-shift">Ca học</th>
              {weekDays.map(day => (
                <th key={day.iso} className={`col-day ${day.isToday ? 'is-today' : ''}`}>
                  <span className="day-name">{day.name}</span>
                  <span className="day-date">{day.display}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map(shift => (
              <tr key={shift.id}>
                <td className="row-shift-header">
                  <span className="shift-title">{shift.label}</span>
                  <span className="shift-time">{shift.sub}</span>
                </td>
                {weekDays.map(day => {
                  const items = gridSessions.get(`${day.iso}_${shift.id}`) || [];
                  return (
                    <td
                      key={`${day.iso}_${shift.id}`}
                      className={`cell-session ${day.isToday ? 'is-today-cell' : ''} ${items.length ? 'has-course' : ''}`}
                    >
                      {items.map(({ course, session }, idx) => {
                        const isReview = session.loai !== 'huong_dan';
                        const cardTypeClass = isReview ? 'exam-card' : 'meet-card';
                        return (
                          <div
                            key={`${course.maMon}_${idx}`}
                            className={`huit-course-card ${cardTypeClass}`}
                          >
                            <div className="card-top">
                              <span className="course-name" title={course.tenMon}>
                                {course.tenMon}
                              </span>
                            </div>
                            <div className="card-meta">
                              <span className="course-code-badge">
                                {course.maMon} · {course.maLop}
                              </span>
                            </div>
                            <div className="card-time">
                              <Clock size={12} />
                              <span>{session.gioBatDau} – {session.gioKetThuc}</span>
                            </div>
                            <div className="card-location">
                              <Video size={12} />
                              <span>
                                {isReview ? 'Tổng ôn / Thi' : 'Google Meet'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
