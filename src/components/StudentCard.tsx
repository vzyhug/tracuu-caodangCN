import { GraduationCap, User, BookOpen, Building2, MapPin, CheckCircle2, AlertTriangle, PauseCircle } from 'lucide-react';
import type { LookupResult } from '../types';

interface StudentCardProps {
  student: LookupResult['thongTinSinhVien'];
}

export default function StudentCard({ student }: StudentCardProps) {
  const khoaName = 'Khoa Công nghệ thông tin';
  const coSoName = 'Cơ sở đào tạo chính · TP. Hồ Chí Minh';
  const khoaHoc = 'Khóa 2026';

  const trangThai = student.trangThai || 'Đang học';
  const isBoHoc = trangThai === 'Bỏ học';
  const isBaoLuu = trangThai === 'Bảo lưu';

  return (
    <section className={`huit-student-profile ${isBoHoc ? 'profile-dropped' : isBaoLuu ? 'profile-suspended' : ''}`} aria-labelledby="student-fullname">
      {/* Cột trái: Avatar & Thông tin cốt lõi */}
      <div className="profile-badge-col">
        <div className="avatar-wrapper">
          <div className="avatar-ring">
            <User size={38} className="avatar-icon" />
          </div>
          {isBoHoc ? (
            <span className="status-pill dropped">
              <AlertTriangle size={12} /> Bỏ học
            </span>
          ) : isBaoLuu ? (
            <span className="status-pill suspended">
              <PauseCircle size={12} /> Bảo lưu
            </span>
          ) : (
            <span className="status-pill active">
              <CheckCircle2 size={12} /> Đang học
            </span>
          )}
        </div>
        <div className="profile-main-title">
          <div className="portal-tag">THÔNG TIN SINH VIÊN</div>
          <h2 id="student-fullname" className="student-name">
            {student.hoTen}
          </h2>
          <div className="mssv-badge">
            <span>MSSV:</span>
            <strong>{student.mssv}</strong>
          </div>
        </div>
      </div>

      {/* Cột phải: Lưới chi tiết học tập & đào tạo */}
      <div className="profile-details-grid">
        <div className="detail-item">
          <span className="detail-label">
            <GraduationCap size={14} /> Lớp sinh hoạt
          </span>
          <span className="detail-value highlight">{student.maLop}</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">
            <BookOpen size={14} /> Ngành học
          </span>
          <span className="detail-value">{student.nganhHoc}</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">
            <Building2 size={14} /> Khoa quản lý
          </span>
          <span className="detail-value">{khoaName}</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">
            <GraduationCap size={14} /> Bậc đào tạo
          </span>
          <span className="detail-value">
            {student.bacDaoTao} · Đợt {student.dot} ({khoaHoc})
          </span>
        </div>

        <div className="detail-item col-full">
          <span className="detail-label">
            <MapPin size={14} /> Cơ sở đào tạo
          </span>
          <span className="detail-value">{coSoName}</span>
        </div>
      </div>
    </section>
  );
}
