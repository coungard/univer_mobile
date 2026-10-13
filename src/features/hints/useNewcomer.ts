import { useGroupAcademicPathQuery, useOwnStudentQuery } from '../profile/hooks';
import { useGroupPairsQuery, useWeekScheduleCycleQuery } from '../schedule/hooks';
import { newcomerState, NewcomerState } from './newcomerState';

/**
 * The newcomer state of the signed-in student (see `newcomerState`). Reuses the queries the profile
 * and schedule screens already make, so a screen that shows a hint costs no extra requests there.
 */
export function useNewcomer(): NewcomerState {
  const student = useOwnStudentQuery();
  const groupId = student.data?.groupId ?? undefined;
  const pairs = useGroupPairsQuery(groupId);
  const academicPath = useGroupAcademicPathQuery(groupId);
  const cycle = useWeekScheduleCycleQuery(academicPath.group?.semesterId);

  return newcomerState({
    student: student.data,
    pairCount: pairs.data?.length,
    cycleStatus: cycle.data === undefined ? undefined : cycle.data?.status ?? null,
  });
}
