import { apiClient } from '../client';
import { Page, UniversityDto } from '../types';

/**
 * `GET /universities` — used by the searchable "select university" step of registration.
 * `search` is a case-insensitive substring match on name, applied server-side.
 */
export async function getUniversities(search?: string, page = 0, size = 20): Promise<Page<UniversityDto>> {
  const { data } = await apiClient.get<Page<UniversityDto>>('/universities', {
    params: { search: search || undefined, page, size },
  });
  return data;
}

/** `GET /universities/{id}` — used to show a student's/teacher's own university by name. */
export async function getUniversity(id: string): Promise<UniversityDto> {
  const { data } = await apiClient.get<UniversityDto>(`/universities/${id}`);
  return data;
}
