import { apiClient } from '../client';
import { FacultyDto, Page } from '../types';

/** `GET /faculties/university/{universityId}` — the faculty step of the student setup wizard. */
export async function getFacultiesByUniversity(universityId: string, page = 0, size = 200): Promise<Page<FacultyDto>> {
  const { data } = await apiClient.get<Page<FacultyDto>>(`/faculties/university/${universityId}`, {
    params: { page, size },
  });
  return data;
}

/** `GET /faculties/{id}` — used to resolve a student's/teacher's faculty name for display. */
export async function getFaculty(id: string): Promise<FacultyDto> {
  const { data } = await apiClient.get<FacultyDto>(`/faculties/${id}`);
  return data;
}
