import { apiClient } from '../client';
import { WeekScheduleCycleDto } from '../types';

/**
 * `PUT /students/me/week-schedule-cycle` — the schedule cycle of the semester the student's group
 * studies in. The server creates it in `DRAFT` when there is none, so no administrator is needed
 * (univer#96); an existing cycle comes back as is, `AGREED` included. Safe to repeat. `422` when the
 * student has no group.
 */
export async function openOwnWeekScheduleCycle(): Promise<WeekScheduleCycleDto> {
  const { data } = await apiClient.put<WeekScheduleCycleDto>('/students/me/week-schedule-cycle');
  return data;
}
