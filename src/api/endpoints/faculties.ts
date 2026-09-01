import { apiClient } from '../client';
import { FacultyDto } from '../types';

/** `GET /faculties/{id}` — used to resolve a student's/teacher's faculty name for display. */
export async function getFaculty(id: string): Promise<FacultyDto> {
  const { data } = await apiClient.get<FacultyDto>(`/faculties/${id}`);
  return data;
}
