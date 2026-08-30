import { apiClient } from '../client';
import { DepartmentDto, Page } from '../types';

/**
 * `GET /departments/university/{universityId}` — used by the "select department" step of
 * teacher registration, scoped to the university the user picked first.
 */
export async function getDepartmentsByUniversity(
  universityId: string,
  page = 0,
  size = 50,
): Promise<Page<DepartmentDto>> {
  const { data } = await apiClient.get<Page<DepartmentDto>>(
    `/departments/university/${universityId}`,
    { params: { page, size } },
  );
  return data;
}
