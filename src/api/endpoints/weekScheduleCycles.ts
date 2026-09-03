import { apiClient } from '../client';
import { ApiError } from '../errors';
import { WeekScheduleCycleDto } from '../types';

/**
 * `GET /week-schedule-cycles/semester/{semesterId}` — the semester's cycle, if an admin has opened
 * one yet (`UI_UX.md` "генерация расписания/лекций «на ходу»", раздел 4/6). A `404` here is an
 * expected, everyday state — "admin hasn't opened the semester's schedule yet" — not a failure, so
 * it resolves to `null` instead of rejecting; callers don't have to special-case `ApiError` themselves.
 */
export async function getWeekScheduleCycleBySemester(semesterId: string): Promise<WeekScheduleCycleDto | null> {
  try {
    const { data } = await apiClient.get<WeekScheduleCycleDto>(`/week-schedule-cycles/semester/${semesterId}`);
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
