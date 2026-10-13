import { useQuery } from '@tanstack/react-query';
import { getCourse, getCourses } from '../../api/endpoints/courses';
import { fetchAllPages } from '../../api/pagination';
import { useOwnUserId } from '../profile/hooks';

export function useCourseQuery(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => getCourse(courseId),
  });
}

/**
 * The *complete* course catalogue — every page fetched up front (`fetchAllPages`,
 * `api/pagination.ts`). For lookups that need to see every course regardless of how many pages that is: a teacher's own
 * courses (`useOwnCoursesQuery` below, client-filtered on `CourseDto.teacherId` — no matching filter
 * endpoint exists) and course-title lookups elsewhere (`GroupScheduleScreen`, `PairFormScreen`,
 * `TeacherLecturesScreen`, `LectureFormScreen`).
 */
export function useAllCoursesQuery() {
  return useQuery({
    queryKey: ['courses', 'all-complete'],
    queryFn: () => fetchAllPages((page) => getCourses(page)),
  });
}

/**
 * A teacher's own courses (ROADMAP.md "Фаза 6" — «Мои курсы»). No `GET /courses?teacherId=` filter
 * exists on the backend, so this needs the *complete* catalogue (`useAllCoursesQuery`) and
 * filters client-side on `CourseDto.teacherId`.
 */
export function useOwnCoursesQuery() {
  const teacherId = useOwnUserId();
  const courses = useAllCoursesQuery();
  return {
    ...courses,
    data: (courses.data ?? []).filter((course) => course.teacherId === teacherId),
  };
}
