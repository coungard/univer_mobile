import { apiClient } from '../client';
import { SemesterDto } from '../types';

/** `GET /semesters/{id}`. */
export async function getSemester(id: string): Promise<SemesterDto> {
  const { data } = await apiClient.get<SemesterDto>(`/semesters/${id}`);
  return data;
}
