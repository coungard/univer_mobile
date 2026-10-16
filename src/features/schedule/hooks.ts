import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEffectiveBellSchedule } from '../../api/endpoints/bellScheduleEntries';
import { generateSemesterLectures, getLecture, getMyLectures } from '../../api/endpoints/lectures';
import { createPair, deletePair, getPair, getPairsByGroup, updatePair } from '../../api/endpoints/pairs';
import { getTeachersByFaculty } from '../../api/endpoints/teachers';
import { openOwnWeekScheduleCycle } from '../../api/endpoints/weekScheduleCycles';
import { fetchAllPages } from '../../api/pagination';
import { PairInput } from '../../api/types';

/**
 * Fetches the student's *complete* lecture list (`GET /lectures/me`, every page — a single page
 * capped at a couple hundred would silently drop the most recent lectures for a student who has
 * accumulated more than that across their studies, since the backend returns them ascending by
 * `scheduledTime`; see `api/pagination.ts`). Week-by-week filtering happens client-side in
 * `ScheduleScreen` against this single cached result, so switching weeks doesn't refetch.
 */
export function useMyLecturesQuery() {
  return useQuery({
    queryKey: ['lectures', 'me'],
    queryFn: () => fetchAllPages((page) => getMyLectures(page)),
  });
}

/** `GET /lectures/{id}` — powers `LectureDetailsScreen` (ROADMAP.md "Фаза 4"). */
export function useLectureQuery(lectureId: string) {
  return useQuery({
    queryKey: ['lectures', lectureId],
    queryFn: () => getLecture(lectureId),
  });
}

/**
 * The `WeekScheduleCycle` of the semester the student's group studies in, with its `DRAFT`/`AGREED`
 * status — the central gate for "студент сам заполняет расписание" (`UI_UX.md` разделы 4/6). The
 * server opens the cycle when the semester has none (see `api/endpoints/weekScheduleCycles.ts`), so
 * a group always gets one; `groupId` is only what the result is cached by.
 */
export function useOwnWeekScheduleCycleQuery(groupId: string | undefined) {
  return useQuery({
    queryKey: ['weekScheduleCycles', 'own', groupId],
    queryFn: () => openOwnWeekScheduleCycle(),
    enabled: groupId !== undefined,
  });
}

/** A group's `Pair` templates — `GroupScheduleScreen`'s "Расписание группы" (`UI_UX.md` раздел 4). */
export function useGroupPairsQuery(groupId: string | undefined) {
  return useQuery({
    queryKey: ['pairs', 'group', groupId],
    queryFn: () => fetchAllPages((page) => getPairsByGroup(groupId as string, page)),
    enabled: groupId !== undefined,
  });
}

/** The faculty's registered teachers — the suggestions of the pair form's «Преподаватель» (issue #68). */
export function useFacultyTeachersQuery(facultyId: string | undefined) {
  return useQuery({
    queryKey: ['teachers', 'faculty', facultyId],
    queryFn: () => fetchAllPages((page) => getTeachersByFaculty(facultyId as string, page)),
    enabled: facultyId !== undefined,
  });
}

/** `GET /pairs/{id}` — loads a single `Pair` into `PairFormScreen`'s edit mode by id, not list cache. */
export function usePairQuery(pairId: string | undefined) {
  return useQuery({
    queryKey: ['pairs', pairId],
    queryFn: () => getPair(pairId as string),
    enabled: pairId !== undefined,
  });
}

/**
 * "Номер пары -> время" для университета студента: свои звонки, а где их нет — звонки по умолчанию.
 * Время пары студент не вводит — форма показывает его рядом с номером, а подставляет сервер (см.
 * `api/endpoints/bellScheduleEntries.ts`).
 */
export function useEffectiveBellScheduleQuery(universityId: string | undefined) {
  return useQuery({
    queryKey: ['bellScheduleEntries', 'effective', universityId],
    queryFn: () => getEffectiveBellSchedule(universityId as string),
    enabled: universityId !== undefined,
  });
}

/** Invalidates a group's `Pair` list after any create/update/delete so `GroupScheduleScreen` refetches. */
function usePairsInvalidation(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['pairs', 'group', groupId] });
}

/**
 * Same, plus the student's lectures: the server recreates a pair's lectures when the pair is changed
 * and removes them when it is deleted (univer#99), so the schedule tab has to refetch too.
 */
function usePairsAndLecturesInvalidation(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidatePairs = usePairsInvalidation(groupId);
  return () => Promise.all([invalidatePairs(), queryClient.invalidateQueries({ queryKey: ['lectures', 'me'] })]);
}

export function useCreatePairMutation(groupId: string | undefined) {
  const invalidate = usePairsInvalidation(groupId);
  return useMutation({
    mutationFn: (pair: PairInput) => createPair(pair),
    onSuccess: invalidate,
  });
}

export function useUpdatePairMutation(groupId: string | undefined) {
  const invalidate = usePairsAndLecturesInvalidation(groupId);
  return useMutation({
    mutationFn: ({ id, pair }: { id: string; pair: PairInput }) => updatePair(id, pair),
    onSuccess: invalidate,
  });
}

export function useDeletePairMutation(groupId: string | undefined) {
  const invalidate = usePairsAndLecturesInvalidation(groupId);
  return useMutation({
    mutationFn: (id: string) => deletePair(id),
    onSuccess: invalidate,
  });
}

/**
 * `POST /lectures/generate/semester/{id}` — invalidates `GET /lectures/me` on success so
 * `ScheduleScreen` picks up the newly generated lectures without the student refreshing manually.
 */
export function useGenerateSemesterLecturesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weekScheduleCycleId: string) => generateSemesterLectures(weekScheduleCycleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lectures', 'me'] }),
  });
}
