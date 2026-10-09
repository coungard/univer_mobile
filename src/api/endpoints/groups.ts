import { apiClient } from '../client';
import { GroupDto, Page } from '../types';

/**
 * `GET /groups?facultyId=&yearNumber=` — groups of a faculty on a given year, limited by the
 * backend to each study year's current semester (see API.md). An empty
 * page is a normal answer ("no groups yet"), not an error.
 */
export async function getGroupsByFacultyAndYear(
  facultyId: string,
  yearNumber: number,
  page = 0,
  size = 200,
): Promise<Page<GroupDto>> {
  const { data } = await apiClient.get<Page<GroupDto>>('/groups', {
    params: { facultyId, yearNumber, page, size },
  });
  return data;
}

/**
 * `GET /groups/{id}`. `GroupDto` only carries `semesterId` — there is no direct link to a
 * faculty, so resolving it means walking group → semester → study year → faculty (see `features/profile/hooks.ts`'s `useGroupAcademicPathQuery`).
 */
export async function getGroup(id: string): Promise<GroupDto> {
  const { data } = await apiClient.get<GroupDto>(`/groups/${id}`);
  return data;
}
