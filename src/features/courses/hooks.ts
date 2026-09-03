import { useQuery } from '@tanstack/react-query';
import { getCourse, getCourses, getCoursesByDepartment } from '../../api/endpoints/courses';

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
