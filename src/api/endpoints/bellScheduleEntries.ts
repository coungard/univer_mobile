import { apiClient } from '../client';
import { BellScheduleEntryDto } from '../types';

/**
 * `GET /bell-schedule-entries/university/{universityId}/effective` — "pair number -> start/end time"
 * as it applies to the university: its own entry for a number, or else the default one (univer#98).
 * One entry per pair number, sorted by it, not paginated. This is the time the server puts into a
 * `Pair` saved without `startTime`/`endTime`, so the form shows it next to the pair number.
 */
export async function getEffectiveBellSchedule(universityId: string): Promise<BellScheduleEntryDto[]> {
  const { data } = await apiClient.get<BellScheduleEntryDto[]>(
    `/bell-schedule-entries/university/${universityId}/effective`,
  );
  return data;
}
