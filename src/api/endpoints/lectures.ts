import { apiClient } from '../client';
import { LectureDto, Page } from '../types';

/**
 * `GET /lectures/me` — the caller's own lectures (`STUDENT` role), already sorted by
 * `scheduledTime` ascending (see API.md). No date-range filter exists on the backend, so the
 * weekly view (`features/schedule`) fetches a large-enough page and filters client-side.
 */
export async function getMyLectures(page = 0, size = 200): Promise<Page<LectureDto>> {
  const { data } = await apiClient.get<Page<LectureDto>>('/lectures/me', {
    params: { page, size },
  });
  return data;
}
