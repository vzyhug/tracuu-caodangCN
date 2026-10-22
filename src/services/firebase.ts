import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { buildLookup, type Student, type Subject, type Schedule } from '../../functions/src/domain';
import type { LookupInput, LookupResult } from '../types';

const env = import.meta.env;
if (!env.VITE_FIREBASE_PROJECT_ID || !env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_APP_ID) {
  throw new Error('Chưa cấu hình Firebase. Điền thông tin Web App trong .env.local.');
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const useEmulators = env.VITE_USE_EMULATORS === 'true';
if (!useEmulators && env.VITE_FIREBASE_APPCHECK_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(env.VITE_FIREBASE_APPCHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn('App Check init warning:', e);
  }
}

const db = getFirestore(app);
if (useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export async function callLookup(input: LookupInput): Promise<LookupResult> {
  try {
    // 1. Lấy thông tin sinh viên (hỗ trợ cả collection 'sinhvien' và 'sinh_vien')
    let studentSnap = await getDoc(doc(db, 'sinhvien', input.mssv));
    if (!studentSnap.exists()) {
      studentSnap = await getDoc(doc(db, 'sinh_vien', input.mssv));
    }
    if (!studentSnap.exists()) {
      throw new Error('Không tìm thấy sinh viên với mã số này.');
    }
    const student = { ...studentSnap.data(), _id: studentSnap.id } as Student;

    // 2. Truy vấn TKB theo lớp, học kỳ, năm học và đợt tuyển sinh
    const tkbQuery = query(
      collection(db, 'tkb'),
      where('maLop', '==', student.daoTao.maLop),
      where('hocKy', '==', input.hocKy),
      where('namHoc', '==', input.namHoc),
      where('dotTuyenSinh', 'array-contains', student.daoTao.dot)
    );
    const tkbSnap = await getDocs(tkbQuery);
    const schedules = tkbSnap.docs.map(d => d.data() as Schedule);

    // 3. Lấy thông tin tên môn học (hỗ trợ cả 'monhoc' và 'mon_hoc')
    const maMonList = [
      ...new Set([
        ...student.theoDoiHocTap.flatMap(t => t.monHoc.map(m => m.maMon)),
        ...schedules.map(s => s.maMon),
      ]),
    ];

    const subjects: Subject[] = [];
    if (maMonList.length > 0) {
      const subjectSnaps = await Promise.all(
        maMonList.map(async id => {
          let s = await getDoc(doc(db, 'monhoc', id));
          if (!s.exists()) {
            s = await getDoc(doc(db, 'mon_hoc', id));
          }
          return s;
        })
      );
      for (const snap of subjectSnaps) {
        if (snap.exists()) {
          subjects.push({ ...(snap.data() as Subject), _id: snap.id });
        }
      }
    }

    // 4. Tổng hợp kết quả tra cứu
    return buildLookup(student, subjects, schedules, input);
  } catch (error) {
    if ((error as Error).message === 'Không tìm thấy sinh viên với mã số này.') {
      throw error;
    }
    console.error('Lỗi khi tra cứu Firestore:', error);
    throw new Error('Không thể tra cứu lúc này. Vui lòng thử lại sau.');
  }
}
