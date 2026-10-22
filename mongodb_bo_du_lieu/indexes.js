// Run in the target database after importing JSON. Creates indexes only.
// sinh_vien._id is the MSSV and already has MongoDB's unique _id index.
db.tkb.createIndex(
  { maLop: 1, maMon: 1, hocKy: 1, namHoc: 1 },
  { unique: true, name: 'lop_mon_hocKy_namHoc_unique' }
);
db.tkb.createIndex(
  { maLop: 1, dotTuyenSinh: 1, hocKy: 1, namHoc: 1 },
  { name: 'tra_cuu_tkb_theo_lop_dot' }
);
