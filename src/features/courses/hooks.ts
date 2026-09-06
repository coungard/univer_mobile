import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getCourse, getCourses, getCoursesByDepartment } from '../../api/endpoints/courses';
import { fetchAllPages } from '../../api/pagination';
import { useOwnUserId } from '../profile/hooks';

/**
 * Course catalogue for browsing (ROADMAP.md "Фаза 4"/"Фаза 8"): `departmentId === null` fetches
 * `GET /courses`, otherwise the department-scoped `GET /courses/department/{id}` — both real
 * infinite-scroll pagination (`CoursesScreen` calls `fetchNextPage()` as the list nears its end),
 * not a one-shot "reasonably large page" fetch. `data` is the pages flattened into one array, same
 * shape as before this was an infinite query, so callers don't need to know the difference; use
 * `hasNextPage`/`fetchNextPage`/`isFetchingNextPage` from the spread-through `useInfiniteQuery`
 * result to drive "загрузить ещё".
 *
 * Don't reuse this for a client-side identity filter (a teacher's own courses, say) — only the
 * pages the user has actually scrolled to are loaded, so filtering here would silently miss matches
 * further down the catalogue. `useAllCoursesQuery` below is for that.
 */
export function useCoursesQuery(departmentId: string | null) {
  const query = useInfiniteQuery({
    queryKey: departmentId ? ['courses', 'department', departmentId, 'paged'] : ['courses', 'all', 'paged'],
    queryFn: ({ pageParam }) => (departmentId ? getCoursesByDepartment(departmentId, pageParam) : getCourses(pageParam)),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
  });
  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.content),
  };
}

export function useCourseQuery(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => getCourse(courseId),
  });
}

/**
 * The *complete* course catalogue — every page fetched up front (`fetchAllPages`,
 * `api/pagination.ts`), unlike `useCoursesQuery`'s incremental browsing pagination above. For
 * lookups that need to see every course regardless of how many pages that is: a teacher's own
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
 * exists on the backend, so this needs the *complete* catalogue (`useAllCoursesQuery`, not
 * `useCoursesQuery`'s paginated one — see its doc comment) and filters client-side on
 * `CourseDto.teacherId`.
 */
export function useOwnCoursesQuery() {
  const teacherId = useOwnUserId();
  const courses = useAllCoursesQuery();
  return {
    ...courses,
    data: (courses.data ?? []).filter((course) => course.teacherId === teacherId),
  };
}
