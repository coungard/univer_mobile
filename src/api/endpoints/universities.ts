import { apiClient } from '../client';
import { Page, UniversityDto } from '../types';

/**
 * `GET /universities` — used by the searchable "select university" step of registration.
 * `search` is a case-insensitive substring match on name, applied server-side; `regionId` (from
 * `GET /regions`) narrows the list to one region and combines with `search`.
 */
export async function getUniversities(
  search?: string,
  page = 0,
  size = 20,
  regionId?: string,
): Promise<Page<UniversityDto>> {
  const { data } = await apiClient.get<Page<UniversityDto>>('/universities', {
    params: { search: search || undefined, regionId, page, size },
  });
  return data;
}

/** `GET /universities/{id}` — used to show a student's/teacher's own university by name. */
export async function getUniversity(id: string): Promise<UniversityDto> {
  const { data } = await apiClient.get<UniversityDto>(`/universities/${id}`);
  return data;
}
