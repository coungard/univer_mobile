import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getFacultiesByUniversity } from '../../api/endpoints/faculties';
import { getGroupsByFacultyAndYear } from '../../api/endpoints/groups';
import { getRegions } from '../../api/endpoints/regions';
import { registerStudent, updateOwnStudent } from '../../api/endpoints/students';
import { registerTeacher } from '../../api/endpoints/teachers';
import { getUniversities } from '../../api/endpoints/universities';
import { GroupDto, Page } from '../../api/types';
import { useOwnUserId } from '../profile/hooks';

/**
 * Searchable university list for `SearchableSelectField`'s picker (ROADMAP.md "Фаза 2"), backed by
 * the backend's own `?search=` filter (case-insensitive substring on name) rather than a client-side
 * filter — with the university count this large, fetching every page up front no longer scales.
 * `search` is debounced locally so typing doesn't fire a request per keystroke; results page in via
 * `useInfiniteQuery`, same incremental-loading pattern as `useCoursesQuery`
 * (`features/courses/hooks.ts`).
 */
export function useUniversitiesQuery(search: string, regionId?: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ['universities', 'search', debouncedSearch, regionId ?? null],
    queryFn: ({ pageParam }) => getUniversities(debouncedSearch || undefined, pageParam, 20, regionId),
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

/** All 89 regions for the "select region" step — small and static, so cached for the session. */
export function useRegionsQuery() {
  return useQuery({ queryKey: ['regions'], queryFn: getRegions, staleTime: Infinity });
}

/** Faculties of one university — a short list, loaded whole and filtered on the client. */
export function useFacultiesQuery(universityId: string | null | undefined) {
  return useQuery({
    queryKey: ['faculties', 'university', universityId],
    queryFn: () => getFacultiesByUniversity(universityId as string),
    enabled: !!universityId,
    select: (page) => page.content,
  });
}

/** Groups of a faculty on a given year (current semester only — the backend decides which). */
export function useGroupsQuery(facultyId: string | null | undefined, yearNumber: number | null | undefined) {
  return useQuery({
    queryKey: ['groups', 'faculty', facultyId, yearNumber],
    queryFn: () => getGroupsByFacultyAndYear(facultyId as string, yearNumber as number),
    enabled: !!facultyId && yearNumber != null,
    select: (page) => page.content,
  });
}

/**
 * How many groups the faculty has on each of `years` — a one-element page per year, read for its
 * `totalElements`. Purely a hint on the year step: an entry stays `undefined` while loading or
 * if its request failed, and the step works the same without it.
 */
export function useGroupCountsByYear(facultyId: string | null | undefined, years: readonly number[]) {
  return useQueries({
    queries: years.map((year) => ({
      queryKey: ['groups', 'faculty', facultyId, year, 'count'],
      queryFn: () => getGroupsByFacultyAndYear(facultyId as string, year, 0, 1),
      enabled: !!facultyId,
      select: (page: Page<GroupDto>) => page.totalElements,
    })),
    combine: (results) => results.map((result) => result.data),
  });
}

/**
 * `PATCH /students/me`. The response replaces the cached own profile right away; everything else
 * is invalidated because a new group changes what the schedule and the profile's academic path show.
 */
export function useUpdateOwnStudentMutation() {
  const queryClient = useQueryClient();
  const id = useOwnUserId();
  return useMutation({
    mutationFn: updateOwnStudent,
    onSuccess: (student) => {
      queryClient.setQueryData(['students', id], student);
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'students' });
    },
  });
}

export function useRegisterStudentMutation() {
  return useMutation({ mutationFn: registerStudent });
}

export function useRegisterTeacherMutation() {
  return useMutation({ mutationFn: registerTeacher });
}
