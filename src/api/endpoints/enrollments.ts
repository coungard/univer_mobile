import { apiClient } from '../client';
import { EnrollmentDto, Page } from '../types';

/**
 * `GET /enrollments/course/{courseId}` — any authenticated role. Builds a lecture's attendance
 * roster (ROADMAP.md "Фаза 6"): `Lecture` itself carries `groupIds`, not a student list, and there is
 * no "students by group" endpoint a `TEACHER` can call (`GET /students` is `ADMIN`-only, `GET
 * /students/{id}` requires the `STUDENT` role on the *caller* — confirmed 403 for `TEACHER` against
 * the local dev backend), so course enrollments are the only student-list source available here.
 */
export async function getCourseEnrollments(courseId: string, page = 0, size = 200): Promise<Page<EnrollmentDto>> {
  const { data } = await apiClient.get<Page<EnrollmentDto>>(`/enrollments/course/${courseId}`, {
    params: { page, size },
  });
  return data;
}
