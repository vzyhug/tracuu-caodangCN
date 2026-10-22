import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import type { LookupInput, LookupResult } from '../types';
const env = import.meta.env;
if (!env.VITE_FIREBASE_PROJECT_ID || !env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_APP_ID) {
  throw new Error('Chưa cấu hình Firebase. Điền thông tin Web App trong .env.local.');
}
const app = initializeApp({ apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID });
const useEmulators = env.VITE_USE_EMULATORS === 'true';
if (!useEmulators) {
  if (!env.VITE_FIREBASE_APPCHECK_SITE_KEY) throw new Error('Chưa cấu hình App Check cho ứng dụng Firebase.');
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(env.VITE_FIREBASE_APPCHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
}
const functions = getFunctions(app, env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-southeast1');
if (useEmulators) connectFunctionsEmulator(functions, '127.0.0.1', 5001);
const callable = httpsCallable<LookupInput, LookupResult>(functions, 'traCuuSinhVien', { timeout: 30000 });
export async function callLookup(input: LookupInput) {
  try { return (await callable(input)).data; }
  catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'functions/not-found') throw new Error('Không tìm thấy sinh viên với mã số này.');
    if (code === 'functions/unavailable' || code === 'functions/deadline-exceeded') throw new Error('Chưa kết nối được máy chủ. Vui lòng thử lại.');
    if (code === 'functions/unauthenticated' || code === 'functions/permission-denied') throw new Error('Không xác thực được ứng dụng. Vui lòng tải lại trang.');
    if (code === 'functions/invalid-argument') throw new Error((error as Error).message);
    throw new Error('Không thể tra cứu lúc này. Vui lòng thử lại sau.');
  }
}
