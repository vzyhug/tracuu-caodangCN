import { buildLookup, parseInput, type Student, type Schedule } from '../../functions/src/domain';
import type { LookupInput, LookupResult } from '../types';
export const isDemo = import.meta.env.VITE_DATA_MODE !== 'firebase';
export async function lookupStudent(request: LookupInput): Promise<LookupResult> {
  const input = parseInput(request);
  if (isDemo) {
    const { default: data } = await import('../data/demo.json');
    const student = data.students.find(s => s._id === input.mssv);
    if (!student) throw new Error('Không tìm thấy sinh viên. Ở chế độ minh họa, hãy dùng một mã mẫu bên dưới.');
    return buildLookup(student as Student, data.subjects, data.schedules as Schedule[], input);
  }
  const { callLookup } = await import('./firebase');
  return callLookup(input);
}
