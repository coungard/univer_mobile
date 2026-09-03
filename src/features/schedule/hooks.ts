import { useQuery } from '@tanstack/react-query';
import { getLecture, getMyLectures } from '../../api/endpoints/lectures';

/**
 * Fetches the student's full lecture list once (`GET /lectures/me`, ~a semester's worth — see
 * `api/endpoints/lectures.ts`); week-by-week filtering happens client-side in `ScheduleScreen`
 * against this single cached result, so switching weeks doesn't refetch.
 */
export function useMyLecturesQuery() {
  return useQuery({
    queryKey: ['lectures', 'me'],
    queryFn: () => getMyLectures(),
    select: (page) => page.content,
  });
}

/** `GET /lectures/{id}` — powers `LectureDetailsScreen` (ROADMAP.md "Фаза 4"). */
export function useLectureQuery(lectureId: string) {
  return useQuery({
    queryKey: ['lectures', lectureId],
    queryFn: () => getLecture(lectureId),
  });
}
