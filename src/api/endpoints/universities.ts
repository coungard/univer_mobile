import { apiClient } from '../client';
import { Page, UniversityDto } from '../types';

/** `GET /universities` — used by the "select university" step of student registration. */
export async function getUniversities(page = 0, size = 50): Promise<Page<UniversityDto>> {
  const { data } = await apiClient.get<Page<UniversityDto>>('/universities', {
    params: { page, size },
  });
  return data;
}
