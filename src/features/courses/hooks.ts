import { useQuery } from '@tanstack/react-query';
import { getCourse, getCourses, getCoursesByDepartment } from '../../api/endpoints/courses';
import { useOwnUserId } from '../profile/hooks';

/**
 * Course list (ROADMAP.md "Фаза 4"): `departmentId === null` fetches the full catalogue
 * (`GET /courses`), otherwise the department-scoped list (`GET /courses/department/{id}`) used by
 * `CoursesScreen`'s department filter. Like `useMyLecturesQuery`, fetches one reasonably large page
 * — infinite-scroll pagination for list screens is ROADMAP.md "Фаза 8", not this phase.
 */
export function useCoursesQuery(departmentId: string | null) {
  return useQuery({
    queryKey: departmentId ? ['courses', 'department', departmentId] : ['courses', 'all'],
    queryFn: () => (departmentId ? getCoursesByDepartment(departmentId) : getCourses()),
    select: (page) => page.content,
  });
}

export function useCourseQuery(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => getCourse(courseId),
  });
}

/**
 * A teacher's own courses (ROADMAP.md "Фаза 6" — «Мои курсы»). No `GET /courses?teacherId=` filter
 * exists on the backend, so this reuses `useCoursesQuery(null)`'s full-catalogue fetch/cache (shared
 * with the student «Курсы» tab) and filters client-side on `CourseDto.teacherId`.
 */
export function useOwnCoursesQuery() {
  const teacherId = useOwnUserId();
  const courses = useCoursesQuery(null);
  return {
    ...courses,
    data: (courses.data ?? []).filter((course) => course.teacherId === teacherId),
  };
}
