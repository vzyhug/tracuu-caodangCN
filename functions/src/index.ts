import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineBoolean } from 'firebase-functions/params';
import { buildLookup, parseInput, type Student, type Subject, type Schedule } from './domain';

initializeApp();
const firestore = getFirestore();
const enforceAppCheck = defineBoolean('ENFORCE_APP_CHECK', { default: true });
export const traCuuSinhVien = onCall({
  region: 'asia-southeast1', memory: '256MiB', maxInstances: 5, timeoutSeconds: 30,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR === 'true' ? false : enforceAppCheck,
}, async request => {
  let input;
  try { input = parseInput(request.data); }
  catch (error) { throw new HttpsError('invalid-argument', (error as Error).message); }
  const studentDoc = await firestore.collection('sinh_vien').doc(input.mssv).get();
  if (!studentDoc.exists) throw new HttpsError('not-found', 'Không tìm thấy sinh viên với mã số này.');
  const student = { ...studentDoc.data(), _id: studentDoc.id } as Student;
  const scheduleDocs = await firestore.collection('tkb')
    .where('maLop', '==', student.daoTao.maLop).where('hocKy', '==', input.hocKy)
    .where('namHoc', '==', input.namHoc).where('dotTuyenSinh', 'array-contains', student.daoTao.dot).get();
  const schedules = scheduleDocs.docs.map(d => d.data() as Schedule);
  const ids = [...new Set([...student.theoDoiHocTap.flatMap(t => t.monHoc.map(m => m.maMon)), ...schedules.map(s => s.maMon)])];
  const subjectDocs = ids.length ? await firestore.getAll(...ids.map(id => firestore.collection('mon_hoc').doc(id))) : [];
  const subjects = subjectDocs.filter(d => d.exists).map(d => ({ ...d.data(), _id: d.id }) as Subject);
  return buildLookup(student, subjects, schedules, input);
});
