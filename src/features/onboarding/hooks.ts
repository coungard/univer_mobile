import { useMutation, useQuery } from '@tanstack/react-query';
import { getDepartmentsByUniversity } from '../../api/endpoints/departments';
import { registerStudent } from '../../api/endpoints/students';
import { registerTeacher } from '../../api/endpoints/teachers';
import { getUniversities } from '../../api/endpoints/universities';

export function useUniversitiesQuery() {
  return useQuery({
    queryKey: ['universities'],
    queryFn: () => getUniversities(0, 50),
    select: (page) => page.content.map((u) => ({ label: u.name, value: u.id })),
  });
}

export function useDepartmentsQuery(universityId: string | null) {
  return useQuery({
    queryKey: ['departments', universityId],
    queryFn: () => getDepartmentsByUniversity(universityId as string, 0, 50),
    select: (page) => page.content.map((d) => ({ label: d.name, value: d.id })),
    enabled: universityId !== null,
  });
}

export function useRegisterStudentMutation() {
  return useMutation({ mutationFn: registerStudent });
}

export function useRegisterTeacherMutation() {
  return useMutation({ mutationFn: registerTeacher });
}
