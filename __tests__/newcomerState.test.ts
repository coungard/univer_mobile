import { StudentDto } from '../src/api/types';
import { newcomerState } from '../src/features/hints/newcomerState';

const full = {
  universityId: 'u',
  facultyId: 'f',
  yearNumber: 1,
  groupId: 'g',
} as StudentDto;

function student(patch: Partial<StudentDto>): StudentDto {
  return { ...full, ...patch };
}

describe('newcomerState', () => {
  test('unknown until the profile is loaded', () => {
    expect(newcomerState({ student: undefined, pairCount: undefined, cycleStatus: undefined })).toEqual({
      kind: 'unknown',
    });
  });

  test.each([
    [{ universityId: null, facultyId: null, yearNumber: null, groupId: null }, 'university', 0],
    [{ facultyId: null, yearNumber: null, groupId: null }, 'faculty', 0],
    [{ yearNumber: null, groupId: null }, 'year', 1],
    [{ groupId: null }, 'group', 1],
  ])('profile gap %j starts at %s', (patch, missing, stage) => {
    // Pairs and the cycle are irrelevant without a group — they must not hold the hint back.
    expect(
      newcomerState({ student: student(patch as Partial<StudentDto>), pairCount: undefined, cycleStatus: undefined }),
    ).toEqual({ kind: 'newcomer', missing, stage });
  });

  test('a group without pairs leads to the first pair', () => {
    expect(newcomerState({ student: full, pairCount: 0, cycleStatus: 'DRAFT' })).toEqual({
      kind: 'newcomer',
      missing: 'pair',
      stage: 2,
    });
  });

  test('a group without a schedule cycle is still a newcomer', () => {
    expect(newcomerState({ student: full, pairCount: 0, cycleStatus: null })).toEqual({
      kind: 'newcomer',
      missing: 'pair',
      stage: 2,
    });
  });

  test('an agreed schedule without pairs has nowhere to lead', () => {
    expect(newcomerState({ student: full, pairCount: 0, cycleStatus: 'AGREED' })).toEqual({ kind: 'closed' });
  });

  test('a group with pairs is not a newcomer, whatever the cycle', () => {
    expect(newcomerState({ student: full, pairCount: 3, cycleStatus: undefined })).toEqual({ kind: 'settled' });
  });

  test('unknown while pairs or the cycle are loading', () => {
    expect(newcomerState({ student: full, pairCount: undefined, cycleStatus: 'DRAFT' })).toEqual({ kind: 'unknown' });
    expect(newcomerState({ student: full, pairCount: 0, cycleStatus: undefined })).toEqual({ kind: 'unknown' });
  });
});
