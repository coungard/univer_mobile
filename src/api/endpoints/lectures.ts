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

/** `GET /lectures/{id}` — any authenticated role; used by the lecture details screen (ROADMAP.md "Фаза 4"). */
export async function getLecture(id: string): Promise<LectureDto> {
  const { data } = await apiClient.get<LectureDto>(`/lectures/${id}`);
  return data;
}

/**
 * `POST /lectures/generate/semester/{weekScheduleCycleId}` — generates every still-missing `Lecture`
 * for the cycle's `Pair`s across the semester's date range; idempotent (already-generated pair+date
 * combinations are silently skipped, see API.md). A `STUDENT` caller is scoped server-side to `Pair`s
 * of their own group — other groups' `Pair`s in the same cycle are silently skipped, not an error
 * (`UI_UX.md` раздел 0).
 */
export async function generateSemesterLectures(weekScheduleCycleId: string): Promise<LectureDto[]> {
  const { data } = await apiClient.post<LectureDto[]>(`/lectures/generate/semester/${weekScheduleCycleId}`);
  return data;
}
