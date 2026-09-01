import { apiClient } from '../client';
import { Page, UniversityDto } from '../types';

/** `GET /universities` — used by the "select university" step of student registration. */
export async function getUniversities(page = 0, size = 50): Promise<Page<UniversityDto>> {
  const { data } = await apiClient.get<Page<UniversityDto>>('/universities', {
    params: { page, size },
  });
  return data;
}

/** `GET /universities/{id}` — used to show a student's/teacher's own university by name. */
export async function getUniversity(id: string): Promise<UniversityDto> {
  const { data } = await apiClient.get<UniversityDto>(`/universities/${id}`);
  return data;
}
