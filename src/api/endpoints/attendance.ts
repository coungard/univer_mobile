import { apiClient } from '../client';
import { AttendanceStatsDto, LectureAttendanceDto, Page } from '../types';

/**
 * `GET /attendance/student/{studentId}/course/{courseId}/stats` — how much of this course's
 * already-marked lectures the student attended (ROADMAP.md "Фаза 5"). Any authenticated role per
 * API.md, but this app only ever calls it for the signed-in student's own id.
 */
export async function getStudentCourseAttendanceStats(
  studentId: string,
  courseId: string,
): Promise<AttendanceStatsDto> {
  const { data } = await apiClient.get<AttendanceStatsDto>(
    `/attendance/student/${studentId}/course/${courseId}/stats`,
  );
  return data;
}

/**
 * `GET /attendance/student/{studentId}` — the student's full attendance history *across all
 * courses* (no course filter exists on the backend — see API.md). `CourseDetailsScreen` filters this
 * client-side to the lectures of one course via `useMyLecturesQuery`'s cached list (`LectureDto.courseId`),
 * the same join pattern as `useGroupAcademicPathQuery` in `features/profile/hooks.ts`. Fetches one
 * reasonably large page, like `getMyLectures` — infinite-scroll pagination is ROADMAP.md "Фаза 8".
 */
export async function getStudentAttendanceHistory(
  studentId: string,
  page = 0,
  size = 200,
): Promise<Page<LectureAttendanceDto>> {
  const { data } = await apiClient.get<Page<LectureAttendanceDto>>(`/attendance/student/${studentId}`, {
    params: { page, size },
  });
  return data;
}

/** `GET /attendance/lecture/{lectureId}` — existing marks for one lecture, keyed by `studentId` (ROADMAP.md "Фаза 6"). */
export async function getLectureAttendance(
  lectureId: string,
  page = 0,
  size = 200,
): Promise<Page<LectureAttendanceDto>> {
  const { data } = await apiClient.get<Page<LectureAttendanceDto>>(`/attendance/lecture/${lectureId}`, {
    params: { page, size },
  });
  return data;
}

/** `GET /attendance/lecture/{lectureId}/stats` — how many of the lecture's roster have been marked so far. */
export async function getLectureAttendanceStats(lectureId: string): Promise<AttendanceStatsDto> {
  const { data } = await apiClient.get<AttendanceStatsDto>(`/attendance/lecture/${lectureId}/stats`);
  return data;
}

/**
 * `POST /attendance` — `ADMIN`/`TEACHER` marks one student present/absent for one lecture
 * (ROADMAP.md "Фаза 6"). `422` if the student isn't `ACTIVE`-enrolled in the lecture's course —
 * `TeacherLectureDetailsScreen` avoids this in the common case by only rostering `ACTIVE` enrollments
 * to begin with, but a status change between roster fetch and mark can still race it, so callers
 * must still surface `ApiError.message` rather than assume this always succeeds.
 */
export async function markAttendance(mark: LectureAttendanceDto): Promise<LectureAttendanceDto> {
  const { data } = await apiClient.post<LectureAttendanceDto>('/attendance', mark);
  return data;
}
