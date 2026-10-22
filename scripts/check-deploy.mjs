import { loadEnv } from 'vite';
const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
if (env.VITE_DATA_MODE !== 'firebase' || env.VITE_USE_EMULATORS === 'true') throw Error('Trước khi deploy: VITE_DATA_MODE=firebase và VITE_USE_EMULATORS=false.');
for (const key of ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID']) {
  if (!env[key]) throw Error('Thiếu cấu hình deploy: ' + key);
}
if (!env.VITE_FIREBASE_APPCHECK_SITE_KEY) {
  console.warn('Lưu ý: Chưa cấu hình VITE_FIREBASE_APPCHECK_SITE_KEY. Bỏ qua kiểm tra App Check.');
}
if (env.VITE_FIREBASE_PROJECT_ID.startsWith('demo-')) throw Error('Project demo không dùng để deploy thật.');
console.log('Cấu hình web sẵn sàng build cho Firebase. Kiểm tra project CLI bằng firebase use trước khi deploy.');
