# CỔNG THÔNG TIN SINH VIÊN · TRA CỨU HỌC TẬP & THỜI KHÓA BIỂU
> **Trường Cao đẳng Công nghệ Sài Gòn**  
> Ứng dụng tra cứu thông tin sinh viên, lịch học theo tuần và kế hoạch học tập trực tuyến xây dựng bằng **React**, **TypeScript** và **Google Cloud Firestore**.

---

## 1. Trải nghiệm nhanh trực tuyến (Demo Review)

Khách hàng và người đánh giá có thể xem và kiểm thử trực tiếp trên mọi trình duyệt (Máy tính, Điện thoại, Máy tính bảng) mà **không cần cài đặt hay cấu hình bất kỳ phần mềm nào**:

👉 **Link truy cập chính thức (Vĩnh viễn): [https://test-tracuu.web.app](https://test-tracuu.web.app)**  
*(Link dự phòng: [https://test-tracuu.firebaseapp.com](https://test-tracuu.firebaseapp.com))*

### Bảng mã số sinh viên (MSSV) để test các trạng thái thực tế:

| Trạng thái học tập | MSSV mẫu | Họ và tên sinh viên | Lớp đào tạo | Ghi chú kiểm thử |
| :--- | :---: | :--- | :---: | :--- |
| 🟢 **Đang học** | `26104020001` | Hà Văn Tấn An | `CX261CT01` | Khớp 3 môn học dự kiến, hiển thị đủ lịch tuần và tiến trình |
| 🟢 **Đang học** | `26104020002` | Phạm Quang Trường Giang | `CX261CT01` | Lớp CNTT đợt 1 |
| 🟡 **Bảo lưu** | `26104130010` | Lý Hữu Bằng | `CX261VT01` | Có huy hiệu Bảo lưu vàng cam & cảnh báo hồ sơ |
| 🔴 **Bỏ học** | `26104020006` | Đoàn Huỳnh Khoa | `CX261CT01` | Có huy hiệu Bỏ học đỏ & cảnh báo hồ sơ đào tạo |

### Các tính năng nổi bật trên giao diện:
- **Bảng lịch học theo tuần dạng lưới (Grid View):** Bố cục 7 ngày (Thứ 2 đến Chủ Nhật) theo 3 ca thời gian (*Sáng 07:00 – 11:30*, *Chiều 12:30 – 17:00*, *Tối 17:30 – 21:30*).
- **Phân loại màu sắc tiết học trực quan:**
  - 🟩 **E-Learning:** Tự học trực tuyến.
  - 🟦 **Google Meet:** Buổi học trực tuyến với giảng viên (Tối 19:00 – 21:30).
  - 🟨 **Tổng ôn / Thi:** Buổi ôn tập & kiểm tra giữa kỳ / cuối kỳ.
- **Thanh điều khiển thông minh:** Chuyển đổi bộ lọc (*Tất cả / Lịch học / Lịch thi*), chọn ngày xem lịch, lùi/tiến tuần và nút **"In lịch"** chuẩn trang in A4.
- **Bảo mật và riêng tư:** Không hiển thị danh sách gợi ý MSSV công khai, tra cứu chính xác và độc lập theo từng sinh viên.

---

## 2. Hướng dẫn chạy dự án cục bộ (Local Development)

### Yêu cầu môi trường:
- **Node.js**: Phiên bản `20.x` hoặc `22.x` trở lên.
- **Trình quản lý gói**: `npm` (đi kèm sẵn với Node.js).

### Các bước cài đặt và khởi động:

```powershell
# 1. Clone mã nguồn về máy
git clone https://github.com/vzyhug/tracuu-caodangCN.git
cd tracuu-caodangCN

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Tạo file cấu hình biến môi trường .env.local ở thư mục gốc:
# (Lấy thông tin từ Firebase Console > Project Settings > General > Your Apps)
VITE_DATA_MODE=firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_USE_EMULATORS=false

# 4. Khởi động Web Dev Server
npm run dev
```

Mở trình duyệt tại địa chỉ: **`http://127.0.0.1:5173`** để trải nghiệm.

### Các lệnh hữu ích khác:

```powershell
# Kiểm tra logic nghiệp vụ và dữ liệu (Unit Test)
npm test

# Đóng gói sản phẩm cho Production
npm run build

# Triển khai phiên bản mới lên Firebase Hosting
npx firebase deploy --only hosting
```

---

## 3. Tổng quan công nghệ sử dụng trong dự án

Ứng dụng được thiết kế theo kiến trúc **Serverless hiện đại**, tối ưu trải nghiệm người dùng, tải trang nhanh và vận hành 100% miễn phí trên hạ tầng Google Cloud:

### 🎨 Frontend:
- **React 19 & TypeScript:** Xây dựng giao diện hướng thành phần (Component-based), kiểm soát kiểu dữ liệu tĩnh nghiêm ngặt, hạn chế tối đa lỗi runtime.
- **Vite 8:** Công cụ build thế hệ mới với tốc độ Hot Module Replacement (HMR) tức thì và khả năng bundle tối ưu dung lượng (chưa đến 300KB gzipped).
- **Lucide React:** Bộ icon SVG nhất quán, hiện đại và chuẩn mực.
- **CSS3 thuần (Custom Stylesheet):**
  - Tối ưu hóa Flexbox & CSS Grid linh hoạt.
  - Thiết kế thích ứng (**Responsive Design**) mượt mà từ màn hình điện thoại, máy tính bảng đến desktop.
  - Tích hợp stylesheet in ấn (**Print Media Stylesheet**) giúp xuất thời khóa biểu sang PDF hoặc in giấy A4 chuẩn đẹp, tự động ẩn thanh công cụ thừa.

### ☁️ Cơ sở dữ liệu & Hạ tầng Đám mây (Cloud & Database):
- **Google Cloud Firestore (Native NoSQL):** 
  - Cơ sở dữ liệu tài liệu NoSQL phân tán toàn cầu với độ trễ truy vấn cực thấp.
  - Cấu trúc dữ liệu phân tách rõ ràng thành các collection: `sinhvien` (86 hồ sơ), `tkb` (91 lịch học), `monhoc` (34 danh mục môn).
  - Tự động đối chiếu thông tin theo mã lớp (`maLop`), học kỳ (`hocKy`), năm học (`namHoc`) và đợt tuyển sinh (`dotTuyenSinh`).
- **Firebase Web SDK v13:** 
  - Kết nối trực tiếp từ client-side đến Firestore thông qua REST/gRPC an toàn.
  - Không cần duy trì server backend truyền thống, giảm thiểu chi phí và thời gian triển khai.
- **Firestore Security Rules:** 
  - Phân quyền bảo mật: Cho phép quyền đọc công khai dữ liệu cần thiết phục vụ tra cứu, **ngăn chặn tuyệt đối mọi hành vi sửa đổi hoặc xóa dữ liệu từ client** (`allow read: if true; allow write: if false;`).
- **Firebase Hosting:** 
  - Lưu trữ và phân phối tĩnh (Static Hosting) trên mạng lưới CDN toàn cầu của Google với chứng chỉ SSL/HTTPS bảo mật vĩnh viễn.

---
*Bản quyền © 2026 · Cổng thông tin sinh viên Trường Cao đẳng Công nghệ Sài Gòn.*
