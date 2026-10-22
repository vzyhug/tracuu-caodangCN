# Cổng tra cứu sinh viên · React + Cloud Firestore

Nhập MSSV → xem thông tin sinh viên, các môn đã học, các môn chưa rõ trạng thái và thời khóa biểu dự kiến đúng lớp/đợt. Mỗi môn dùng một mã thống nhất.

## Chạy ngay để xem giao diện

```powershell
cd E:\nam4_hk1\TKB_HK2-20262027_Block2\tra-cuu-sinh-vien
npm install
npm run dev
```

Mở http://127.0.0.1:5173. Mặc định chạy **bản minh họa**, dùng hai MSSV giả `00000000001` và `00000000002`, hoặc bấm Đợt 1/Đợt 2. Không có dữ liệu cá nhân thật trong bundle web, không cần tài khoản Firebase để xem bản minh họa. Chế độ này chỉ có hai MSSV mẫu.

Yêu cầu: Node.js 22.12 trở lên cho phát triển (Firebase Functions cấu hình runtime Node.js 22); môi trường hiện tại đã build/test được bằng Node.js 24. Firebase Emulator cần Java 21 trở lên. `package-lock.json` khóa phiên bản các thư viện đã cài và kiểm tra.

## Cấu trúc project

```text
tra-cuu-sinh-vien/
├── src/
│   ├── components/          # Thông tin SV, lịch học, lịch sử môn
│   ├── services/            # Kết nối callable Firebase và chế độ minh họa
│   ├── data/demo.json      # Hai sinh viên GIẢ dùng xem giao diện
│   ├── App.tsx             # Luồng nhập MSSV và hiển thị kết quả
│   └── styles.css          # Giao diện responsive
├── functions/src/
│   ├── index.ts            # Callable traCuuSinhVien, truy vấn Firestore
│   └── domain.ts           # Quy tắc lọc và kiểu dữ liệu dùng chung
├── scripts/
│   ├── prepare-data.mjs    # Chuyển bộ JSON hiện có sang document Firestore
│   ├── import-firestore.mjs# Upsert Firestore bằng Admin SDK
│   ├── prepare-demo.mjs    # Tạo dữ liệu minh họa đã bỏ thông tin cá nhân
│   ├── check-deploy.mjs    # Kiểm tra cấu hình trước khi deploy
│   └── test-emulator.mjs   # Kiểm tra luồng thật trên emulator
├── data/private/           # Dữ liệu thật để import, được .gitignore
├── tests/lookup.test.ts    # Kiểm tra quy tắc cho toàn bộ 86 sinh viên
├── firebase.json           # Hosting, Functions và emulators
├── firestore.rules         # Chặn đọc/ghi trực tiếp từ client
├── firestore.indexes.json # Index lọc TKB theo lớp/đợt/học kỳ/năm
└── .env.example            # Cấu hình Web App Firebase
```

## Cấu trúc Cloud Firestore

```text
sinh_vien/{MSSV}                    86 documents
  hoTen, gioiTinh, ngaySinh, noiSinh
  daoTao: { maLop, bacDaoTao, nganhHoc, dot }
  theoDoiHocTap: [{ hocKy, namHoc, monHoc: [{ maMon, daHoc }] }]

mon_hoc/{maMon}                     34 documents
  tenMon, nhom (nếu có)

tkb/{documentIdOnDinh}               91 documents
  maLop, maMon, hocKy, namHoc, dotTuyenSinh[]
  soTinChi, ngayBatDau, ngayKetThuc, buoiHoc[]
  huongDan, onTapKiemTraGiuaKy, cacGiaiDoan, ghiChuChung, nguon[]
```

MSSV và mã môn là document ID, không cần lưu thêm trường `_id` như MongoDB. ID TKB được tính ổn định từ lớp + môn + học kỳ + năm học, nên import lại cập nhật cùng document. Firestore không có unique compound index như MongoDB; quy tắc ID và bước chuẩn bị dữ liệu bảo đảm không trùng. Import dùng `set` thay nội dung document khớp ID, không xóa document khác.

`data/private/*.json` dùng định dạng `[{ "id": "document-id", "data": { ... } }]` cho script import, không phải định dạng import tích hợp của Firebase Console. **Không dùng chức năng import JSON của Realtime Database cho các file này.** Dữ liệu ngày giữ chuỗi YYYY-MM-DD, giờ HH:mm và múi giờ Việt Nam.

## Chuẩn bị dữ liệu hiện có

```powershell
npm run data:prepare
```

Đọc 3 file ở `../mongodb/` và ghi vào `data/private/`. Có thể chỉ thư mục nguồn khác:

```powershell
npm run data:prepare -- "E:\duong-dan\mongodb"
```

Không đưa `data/private`, `dssv.json` hoặc service-account JSON vào thư mục `public`, `src` hay repository công khai.

## Kiểm tra Firebase ở máy cục bộ

Terminal 1:

```powershell
npm run emulators
```

Terminal 2: import dữ liệu vào emulator, không ghi lên Firebase thật:

```powershell
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
npm run data:import -- --project demo-tra-cuu
Remove-Item Env:FIRESTORE_EMULATOR_HOST
```

Tạo `.env.local` để giao diện gọi emulator:

```dotenv
VITE_DATA_MODE=firebase
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-tra-cuu.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-tra-cuu
VITE_FIREBASE_APP_ID=demo-app-id
VITE_FIREBASE_FUNCTIONS_REGION=asia-southeast1
VITE_USE_EMULATORS=true
```

Khởi động lại `npm run dev`. Lúc này dùng MSSV thật từ danh sách, ví dụ `26104020001` hoặc `26104150548`. App Check được tắt riêng trong Functions emulator. Cổng Emulator UI: http://127.0.0.1:4000.

## Kết nối Firebase thật

1. Tạo project Firebase, tạo database **Cloud Firestore** ở Native mode, ưu tiên cùng khu vực với Functions `asia-southeast1`.
2. Đăng ký Web App trong Firebase Console và lấy `firebaseConfig`.
3. Copy `.env.example` thành `.env.local`, đặt `VITE_DATA_MODE=firebase`, `VITE_USE_EMULATORS=false`, điền `apiKey`, `authDomain`, `projectId`, `appId` của Web App.
4. Đăng ký App Check cho Web App bằng reCAPTCHA v3 và điền public site key vào `VITE_FIREBASE_APPCHECK_SITE_KEY`. Thêm domain Hosting vào cấu hình reCAPTCHA/App Check.
5. Copy `functions/.env.example` thành `functions/.env`, giữ `ENFORCE_APP_CHECK=true`.
6. Dùng Firebase CLI đã có trong devDependencies:

```powershell
npx firebase login
npx firebase use --add
```

Chọn đúng project thật. `.firebaserc` ban đầu là `demo-tra-cuu`, không trỏ vào tài khoản thật nào.

### Đưa dữ liệu lên Firestore

Script import chạy bằng Firebase Admin SDK. Cung cấp Application Default Credentials: ví dụ đặt `GOOGLE_APPLICATION_CREDENTIALS` trỏ đến service account có quyền ghi Firestore, lưu file khóa ở ngoài project.

```powershell
# Chạy từ project; thay bằng project ID và đường dẫn của bạn.
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\firebase-keys\service-account.json"
npm run data:import -- --project YOUR_FIREBASE_PROJECT_ID
Remove-Item Env:GOOGLE_APPLICATION_CREDENTIALS
```

Không giữ `FIRESTORE_EMULATOR_HOST` trong terminal khi muốn import thật. Chỉ `firebase login` chưa cung cấp ADC cho Admin SDK. Không đặt khóa service account vào biến `VITE_*`, mã frontend hoặc Git.

### Build và deploy

```powershell
npm test
npm run deploy
```

Lệnh deploy build frontend/backend, sau đó triển khai Firestore rules/indexes, Functions và Hosting. Cần project Firebase có gói hỗ trợ triển khai Cloud Functions (Blaze); bản xem thử và emulator không cần deploy. Index mới có thể cần chờ xây dựng trước khi truy vấn thật hoạt động. Project này chưa được triển khai lên Firebase thật.

## API trả về cho giao diện

Callable `traCuuSinhVien`, region `asia-southeast1`:

```json
{ "mssv": "26104020001", "hocKy": 2, "namHoc": "2026-2027" }
```

Kết quả: `thongTinSinhVien`, `monDaHoc`, `monChuaRoTrangThai`, `lichHocDuKien`, `canhBao`. Frontend chỉ hiển thị MSSV, họ tên, lớp, ngành, bậc, đợt; backend không trả ngày sinh/nơi sinh hoặc bản trích PDF gốc. Toàn bộ danh sách sinh viên không được tải về trình duyệt.

Quy tắc: lọc đúng lớp + đợt + kỳ/năm; loại môn `daHoc === true`; giữ `null` là chưa xác định và gắn `canXacMinh`; môn chưa có lịch sử vẫn hiện theo TKB. Mã môn liên kết trực tiếp, không giữ mã cũ song song. Đã học không đồng nghĩa đã thi đậu.

Tra cứu chỉ bằng MSSV đúng theo yêu cầu; ai biết MSSV và truy cập được ứng dụng đều có thể xem phần kết quả tra cứu. App Check xác thực ứng dụng, không xác minh danh tính sinh viên.

## Kiểm tra

```powershell
npm test                 # 6 bài kiểm tra nghiệp vụ và toàn bộ 86 SV
npm run build            # TypeScript frontend/backend + Vite
npm run test:integration # Firestore + Functions emulator, cần Java
```

Đã chạy thành công: 6 bài kiểm tra nghiệp vụ cho 86 sinh viên, build ở cả chế độ minh họa và Firebase, kiểm tra callable + Firestore emulator + rules + import lặp không trùng. Đã quét bundle minh họa để bảo đảm không chứa MSSV/họ tên thật. Preview cục bộ trả HTTP 200; chưa kiểm tra trực quan bằng trình duyệt vì công cụ trình duyệt lỗi khởi tạo trong môi trường thực hiện. Chưa deploy hoặc ghi dữ liệu lên Firebase thật.

Tài liệu đối chiếu: [Callable Functions](https://firebase.google.com/docs/functions/callable), [App Check cho Functions](https://firebase.google.com/docs/app-check/cloud-functions), [Firebase Emulator](https://firebase.google.com/docs/emulator-suite).
