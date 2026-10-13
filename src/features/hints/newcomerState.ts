import { StudentDto, WeekScheduleCycleStatus } from '../../api/types';

/** The first thing on the way to a schedule that the student doesn't have yet. */
export type NewcomerMissing = 'university' | 'faculty' | 'year' | 'group' | 'pair';

export type NewcomerState =
  /** Not enough data yet (loading or a failed request) — no hints rather than wrong ones. */
  | { kind: 'unknown' }
  /** No pair in the schedule; `stage` is the index into `HINT_STAGES` the student is on. */
  | { kind: 'newcomer'; missing: NewcomerMissing; stage: 0 | 1 | 2 }
  /** No pairs, but the schedule is agreed — the student can't add any, so there's nowhere to lead. */
  | { kind: 'closed' }
  /** The group has pairs — not a newcomer. */
  | { kind: 'settled' };

interface NewcomerInput {
  student: StudentDto | undefined;
  /** Number of pairs of the student's group; `undefined` while unknown. Ignored without a group. */
  pairCount: number | undefined;
  /** The semester's schedule: its status, `null` when there is none, `undefined` while unknown. */
  cycleStatus: WeekScheduleCycleStatus | null | undefined;
}

/**
 * Who is a newcomer and where their hints start (PLAN.md, sections 1 and 3.3): any student without
 * a single pair in the schedule, whenever they registered. Decided from server data only, so the
 * mode resumes at the right place after the app is closed.
 */
export function newcomerState({ student, pairCount, cycleStatus }: NewcomerInput): NewcomerState {
  if (!student) return { kind: 'unknown' };
  if (!student.universityId) return { kind: 'newcomer', missing: 'university', stage: 0 };
  if (!student.facultyId) return { kind: 'newcomer', missing: 'faculty', stage: 0 };
  if (student.yearNumber == null) return { kind: 'newcomer', missing: 'year', stage: 1 };
  if (!student.groupId) return { kind: 'newcomer', missing: 'group', stage: 1 };

  if (pairCount === undefined) return { kind: 'unknown' };
  if (pairCount > 0) return { kind: 'settled' };
  if (cycleStatus === undefined) return { kind: 'unknown' };
  if (cycleStatus === 'AGREED') return { kind: 'closed' };
  return { kind: 'newcomer', missing: 'pair', stage: 2 };
}
