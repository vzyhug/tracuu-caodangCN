// mongosh: load('mongodb/tra_cuu.js'); traCuuSinhVien('26104020001');
// Read only. The database must have sinh_vien, mon_hoc and tkb collections.
globalThis.traCuuSinhVien = function (mssv, hocKy = 2, namHoc = '2026-2027') {
  const sv = db.sinh_vien.findOne({ _id: String(mssv).trim() });
  if (!sv) return { timThay: false, thongBao: 'Không tìm thấy sinh viên.' };
  const history = (sv.theoDoiHocTap || []).flatMap(term =>
    term.monHoc.map(mon => ({ ...mon, hocKy: term.hocKy, namHoc: term.namHoc }))
  );
  const learned = new Set(history.filter(x => x.daHoc === true).map(x => x.maMon));
  const scheduled = db.tkb.find({
    maLop: sv.daoTao.maLop,
    dotTuyenSinh: sv.daoTao.dot,
    hocKy,
    namHoc,
  }).toArray();
  const subjectCodes = [...new Set([...history.map(x => x.maMon), ...scheduled.map(x => x.maMon)])];
  const subjects = new Map(db.mon_hoc.find({ _id: { $in: subjectCodes } }).toArray().map(x => [x._id, x]));
  const named = row => ({ ...row, tenMon: subjects.get(row.maMon)?.tenMon || row.maMon });
  const { theoDoiHocTap, ...thongTinSinhVien } = sv;
  const seenLearned = new Set();
  const monDaHoc = history.filter(x => {
    if (x.daHoc !== true || seenLearned.has(x.maMon)) return false;
    seenLearned.add(x.maMon);
    return true;
  }).map(named);
  const lichHocDuKien = scheduled.filter(x => !learned.has(x.maMon)).map(row => {
    const { _id, nguon, ...display } = row;
    const currentHistory = history.filter(x => x.maMon === row.maMon);
    const status = currentHistory.some(x => x.daHoc === false) ? 'chua_hoc'
      : currentHistory.some(x => x.daHoc === null) ? 'chua_xac_dinh'
      : 'chua_co_lich_su';
    return { ...named(display), trangThaiHocTap: status, canXacMinh: status === 'chua_xac_dinh' };
  }).sort((a, b) => a.ngayBatDau.localeCompare(b.ngayBatDau) || a.maMon.localeCompare(b.maMon));
  return {
    timThay: true,
    thongTinSinhVien,
    hocKy,
    namHoc,
    monDaHoc,
    monChuaRoTrangThai: history.filter(x => x.daHoc === null && !learned.has(x.maMon)).map(named),
    lichHocDuKien,
    canhBao: [
      ...(history.some(x => x.daHoc === null && !learned.has(x.maMon))
        ? ['Có môn chưa xác định đã học hay chưa. Lịch dự kiến vẫn giữ các môn này để kiểm tra.'] : []),
      ...(!scheduled.length ? ['Chưa có TKB cho lớp, đợt, học kỳ và năm học đã chọn.'] : []),
    ],
  };
};
