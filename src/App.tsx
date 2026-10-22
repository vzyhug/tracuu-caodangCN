import { useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCheck,
  CircleHelp,
  GraduationCap,
  LoaderCircle,
  Search,
  ShieldCheck,
  TriangleAlert,
  CalendarRange,
  ListFilter,
  CheckCircle2
} from 'lucide-react';
import { isDemo, lookupStudent } from './services/lookup';
import type { LookupResult } from './types';
import StudentCard from './components/StudentCard';
import WeeklyScheduleGrid from './components/WeeklyScheduleGrid';
import ScheduleView from './components/ScheduleView';
import CourseHistory from './components/CourseHistory';

type Tab = 'weekly' | 'courses' | 'learned' | 'unknown';

export default function App() {
  const [mssv, setMssv] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('weekly');
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const requestVersion = useRef(0);

  async function search(value: string) {
    const version = ++requestVersion.current;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const response = await lookupStudent({ mssv: value, hocKy: 2, namHoc: '2026-2027' });
      if (version !== requestVersion.current) return;
      setResult(response);
      setTab('weekly');
      requestAnimationFrame(() => resultHeading.current?.focus({ preventScroll: true }));
    } catch (e) {
      if (version === requestVersion.current) setError((e as Error).message);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void search(mssv);
  }

  const tabs = [
    {
      id: 'weekly' as const,
      label: 'Lịch học theo tuần (Dạng lưới)',
      icon: CalendarRange,
      count: result?.lichHocDuKien.reduce((sum, c) => sum + c.buoiHoc.length, 0) || 0,
      badgeText: 'buổi',
    },
    {
      id: 'courses' as const,
      label: 'Kế hoạch học tập & Tiến trình',
      icon: ListFilter,
      count: result?.lichHocDuKien.length || 0,
      badgeText: 'môn',
    },
    {
      id: 'learned' as const,
      label: 'Môn đã hoàn thành',
      icon: CheckCircle2,
      count: result?.monDaHoc.length || 0,
      badgeText: 'môn',
    },
    ...(result?.monChuaRoTrangThai.length
      ? [
          {
            id: 'unknown' as const,
            label: 'Chưa rõ trạng thái',
            icon: CircleHelp,
            count: result.monChuaRoTrangThai.length,
            badgeText: 'môn',
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Topbar trường Cao đẳng Công nghệ Sài Gòn */}
      <header className="huit-site-header">
        <div className="header-inner">
          <a className="huit-brand" href="./" aria-label="Cổng thông tin sinh viên">
            <span className="brand-logo-circle">
              <GraduationCap size={28} />
            </span>
            <div className="brand-text-block">
              <span className="school-name">TRƯỜNG CAO ĐẲNG CÔNG NGHỆ SÀI GÒN</span>
              <span className="portal-name">CỔNG THÔNG TIN SINH VIÊN · HỆ THỐNG TRA CỨU HỌC TẬP</span>
            </div>
          </a>
          <div className="huit-term-badge">
            <span className="term-pulse-dot" />
            <span>HỌC KỲ II · NĂM HỌC 2026–2027</span>
          </div>
        </div>
      </header>

      <main className="huit-main-container">
        {/* Banner Tra cứu */}
        <section className="huit-search-section" aria-labelledby="search-headline">
          <div className="search-box-card">
            <div className="search-header-row">
              <div className="search-title-wrap">
                <Search size={22} className="search-icon-title" />
                <div>
                  <h1 id="search-headline" className="search-main-heading">
                    Tra cứu Lịch học & Kế hoạch học tập
                  </h1>
                  <p className="search-sub-heading">
                    Nhập đúng Mã số sinh viên của bạn để xem thời khóa biểu, tiến trình học tập và kết quả đào tạo.
                  </p>
                </div>
              </div>
              {isDemo && <span className="huit-demo-badge">Chế độ Demo</span>}
            </div>

            <form onSubmit={submit} className="huit-search-form" noValidate>
              <div className="huit-input-group">
                <label htmlFor="mssv-input">Mã số sinh viên (MSSV)</label>
                <div className="input-field-shell">
                  <Search size={18} className="field-icon" />
                  <input
                    id="mssv-input"
                    value={mssv}
                    onChange={e => setMssv(e.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={11}
                    placeholder="Nhập 11 chữ số mã số sinh viên..."
                    aria-describedby={error ? 'lookup-error-msg' : 'lookup-hint-msg'}
                    aria-invalid={!!error}
                  />
                </div>
              </div>
              <button
                className="huit-submit-button"
                type="submit"
                disabled={loading || !mssv.trim()}
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="spin" />
                    <span>Đang tìm kiếm...</span>
                  </>
                ) : (
                  <>
                    <span>Tra cứu ngay</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="huit-error-alert" id="lookup-error-msg" role="alert">
                <TriangleAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="search-footer-info">
              <p id="lookup-hint-msg">
                <ShieldCheck size={14} /> Hệ thống bảo mật thông tin: Dữ liệu được tra cứu riêng tư theo từng mã số sinh viên.
              </p>
            </div>
          </div>
        </section>

        {/* Khu vực Hiển thị Kết quả */}
        <div className="huit-results-area" aria-live="polite" aria-busy={loading}>
          {loading && (
            <div className="huit-loading-box">
              <LoaderCircle className="spin" size={36} />
              <p>Đang tải thông tin sinh viên và thời khóa biểu...</p>
            </div>
          )}

          {result && (
            <section className="huit-student-content">
              <h2 className="sr-only" tabIndex={-1} ref={resultHeading}>
                Kết quả tra cứu {result.thongTinSinhVien.hoTen}
              </h2>

              {/* 1. Khối Thông tin cá nhân sinh viên */}
              <StudentCard student={result.thongTinSinhVien} />

              {/* 2. Khối Thống kê Kế hoạch học tập / Học kỳ hiện tại */}
              <div className="huit-overview-strip">
                <div className="overview-title">
                  <div className="overview-tag">TỔNG QUAN HỌC KỲ</div>
                  <h3>Học kỳ {result.hocKy} · Năm học {result.namHoc}</h3>
                </div>
                <div className="overview-stats-cards">
                  <div className="stat-card">
                    <CalendarDays size={24} className="stat-icon" />
                    <div className="stat-text">
                      <strong>{result.lichHocDuKien.length}</strong>
                      <span>Môn học dự kiến</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <CheckCheck size={24} className="stat-icon green" />
                    <div className="stat-text">
                      <strong>{result.monDaHoc.length}</strong>
                      <span>Môn đã hoàn thành</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <BookOpen size={24} className="stat-icon blue" />
                    <div className="stat-text">
                      <strong>{result.lichHocDuKien.reduce((n, c) => n + c.soTinChi, 0)}</strong>
                      <span>Tổng số tín chỉ</span>
                    </div>
                  </div>
                </div>
              </div>

              {result.canhBao.map((message, i) => (
                <div className="huit-notice-bar" key={i}>
                  <CircleHelp size={18} />
                  <span>{message}</span>
                </div>
              ))}

              {/* Thanh Chuyển Tab (Lịch lưới theo tuần / Danh sách môn học / Môn đã học) */}
              <div className="huit-nav-tabs" role="tablist" aria-label="Chế độ xem học tập">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={tab === t.id}
                    className={`huit-tab-item ${tab === t.id ? 'active' : ''}`}
                    onClick={() => setTab(t.id)}
                  >
                    <t.icon size={18} />
                    <span>{t.label}</span>
                    <span className="tab-counter">
                      {t.count} {t.badgeText}
                    </span>
                  </button>
                ))}
              </div>

              {/* Nội dung Tab */}
              <div className="huit-tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
                {tab === 'weekly' && (
                  <WeeklyScheduleGrid courses={result.lichHocDuKien} />
                )}
                {tab === 'courses' && (
                  <ScheduleView courses={result.lichHocDuKien} />
                )}
                {tab === 'learned' && (
                  <CourseHistory courses={result.monDaHoc} />
                )}
                {tab === 'unknown' && (
                  <CourseHistory courses={result.monChuaRoTrangThai} unknown />
                )}
              </div>
            </section>
          )}

          {!loading && !result && !error && (
            <section className="huit-empty-welcome">
              <div className="welcome-illustration">
                <GraduationCap size={48} />
              </div>
              <h2>Cổng tra cứu thông tin sinh viên</h2>
              <p>
                Vui lòng nhập Mã số sinh viên của bạn vào ô tìm kiếm phía trên để tra cứu thời khóa biểu theo tuần
                và kế hoạch học tập chi tiết.
              </p>
              <div className="welcome-features-list">
                <div className="feature-item">
                  <CalendarRange size={20} />
                  <span>Bảng lịch học theo tuần dạng lưới trực quan</span>
                </div>
                <div className="feature-item">
                  <ShieldCheck size={20} />
                  <span>Bảo mật dữ liệu, tra cứu chính xác theo lớp và đợt</span>
                </div>
                <div className="feature-item">
                  <CheckCheck size={20} />
                  <span>Tự động loại trừ các môn đã hoàn thành</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="huit-site-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <strong>TRƯỜNG CAO ĐẲNG CÔNG NGHỆ SÀI GÒN</strong>
            <span>Hệ thống đào tạo trực tuyến · Cơ sở TP. Hồ Chí Minh</span>
          </div>
          <div className="footer-right">
            <span>Cổng tra cứu học tập sinh viên trực tuyến · Bản quyền © 2026</span>
          </div>
        </div>
      </footer>
    </>
  );
}
