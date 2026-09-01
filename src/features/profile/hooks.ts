import { useQuery } from '@tanstack/react-query';
import { getFaculty } from '../../api/endpoints/faculties';
import { getGroup } from '../../api/endpoints/groups';
import { getProgram } from '../../api/endpoints/programs';
import { getSemester } from '../../api/endpoints/semesters';
import { getStudent } from '../../api/endpoints/students';
import { getStudyYear } from '../../api/endpoints/studyYears';
import { getTeacher } from '../../api/endpoints/teachers';
import { getUniversity } from '../../api/endpoints/universities';
import { useAuthStore } from '../../auth/authStore';

/** The signed-in user's backend entity id — equals `Student.id`/`Teacher.id` (see API.md). */
function useOwnUserId(): string | null {
  return useAuthStore((state) => state.claims?.sub) ?? null;
}

export function useOwnStudentQuery() {
  const id = useOwnUserId();
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => getStudent(id as string),
    enabled: id !== null,
  });
}

export function useOwnTeacherQuery() {
  const id = useOwnUserId();
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => getTeacher(id as string),
    enabled: id !== null,
  });
}

export function useUniversityQuery(universityId: string | undefined) {
  return useQuery({
    queryKey: ['universities', universityId],
    queryFn: () => getUniversity(universityId as string),
    enabled: universityId !== undefined,
  });
}

export function useFacultyQuery(facultyId: string | undefined) {
  return useQuery({
    queryKey: ['faculties', facultyId],
    queryFn: () => getFaculty(facultyId as string),
    enabled: facultyId !== undefined,
  });
}

/**
 * Resolves a student's group → semester → study year → program → faculty chain (see API.md —
 * `GroupDto` only carries `semesterId`, there is no direct link to program/faculty). Each step is
 * a separate dependent query, gated on the previous one having resolved, so the whole chain stays
 * cheap (cached per id) and simply doesn't run at all when `groupId` is null/undefined (Фаза 2:
 * student without an assigned group).
 */
export function useGroupAcademicPathQuery(groupId: string | null | undefined) {
  const group = useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => getGroup(groupId as string),
    enabled: !!groupId,
  });

  const semester = useQuery({
    queryKey: ['semesters', group.data?.semesterId],
    queryFn: () => getSemester(group.data!.semesterId),
    enabled: group.data?.semesterId !== undefined,
  });

  const studyYear = useQuery({
    queryKey: ['studyYears', semester.data?.studyYearId],
    queryFn: () => getStudyYear(semester.data!.studyYearId),
    enabled: semester.data?.studyYearId !== undefined,
  });

  const program = useQuery({
    queryKey: ['programs', studyYear.data?.programId],
    queryFn: () => getProgram(studyYear.data!.programId),
    enabled: studyYear.data?.programId !== undefined,
  });

  const faculty = useFacultyQuery(program.data?.facultyId);

  return {
    group: group.data,
    program: program.data,
    faculty: faculty.data,
    isLoading: !!groupId && (group.isLoading || semester.isLoading || studyYear.isLoading || program.isLoading || faculty.isLoading),
    isError: group.isError || semester.isError || studyYear.isError || program.isError || faculty.isError,
  };
}
