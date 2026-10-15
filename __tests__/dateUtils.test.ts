import { addDays, getWeek, isSameDay, nearestOutside, weekOffsetOf } from '../src/features/schedule/dateUtils';

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

describe('nearestOutside', () => {
  const at = (id: string, date: Date) => ({ id, scheduledTime: date.toISOString() });
  const week = getWeek(0, new Date(2026, 9, 14));
  const before = at('before', new Date(2026, 9, 6, 8, 30));
  const earlier = at('earlier', new Date(2026, 8, 29, 8, 30));
  const after = at('after', new Date(2026, 9, 20, 12, 20));
  const later = at('later', new Date(2026, 9, 27, 12, 20));

  test('none when the period has a lecture of its own', () => {
    const inside = at('inside', new Date(2026, 9, 12, 8, 30));
    expect(nearestOutside([before, inside, after], week.start, week.end)).toBeNull();
  });

  test('none without lectures at all', () => {
    expect(nearestOutside([], week.start, week.end)).toBeNull();
  });

  test('the first lecture ahead, whatever the order', () => {
    expect(nearestOutside([later, before, after], week.start, week.end)).toEqual({ item: after, later: true });
  });

  test('the last lecture behind when nothing is ahead', () => {
    expect(nearestOutside([earlier, before], week.start, week.end)).toEqual({ item: before, later: false });
  });

  test('the period end is exclusive: next Monday 00:00 is already ahead', () => {
    const monday = at('monday', week.end);
    expect(nearestOutside([monday], week.start, week.end)).toEqual({ item: monday, later: true });
  });
});
