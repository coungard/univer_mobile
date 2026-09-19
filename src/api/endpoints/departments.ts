import { apiClient } from '../client';
import { DepartmentDto } from '../types';

/** `GET /departments/{id}` — used to resolve a course's department name for display (ROADMAP.md "Фаза 4"). */
export async function getDepartment(id: string): Promise<DepartmentDto> {
  const { data } = await apiClient.get<DepartmentDto>(`/departments/${id}`);
  return data;
}
