import { useRef, useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, CalendarDays, CheckCheck, CircleHelp, GraduationCap, LoaderCircle, Search, ShieldCheck, TriangleAlert } from 'lucide-react';
import { isDemo, lookupStudent } from './services/lookup';
import type { LookupResult } from './types';
import StudentCard from './components/StudentCard';
import ScheduleView from './components/ScheduleView';
import CourseHistory from './components/CourseHistory';

type Tab = 'schedule' | 'learned' | 'unknown';
export default function App() {
  const [mssv, setMssv] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('schedule');
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const requestVersion = useRef(0);
  async function search(value: string) {
    const version = ++requestVersion.current;
    setError(''); setResult(null); setLoading(true);
    try {
      const response = await lookupStudent({ mssv: value, hocKy: 2, namHoc: '2026-2027' });
      if (version !== requestVersion.current) return;
      setResult(response); setTab('schedule');
      requestAnimationFrame(() => resultHeading.current?.focus({ preventScroll: true }));
    } catch (e) { if (version === requestVersion.current) setError((e as Error).message); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }
  function submit(e: FormEvent) { e.preventDefault(); void search(mssv); }
  const tabs = [
    { id: 'schedule' as const, label: 'Lịch học dự kiến', icon: CalendarDays, count: result?.lichHocDuKien.length || 0 },
    { id: 'learned' as const, label: 'Môn đã học', icon: CheckCheck, count: result?.monDaHoc.length || 0 },
    { id: 'unknown' as const, label: 'Chưa rõ trạng thái', icon: CircleHelp, count: result?.monChuaRoTrangThai.length || 0 },
  ];
  return <>
    <header className="site-header"><a className="brand" href="./" aria-label="Cổng tra cứu sinh viên, trang chủ"><span className="brand-mark"><GraduationCap size={25} /></span><span>CỔNG SINH VIÊN<small>Tra cứu học tập</small></span></a>
      <span className="semester"><span className="live-dot" />HỌC KỲ II · 2026–2027</span></header>
    <main className="container">
      <section className="intro" aria-labelledby="page-title"><div className="intro-copy"><div className="eyebrow">THÔNG TIN HỌC TẬP TRONG TẦM TAY</div>
        <h1 id="page-title">Chủ động lịch học.<br /><em>Sẵn sàng cho học kỳ mới.</em></h1>
        <p>Nhập mã số sinh viên để xem thông tin cá nhân,<br className="desktop-break" /> các môn đã học và thời khóa biểu dự kiến của bạn.</p></div>
        <div className="intro-art" aria-hidden="true"><div className="art-circle" /><div className="art-calendar"><div className="art-top">HỌC KỲ II <span>2026</span></div><div className="art-lines"><i /><i /><i /><i /><i /><i /><i className="selected" /><i /><i /></div><div className="art-caption"><CheckCheck size={17} /> Sẵn sàng học tập</div></div><span className="floating-icon"><BookOpen size={25} /></span></div>
      </section>
      <section className="search-panel" aria-labelledby="search-title"><div className="search-heading"><Search size={19} aria-hidden="true" /><h2 id="search-title">Tra cứu bằng mã số sinh viên</h2>{isDemo && <span className="demo-badge">Bản minh họa</span>}</div>
        <form onSubmit={submit} noValidate><div className="input-wrap"><label htmlFor="mssv">Mã số sinh viên</label><div className="input-shell"><Search size={19} aria-hidden="true" /><input id="mssv" value={mssv} onChange={e => setMssv(e.target.value)} inputMode="numeric" autoComplete="off" maxLength={11} placeholder="Nhập 11 chữ số MSSV" aria-describedby={error ? 'lookup-error' : 'lookup-hint'} aria-invalid={!!error} /></div></div>
          <button className="primary-button" type="submit" disabled={loading || !mssv.trim()}>{loading ? <><LoaderCircle size={18} className="spin" />Đang tra cứu</> : <>Tra cứu ngay<ArrowRight size={18} /></>}</button></form>
        {error && <p className="error-message" id="lookup-error" role="alert"><TriangleAlert size={16} />{error}</p>}
        <div className="search-bottom"><p id="lookup-hint"><ShieldCheck size={14} />Thông tin được đối chiếu theo lớp và đợt tuyển sinh.</p>{isDemo && <div className="demo-links"><span>Thử mã mẫu:</span>{['00000000001', '00000000002'].map((id, i) => <button disabled={loading} key={id} onClick={() => { setMssv(id); void search(id); }}>Đợt {i + 1}<ArrowRight size={12} /></button>)}</div>}</div>
      </section>
      <div className="result-region" aria-live="polite" aria-busy={loading}>
        {loading && <div className="loading-panel"><LoaderCircle className="spin" size={25} /><p>Đang đối chiếu thông tin và thời khóa biểu…</p></div>}
        {result && <section className="results"><h2 className="sr-only" tabIndex={-1} ref={resultHeading}>Kết quả tra cứu {result.thongTinSinhVien.hoTen}</h2>
          <StudentCard student={result.thongTinSinhVien} />
          <div className="results-title"><div><div className="eyebrow">KẾ HOẠCH HỌC TẬP</div><h2>Học kỳ của bạn</h2></div><span>Học kỳ {result.hocKy} · {result.namHoc}</span></div>
          <div className="summary-grid"><div><CalendarDays size={20} /><strong>{result.lichHocDuKien.length}</strong><span>Môn dự kiến</span></div><div><CheckCheck size={20} /><strong>{result.monDaHoc.length}</strong><span>Môn đã học</span></div><div><BookOpen size={20} /><strong>{result.lichHocDuKien.reduce((n, c) => n + c.soTinChi, 0)}</strong><span>Tín chỉ dự kiến</span></div></div>
          {result.canhBao.map((message, i) => <p className="notice" key={i}><CircleHelp size={17} />{message}</p>)}
          <div className="content-tabs" role="tablist" aria-label="Thông tin học tập">{tabs.map((t, index) => <button key={t.id} role="tab" id={`tab-${t.id}`} tabIndex={tab === t.id ? 0 : -1} aria-selected={tab === t.id} aria-controls="study-panel" onClick={() => setTab(t.id)} onKeyDown={event => {
            const positions: Record<string, number> = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
            if (event.key in positions) { event.preventDefault(); const next = tabs[positions[event.key]]; setTab(next.id); document.getElementById(`tab-${next.id}`)?.focus(); }
          }}><t.icon size={17} /><span>{t.label}</span><b>{t.count}</b></button>)}</div>
          <div id="study-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {tab === 'schedule' && <><p className="panel-note">Giờ Việt Nam (GMT+7) · Học qua Google Meet / E-Learning · Lịch dự kiến, đối chiếu thông báo của nhà trường.</p><ScheduleView courses={result.lichHocDuKien} /></>}
            {tab === 'learned' && <><p className="panel-note">Các môn được ghi nhận đã học trong dữ liệu, không thay thế bảng điểm.</p><CourseHistory courses={result.monDaHoc} /></>}
            {tab === 'unknown' && <><p className="panel-note">Chưa có xác nhận đã học hay chưa. Các môn có lịch vẫn được giữ trong kế hoạch dự kiến.</p><CourseHistory courses={result.monChuaRoTrangThai} unknown /></>}
          </div>
        </section>}
        {!loading && !result && !error && <section className="welcome-state"><div className="welcome-icon"><CalendarDays size={26} /></div><h2>Lịch học của bạn bắt đầu từ đây</h2><p>Tra cứu một lần, theo dõi đầy đủ thông tin học tập.<br />Môn đã học sẽ được loại khỏi lịch học dự kiến.</p><div className="welcome-features"><span><GraduationCap size={16} />Đúng sinh viên</span><span><CheckCheck size={16} />Đúng môn học</span><span><CalendarDays size={16} />Đúng lớp & đợt</span></div></section>}
      </div>
    </main><footer className="site-footer"><span>Cổng tra cứu sinh viên</span><span>Đào tạo trực tuyến · Năm học 2026–2027</span></footer>
  </>;
}
