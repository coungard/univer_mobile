import { apiClient } from '../client';
import { BellScheduleEntryDto, Page } from '../types';

/**
 * `GET /bell-schedule-entries/university/{universityId}` — "pair number -> start/end time" lookup,
 * used to preview a `Pair`'s time in the schedule-filling form without the student having to enter
 * it manually (`PairDto.startTime`/`endTime` are left unset and auto-filled by the backend from this
 * same table when lectures are generated — see API.md `PairDto`).
 */
export async function getBellScheduleEntriesByUniversity(
  universityId: string,
  page = 0,
  size = 50,
): Promise<Page<BellScheduleEntryDto>> {
  const { data } = await apiClient.get<Page<BellScheduleEntryDto>>(
    `/bell-schedule-entries/university/${universityId}`,
    { params: { page, size } },
  );
  return data;
}
