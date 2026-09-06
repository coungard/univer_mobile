import { useMutation, useQuery } from '@tanstack/react-query';
import { getDepartmentsByUniversity } from '../../api/endpoints/departments';
import { fetchAllPages } from '../../api/pagination';
import { registerStudent } from '../../api/endpoints/students';
import { registerTeacher } from '../../api/endpoints/teachers';
import { getUniversities } from '../../api/endpoints/universities';

/**
 * The full university list for `SelectField`'s picker (ROADMAP.md "Фаза 2"). Fetches every page
 * (`fetchAllPages`, `api/pagination.ts`), not just the first, so a university past the first page
 * doesn't just silently fail to appear as an option during registration.
 */
export function useUniversitiesQuery() {
  return useQuery({
    queryKey: ['universities'],
    queryFn: () => fetchAllPages((page) => getUniversities(page)),
    // `name` is optional per the backend's own OpenAPI schema (no `@NotBlank` on University.name) —
    // fall back rather than assume it's always set.
    select: (list) => list.map((u) => ({ label: u.name ?? 'Без названия', value: u.id })),
  });
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
