import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getDepartmentsByUniversity } from '../../api/endpoints/departments';
import { fetchAllPages } from '../../api/pagination';
import { registerStudent } from '../../api/endpoints/students';
import { registerTeacher } from '../../api/endpoints/teachers';
import { getUniversities } from '../../api/endpoints/universities';

/**
 * Searchable university list for `SearchableSelectField`'s picker (ROADMAP.md "Фаза 2"), backed by
 * the backend's own `?search=` filter (case-insensitive substring on name) rather than a client-side
 * filter — with the university count this large, fetching every page up front no longer scales.
 * `search` is debounced locally so typing doesn't fire a request per keystroke; results page in via
 * `useInfiniteQuery`, same incremental-loading pattern as `useCoursesQuery`
 * (`features/courses/hooks.ts`).
 */
export function useUniversitiesQuery(search: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ['universities', 'search', debouncedSearch],
    queryFn: ({ pageParam }) => getUniversities(debouncedSearch || undefined, pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
  });
  return {
    ...query,
    // `name` is optional per the backend's own OpenAPI schema (no `@NotBlank` on University.name) —
    // fall back rather than assume it's always set.
    data: query.data?.pages.flatMap((page) => page.content).map((u) => ({
      label: u.name ?? 'Без названия',
      value: u.id,
      sublabel: u.address?.city,
    })),
  };
}

export function useDepartmentsQuery(universityId: string | null) {
  return useQuery({
    queryKey: ['departments', universityId],
    queryFn: () => fetchAllPages((page) => getDepartmentsByUniversity(universityId as string, page)),
    select: (list) => list.map((d) => ({ label: d.name ?? 'Без названия', value: d.id })),
    enabled: universityId !== null,
  });
}

export function useRegisterStudentMutation() {
  return useMutation({ mutationFn: registerStudent });
}

export function useRegisterTeacherMutation() {
  return useMutation({ mutationFn: registerTeacher });
}
