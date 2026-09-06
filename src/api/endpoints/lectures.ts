import { apiClient } from '../client';
import { GenerateLectureRequest, LectureDto, LectureInput, Page } from '../types';

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
 * (`UI_UX.md` раздел 0). `ADMIN`/`TEACHER` — by every `Pair` of the cycle, no group scoping.
 */
export async function generateSemesterLectures(weekScheduleCycleId: string): Promise<LectureDto[]> {
  const { data } = await apiClient.post<LectureDto[]>(`/lectures/generate/semester/${weekScheduleCycleId}`);
  return data;
}

/**
 * `GET /lectures/course/{courseId}` — any authenticated role; used to build "Мои лекции" (ROADMAP.md
 * "Фаза 6") one course at a time, since there is no "lectures by teacher" endpoint — a teacher's own
 * lectures are the union of this call across `useOwnCoursesQuery`'s courses (see `features/teacher/hooks.ts`).
 */
export async function getLecturesByCourse(courseId: string, page = 0, size = 100): Promise<Page<LectureDto>> {
  const { data } = await apiClient.get<Page<LectureDto>>(`/lectures/course/${courseId}`, {
    params: { page, size },
  });
  return data;
}

/**
 * `POST /lectures` — `ADMIN`/`TEACHER` manual creation, no source `Pair` (ROADMAP.md "Фаза 6"). Unlike
 * a `Pair`-generated lecture, `teacherId`/`groupIds` aren't inferred server-side — the caller must
 * supply them (see `features/teacher/LectureFormScreen.tsx`).
 */
export async function createLecture(lecture: LectureInput): Promise<LectureDto> {
  const { data } = await apiClient.post<LectureDto>('/lectures', lecture);
  return data;
}

/**
 * `POST /lectures/generate` — one `Lecture` from a `Pair` template on a specific `date` (`course`/
 * `teacherId`/`groupIds` copied from the `Pair`, see API.md). **Not idempotent** — a second call for
 * the same pair+date is a `422` ("уже сгенерирована"), not a silent no-op like
 * `generateSemesterLectures` above; surface that error as-is rather than retrying silently.
 */
export async function generateLecture(request: GenerateLectureRequest): Promise<LectureDto> {
  const { data } = await apiClient.post<LectureDto>('/lectures/generate', request);
  return data;
}
