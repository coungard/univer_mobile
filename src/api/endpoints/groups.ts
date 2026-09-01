import { apiClient } from '../client';
import { GroupDto } from '../types';

/**
 * `GET /groups/{id}`. `GroupDto` only carries `semesterId` — there is no direct link to a
 * program/faculty, so resolving those means walking group → semester → study year → program →
 * faculty (see `features/profile/hooks.ts`'s `useGroupAcademicPathQuery`).
 */
export async function getGroup(id: string): Promise<GroupDto> {
  const { data } = await apiClient.get<GroupDto>(`/groups/${id}`);
  return data;
}
