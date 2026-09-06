import { useQuery } from '@tanstack/react-query';
import { getStudentAttendanceHistory, getStudentCourseAttendanceStats } from '../../api/endpoints/attendance';
import { fetchAllPages } from '../../api/pagination';
import { LectureDto } from '../../api/types';
import { useOwnUserId } from '../profile/hooks';
import { useMyLecturesQuery } from '../schedule/hooks';

/** `GET /attendance/student/{id}/course/{courseId}/stats` for the signed-in student (ROADMAP.md "Фаза 5"). */
export function useOwnCourseAttendanceStatsQuery(courseId: string) {
  const studentId = useOwnUserId();
  return useQuery({
    queryKey: ['attendance', 'stats', studentId, courseId],
    queryFn: () => getStudentCourseAttendanceStats(studentId as string, courseId),
    enabled: studentId !== null,
  });
}

export interface AttendanceHistoryEntry {
  lecture: LectureDto;
  attended: boolean;
}

/**
 * The signed-in student's marked-lecture history for one course, newest first — `CourseDetailsScreen`'s
 * «история по лекциям» (ROADMAP.md "Фаза 5"). `GET /attendance/student/{id}` has no course filter (see
 * `api/endpoints/attendance.ts`), so this joins it client-side against `useMyLecturesQuery`'s cached
 * list by `lectureId` -> `LectureDto.courseId`, the same pattern `useGroupAcademicPathQuery`
 * (`features/profile/hooks.ts`) uses for its group -> semester -> ... chain. A lecture without a
 * matching attendance record hasn't been marked yet, so it's simply absent from the result — not an
 * error and not shown as "not attended". That absence has to be reliable, which is why this fetches
 * *every* page (`fetchAllPages`, `api/pagination.ts`) rather than one capped page: a truncated fetch
 * would misrepresent a real, older attended lecture that just didn't fit on the first page as
 * "not marked" instead of leaving it out as "not loaded yet".
 */
export function useOwnCourseAttendanceHistoryQuery(courseId: string) {
  const studentId = useOwnUserId();
  const lectures = useMyLecturesQuery();
  const history = useQuery({
    queryKey: ['attendance', 'history', studentId],
    queryFn: () => fetchAllPages((page) => getStudentAttendanceHistory(studentId as string, page)),
    enabled: studentId !== null,
  });

  const lecturesById = new Map((lectures.data ?? []).map((lecture) => [lecture.id, lecture]));
  const entries: AttendanceHistoryEntry[] = (history.data ?? [])
    .map((mark): AttendanceHistoryEntry | null => {
      const lecture = lecturesById.get(mark.lectureId);
      if (!lecture || lecture.courseId !== courseId) return null;
      return { lecture, attended: mark.attended ?? false };
    })
    .filter((entry): entry is AttendanceHistoryEntry => entry !== null)
    .sort((a, b) => b.lecture.scheduledTime.localeCompare(a.lecture.scheduledTime));

  return {
    entries,
    isLoading: history.isLoading || lectures.isLoading,
    isError: history.isError || lectures.isError,
    error: history.error ?? lectures.error,
    refetch: () => {
      history.refetch();
      lectures.refetch();
    },
  };
}
