import { apiClient } from '../client';
import { AttendanceStatsDto, AttendanceSummaryDto, LectureAttendanceDto, MyAttendanceDto, Page } from '../types';

/**
 * `GET /attendance/me` — the signed-in student's resulting mark per lecture (univer#117): only
 * lectures marked by the student or the teacher are listed, a lecture absent here is unmarked.
 */
export async function getMyAttendance(page = 0, size = 200): Promise<Page<MyAttendanceDto>> {
  const { data } = await apiClient.get<Page<MyAttendanceDto>>('/attendance/me', { params: { page, size } });
  return data;
}

/**
 * `PUT /attendance/me/lecture/{lectureId}` — the student marks their own lecture «был»/«не был»,
 * only once it has started (`422` before that). Returns the resulting mark, which is the teacher's
 * if they have marked it meanwhile.
 */
export async function markMyAttendance(lectureId: string, attended: boolean): Promise<MyAttendanceDto> {
  const { data } = await apiClient.put<MyAttendanceDto>(`/attendance/me/lecture/${lectureId}`, { attended });
  return data;
}

/** `DELETE /attendance/me/lecture/{lectureId}` — removes the student's own mark; a teacher's stays. */
export async function unmarkMyAttendance(lectureId: string): Promise<void> {
  await apiClient.delete(`/attendance/me/lecture/${lectureId}`);
}

/** `GET /attendance/me/course/{courseId}/summary` — the course's started lectures in the current semester. */
export async function getMyCourseAttendanceSummary(courseId: string): Promise<AttendanceSummaryDto> {
  const { data } = await apiClient.get<AttendanceSummaryDto>(`/attendance/me/course/${courseId}/summary`);
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
