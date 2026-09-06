import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLectureAttendance,
  getLectureAttendanceStats,
  markAttendance,
} from '../../api/endpoints/attendance';
import { getCourseEnrollments } from '../../api/endpoints/enrollments';
import { getGroup } from '../../api/endpoints/groups';
import {
  createLecture,
  generateLecture,
  generateSemesterLectures,
  getLecturesByCourse,
} from '../../api/endpoints/lectures';
import { getPairs } from '../../api/endpoints/pairs';
import { GenerateLectureRequest, GroupDto, LectureDto, LectureInput, Page } from '../../api/types';
import { useOwnUserId } from '../profile/hooks';

/**
 * A teacher's own `Lecture`s — «Мои лекции» (ROADMAP.md "Фаза 6"). There is no "lectures by teacher"
 * endpoint, so this fans out `GET /lectures/course/{courseId}` (real, server-side filter) across the
 * given course ids via `useQueries` and merges the pages, newest first, then filters the merged
 * result to `LectureDto.teacherId === own id`.
 *
 * That last filter matters: pass a course id set wider than just `useOwnCoursesQuery()`'s ids (e.g.
 * union it with the course ids of `useOwnPairsQuery()`'s templates, as `TeacherLecturesScreen` does) —
 * confirmed live against the local dev backend that `CourseDto.teacherId` can be unset for a course
 * while `PairDto.teacherId`/the `Lecture`s generated from it are correctly set to the teacher who
 * actually teaches it, so a course-id filter alone would silently miss real lectures of this teacher's.
 * The `teacherId` filter here is what makes the wider input safe: it also drops any *other* teacher's
 * lectures on a shared course.
 */
export function useTeacherLecturesQuery(courseIds: string[]) {
  const teacherId = useOwnUserId();
  const results = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: ['lectures', 'course', courseId],
      queryFn: () => getLecturesByCourse(courseId),
      select: (page: Page<LectureDto>) => page.content,
    })),
  });

  const lectures = results
    .flatMap((result) => result.data ?? [])
    .filter((lecture) => lecture.teacherId === teacherId)
    .sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));

  return {
    data: lectures,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    error: results.find((result) => result.isError)?.error,
    refetch: () => results.forEach((result) => result.refetch()),
  };
}

/**
 * The signed-in teacher's own `Pair` templates — source material for "генерация одной лекции"/"на
 * весь семестр" (ROADMAP.md "Фаза 6"). No "pairs by teacher" endpoint exists (`TEACHER` also has no
 * `POST`/`PUT`/`DELETE` on `/pairs` at all — see API.md, those templates come from `STUDENT`/`ADMIN`),
 * so this filters `getPairs`'s full list client-side on `PairDto.teacherId`, same approach as
 * `useOwnCoursesQuery`.
 */
export function useOwnPairsQuery() {
  const teacherId = useOwnUserId();
  const pairs = useQuery({
    queryKey: ['pairs', 'all'],
    queryFn: () => getPairs(),
    select: (page) => page.content,
  });
  return {
    ...pairs,
    data: (pairs.data ?? []).filter((pair) => pair.teacherId === teacherId),
  };
}

/**
 * Resolves a handful of group ids to their `GroupDto` — `LectureFormScreen`'s group picker, which
 * only ever deals with the few groups already used by the teacher's own `Pair` templates for the
 * selected course (see that screen). Shares its `['groups', id]` cache entries with
 * `useGroupAcademicPathQuery` in `features/profile/hooks.ts`.
 */
export function useGroupsByIds(groupIds: string[]) {
  const results = useQueries({
    queries: groupIds.map((id) => ({
      queryKey: ['groups', id],
      queryFn: () => getGroup(id),
    })),
  });
  return {
    data: results.map((result) => result.data).filter((group): group is GroupDto => group !== undefined),
    isLoading: results.some((result) => result.isLoading),
  };
}

export function useCreateLectureMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lecture: LectureInput) => createLecture(lecture),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lectures'] }),
  });
}

/** `POST /lectures/generate` — single lecture from a `Pair` template on a date (`GenerateLectureScreen`). */
export function useGenerateLectureMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: GenerateLectureRequest) => generateLecture(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lectures'] }),
  });
}

/**
 * `POST /lectures/generate/semester/{id}` for a teacher — same endpoint as
 * `features/schedule/hooks.ts`'s `useGenerateSemesterLecturesMutation`, but invalidating the
 * teacher's own `['lectures', 'course', ...]` caches instead of the student's `['lectures', 'me']`
 * (broad `['lectures']` invalidation covers both, so either screen picks up the change on next visit).
 */
export function useTeacherGenerateSemesterLecturesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weekScheduleCycleId: string) => generateSemesterLectures(weekScheduleCycleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lectures'] }),
  });
}

/**
 * A lecture's attendance roster: `ACTIVE` enrollments of its course, each paired with its existing
 * mark (`undefined` = not yet marked) — `TeacherLectureDetailsScreen`'s checkbox list (ROADMAP.md
 * "Фаза 6"). Only `ACTIVE` enrollments are included so the common case never hits the `422`
 * ("not ACTIVE") the mark endpoint would otherwise return — see `api/endpoints/attendance.ts`.
 */
export interface RosterEntry {
  studentId: string;
  attended: boolean | undefined;
}

export function useLectureRosterQuery(lectureId: string, courseId: string | undefined) {
  const enrollments = useQuery({
    queryKey: ['enrollments', 'course', courseId],
    queryFn: () => getCourseEnrollments(courseId as string),
    select: (page) => page.content.filter((enrollment) => enrollment.status === 'ACTIVE'),
    enabled: courseId !== undefined,
  });
  const attendance = useQuery({
    queryKey: ['attendance', 'lecture', lectureId],
    queryFn: () => getLectureAttendance(lectureId),
    select: (page) => page.content,
  });

  const attendedByStudent = new Map((attendance.data ?? []).map((mark) => [mark.studentId, mark.attended ?? false]));
  const roster: RosterEntry[] = (enrollments.data ?? []).map((enrollment) => ({
    studentId: enrollment.studentId,
    attended: attendedByStudent.get(enrollment.studentId),
  }));

  return {
    roster,
    isLoading: enrollments.isLoading || attendance.isLoading,
    isError: enrollments.isError || attendance.isError,
    error: enrollments.error ?? attendance.error,
    refetch: () => {
      enrollments.refetch();
      attendance.refetch();
    },
  };
}

export function useLectureAttendanceStatsQuery(lectureId: string) {
  return useQuery({
    queryKey: ['attendance', 'lecture', lectureId, 'stats'],
    queryFn: () => getLectureAttendanceStats(lectureId),
  });
}

/**
 * `POST /attendance` for one roster row. Invalidates every `['attendance', 'lecture', lectureId, ...]`
 * query (both the mark list `useLectureRosterQuery` reads and the stats above — TanStack's
 * prefix-match invalidation covers both with one call) so the checkbox and the summary update
 * together right after a tap.
 */
export function useMarkAttendanceMutation(lectureId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, attended }: { studentId: string; attended: boolean }) =>
      markAttendance({ studentId, lectureId, attended }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance', 'lecture', lectureId] }),
  });
}
