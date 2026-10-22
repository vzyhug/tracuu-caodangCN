import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const project = args.includes('--project') ? args[args.indexOf('--project') + 1] : undefined;
if (!project || project.startsWith('--')) throw Error('Chỉ rõ --project FIREBASE_PROJECT_ID.');
if (project.startsWith('demo-') && !process.env.FIRESTORE_EMULATOR_HOST) throw Error('Project demo chỉ dùng với FIRESTORE_EMULATOR_HOST.');
const datasets = [];
for (const name of ['mon_hoc', 'sinh_vien', 'tkb']) {
  const records = JSON.parse(await fs.readFile(path.join(root, 'data/private', name + '.json'), 'utf8'));
  if (!Array.isArray(records) || !records.length || records.some(r => !r.id || !r.data)) throw Error('Dữ liệu import không hợp lệ: ' + name);
  if (new Set(records.map(r => r.id)).size !== records.length) throw Error('Trùng document ID: ' + name);
  datasets.push({ name, records });
}
initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? { projectId: project } : { projectId: project, credential: applicationDefault() });
const firestore = getFirestore();
for (const { name, records } of datasets) {
  for (let offset = 0; offset < records.length; offset += 400) {
    const batch = firestore.batch();
    for (const record of records.slice(offset, offset + 400)) batch.set(firestore.collection(name).doc(record.id), record.data);
    await batch.commit();
  }
  console.log(`Đã ghi ${records.length} documents vào ${project}/${name}.`);
}
// Stable document IDs make repeated imports update the same records.
// Does not delete documents absent from source. Replaces matching document data.
