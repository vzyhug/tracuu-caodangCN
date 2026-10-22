# Dữ liệu MongoDB cho tra cứu thời khóa biểu theo MSSV

## Các collection cần import

| File | Collection | Số document | Vai trò |
|---|---|---:|---|
| `sinh_vien.json` | `sinh_vien` | 86 | Thông tin sinh viên, lớp, đợt và lịch sử học tập |
| `mon_hoc.json` | `mon_hoc` | 34 | Danh mục môn học, mỗi môn chỉ dùng một mã |
| `tkb.json` | `tkb` | 91 | Lịch học theo lớp, môn, học kỳ, năm học và đợt áp dụng |

Chỉ import 3 file trên. `tra_cuu_mau.json` là kết quả minh họa, không phải collection.
Tất cả file là JSON UTF-8 dạng mảng, dùng được với MongoDB Compass.
Các file đầu vào `dssv.json`, `da_hoc.json`, PDF và CSV được giữ nguyên.

## Quan hệ và nguyên tắc thiết kế

- `sinh_vien._id` chính là MSSV, kiểu chuỗi. Tra cứu bằng `_id`, không chuyển thành số.
- `sinh_vien.daoTao.maLop` nối với `tkb.maLop`.
- `sinh_vien.daoTao.dot` phải nằm trong `tkb.dotTuyenSinh`.
- `sinh_vien.theoDoiHocTap[].monHoc[].maMon` và `tkb.maMon` nối tới `mon_hoc._id`.
- Cặp lớp + môn là định danh nghiệp vụ trong mỗi học kỳ/năm học; không tạo trường `Key`.
- Collection `tkb` không đặt `_id` trong file JSON; MongoDB tự sinh `_id`. Index unique trên `(maLop, maMon, hocKy, namHoc)` ngăn trùng nhưng vẫn cho phép cùng lớp/môn ở kỳ sau.
- Mỗi document TKB chỉ chứa một mã lớp. Các dòng giống lịch xuất hiện ở nhiều PDF được gộp, giữ đủ `dotTuyenSinh` và `nguon` tương ứng.
- `nguon[].noiDungGoc` lưu đủ các ô trích từ PDF, kể cả lớp ghép, STT, tiêu đề và ghi chú. `siSoNhomHoc` là sĩ số nhóm in trong PDF, không phải sĩ số đã tính riêng cho lớp sau khi tách.
- Tín chỉ nằm ở TKB theo lớp, không đặt cố định trong danh mục môn: `MĐLN0003` có 2 hoặc 3 tín chỉ tùy ngành trong PDF.
- `buoiHoc` gồm đúng các ngày được ghi trong PDF, giờ 19:00–21:30 theo ghi chú, múi giờ `Asia/Ho_Chi_Minh`. Không tạo buổi cố định cho giai đoạn tự học.
- Ngày được lưu dạng chuỗi `YYYY-MM-DD`, giờ dạng `HH:mm`; không phải BSON Date. Đây là chủ ý để giữ ngày học địa phương, tránh dịch ngày khi đổi múi giờ.

## Một mã môn thống nhất

Mã môn được dùng trực tiếp ở `mon_hoc._id`, `sinh_vien.theoDoiHocTap[].monHoc[].maMon` và `tkb.maMon`. Không lưu mã cũ hoặc mã thay thế song song trong bộ dữ liệu import và kết quả tra cứu.

Các môn đã có trong PDF dùng mã PDF, bao gồm Tiếng Anh `MHMC0105`, Tin học `MHMC0106`, Giáo dục chính trị `MHMC0101`, Pháp luật `MHMC0102`. Lịch sử sinh viên đã được chuyển sang đúng các mã này. Việc chuyển đổi chỉ diễn ra khi tạo bộ dữ liệu, truy vấn không cần bảng quy đổi.

14 môn lịch sử chưa xuất hiện trong TKB giữ nguyên mã MH005–MH018 vì chưa có mã PDF tương ứng. Không tự gán mã mới. Các mã chính thức khác nhau trong PDF được giữ nguyên, kể cả khi tên môn giống nhau giữa hai ngành. Danh mục có 34 mã môn duy nhất.

## Quy tắc hiển thị khi nhập MSSV

1. Tìm `sinh_vien` bằng `_id`.
2. Lấy thông tin sinh viên và tên các môn trong lịch sử từ `mon_hoc`.
3. `monDaHoc` chỉ gồm môn có `daHoc === true`. Đây là trạng thái đã học trong nguồn, không suy ra đã thi đậu.
4. Lấy TKB đúng mã lớp, đợt tuyển sinh, học kỳ và năm học.
5. Loại khỏi lịch dự kiến những môn đã học theo bước 3. Môn không có lịch sử vẫn nằm trong lịch dự kiến.
6. `daHoc: null` giữ nghĩa **chưa xác định**. Không biến thành `false`, không tự loại khỏi TKB. Hiện cờ `canXacMinh` trên các môn này.
7. Trả danh sách môn chưa rõ trạng thái và cảnh báo để giao diện giải thích. Nguồn hiện có 231 trạng thái null thuộc 52 sinh viên.

Lịch sử đã học được xét qua các kỳ có trong dữ liệu; TKB được lọc theo kỳ/năm người dùng chọn. Với dữ liệu hiện tại mặc định học kỳ 2, năm học 2026-2027.

**Phải lọc đợt:** nguồn đợt 1 có 3 môn/lớp; đợt 2 có 7 môn/lớp. Các môn chung của đợt 2 không tự áp cho sinh viên đợt 1 cùng lớp. Nguồn đợt 3 có lịch nhưng danh sách sinh viên hiện chưa có sinh viên đợt 3.

## Import bằng MongoDB Compass

1. Tạo database tùy chọn, ví dụ `tkb_sinh_vien`.
2. Tạo 3 collection theo đúng tên trong bảng.
3. Trong từng collection, chọn **Add Data → Import JSON or CSV file**, chọn file JSON tương ứng.
4. Chạy nội dung `indexes.js` trong mongosh của database để đặt ràng buộc duy nhất và index tra cứu.

Với dữ liệu đã import, dùng script upsert bên dưới khi cập nhật để tránh thêm trùng TKB có `_id` tự sinh.

## Import hoặc cập nhật bằng mongosh

Chạy từ thư mục gốc của dự án, thay URI bằng database của bạn:

```powershell
mongosh "mongodb://localhost:27017/tkb_sinh_vien" --file mongodb/import.js
```

Script tạo index và upsert theo khóa nghiệp vụ, không drop collection, không xóa document khác. Document khớp khóa được thay bằng nội dung file mới; nếu database có trường tự thêm thì cần kiểm tra trước khi chạy. Script cập nhật từng collection, không cam kết giao dịch nguyên tử cho cả 3 collection. Chưa thực hiện import vào database nào trong tác vụ này.

## Tra cứu mẫu trong mongosh

Mở mongosh tại đúng database, từ thư mục gốc dự án:

```javascript
load('mongodb/tra_cuu.js');
traCuuSinhVien('26104020001');
traCuuSinhVien('26104150548', 2, '2026-2027');
```

Kết quả gồm `thongTinSinhVien`, `monDaHoc`, `monChuaRoTrangThai`, `lichHocDuKien`, `canhBao`. MSSV không tồn tại trả `timThay: false`.

`tra_cuu.js` là truy vấn tham khảo phía máy chủ/mongosh. Khi xây API, cần chuyển truy vấn sang driver của ứng dụng; không chạy trực tiếp file này trên trình duyệt.

## Kiểm tra đã thực hiện

Đã kiểm tra tính duy nhất của MSSV, toàn bộ tham chiếu mã môn, đủ TKB đúng lớp/đợt cho 86 sinh viên, bảo toàn trạng thái true/null, nội dung nguồn PDF và 3 buổi/môn. Truy vấn được chạy với dữ liệu JSON trong mô phỏng collection cho toàn bộ 86 sinh viên, bao gồm MSSV không tồn tại. Chưa kiểm tra bằng MongoDB server thực tế; xem `tra_cuu_mau.json` để xem hai kết quả mẫu.
