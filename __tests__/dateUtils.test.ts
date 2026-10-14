import { addDays, getWeek, isSameDay, weekOffsetOf } from '../src/features/schedule/dateUtils';

describe('addDays', () => {
  test('steps over the end of a month and of a year', () => {
    expect(isSameDay(addDays(new Date(2026, 9, 31), 1), new Date(2026, 10, 1))).toBe(true);
    expect(isSameDay(addDays(new Date(2027, 0, 1), -1), new Date(2026, 11, 31))).toBe(true);
  });
});

describe('weekOffsetOf', () => {
  // A Tuesday.
  const today = new Date(2026, 9, 13, 15, 0);

  test('the current week is 0, whatever the day in it', () => {
    expect(weekOffsetOf(new Date(2026, 9, 12, 8, 30), today)).toBe(0);
    expect(weekOffsetOf(new Date(2026, 9, 18, 23, 0), today)).toBe(0);
  });

  test('next Monday is already the next week', () => {
    expect(weekOffsetOf(new Date(2026, 9, 19, 8, 30), today)).toBe(1);
  });

  test('past weeks are negative', () => {
    expect(weekOffsetOf(new Date(2026, 8, 7, 8, 30), today)).toBe(-5);
  });

  test('agrees with getWeek', () => {
    const date = new Date(2026, 11, 3, 10, 10);
    const week = getWeek(weekOffsetOf(date, today), today);
    expect(date >= week.start && date < week.end).toBe(true);
  });
});
