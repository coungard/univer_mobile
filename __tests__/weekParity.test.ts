import {
  firstFreePairNumber,
  formatLocalDate,
  parseLocalDate,
  semesterWeekLabel,
  semesterWeekOf,
} from '../src/features/schedule/weekParity';

describe('semesterWeekOf', () => {
  const week = { weekStart: '2026-10-12', weekEnd: '2026-10-18' };

  test('a week of the semester: the number and parity from the server', () => {
    expect(semesterWeekOf({ ...week, inSemester: true, weekNumber: 7, weekParity: 'ODD' })).toEqual({
      number: 7,
      parity: 'ODD',
    });
  });

  test('outside the semester, or not loaded yet, there is no week', () => {
    // JSON gives `null` for the number and parity outside the semester.
    const outside = JSON.parse('{"inSemester":false,"weekNumber":null,"weekParity":null}');
    expect(semesterWeekOf(outside)).toBeNull();
    expect(semesterWeekOf(undefined)).toBeNull();
    expect(semesterWeekOf({ ...week, inSemester: true, weekNumber: 7, weekParity: 'BOTH' })).toBeNull();
  });

  test('parseLocalDate is local midnight; formatLocalDate turns it back', () => {
    const date = parseLocalDate('2026-09-01');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 8, 1, 0]);
    expect(formatLocalDate(new Date(2026, 9, 13, 23, 30))).toBe('2026-10-13');
  });

  test('label', () => {
    expect(semesterWeekLabel({ number: 7, parity: 'ODD' })).toBe('7-я неделя · нечётная');
    expect(semesterWeekLabel({ number: 2, parity: 'EVEN' })).toBe('2-я неделя · чётная');
  });
});

describe('firstFreePairNumber', () => {
  const bells = [1, 2, 3, 4];
  const pairs = [
    { dayOfWeek: 'TUESDAY', weekParity: 'BOTH' as const, pairNumber: 1 },
    { dayOfWeek: 'TUESDAY', weekParity: 'ODD' as const, pairNumber: 2 },
    { dayOfWeek: 'WEDNESDAY', weekParity: 'EVEN' as const, pairNumber: 1 },
  ];

  test('skips pairs of the same parity and «Каждую неделю»', () => {
    expect(firstFreePairNumber(bells, pairs, 'TUESDAY', 'ODD')).toBe(3);
    expect(firstFreePairNumber(bells, pairs, 'TUESDAY', 'EVEN')).toBe(2);
  });

  test('«Каждую неделю» needs the number free in both weeks', () => {
    expect(firstFreePairNumber(bells, pairs, 'TUESDAY', 'BOTH')).toBe(3);
    expect(firstFreePairNumber(bells, pairs, 'WEDNESDAY', 'BOTH')).toBe(2);
    expect(firstFreePairNumber(bells, pairs, 'WEDNESDAY', 'ODD')).toBe(1);
  });

  test('other days do not matter; all taken gives null', () => {
    expect(firstFreePairNumber(bells, pairs, 'MONDAY', 'BOTH')).toBe(1);
    expect(firstFreePairNumber([1, 2], pairs, 'TUESDAY', 'ODD')).toBeNull();
  });
});
