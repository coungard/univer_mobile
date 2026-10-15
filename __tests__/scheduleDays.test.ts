import { getWeek, isSameDay } from '../src/features/schedule/dateUtils';
import {
  ALL_WEEKDAYS,
  firstEnabledFrom,
  isoWeekday,
  parseWeekdays,
  shownWeekDays,
  toggleWeekday,
} from '../src/features/schedule/scheduleDays';

// Monday 12 – Sunday 18 October 2026.
const week = getWeek(0, new Date(2026, 9, 14));
const weekdays: (1 | 2 | 3 | 4 | 5 | 6 | 7)[] = [1, 2, 3, 4, 5];

describe('isoWeekday', () => {
  test('Monday is 1, Sunday is 7', () => {
    expect(isoWeekday(new Date(2026, 9, 12))).toBe(1);
    expect(isoWeekday(new Date(2026, 9, 18))).toBe(7);
  });
});

describe('parseWeekdays', () => {
  test('nothing stored, garbage or an empty list mean every day', () => {
    expect(parseWeekdays(null)).toEqual([...ALL_WEEKDAYS]);
    expect(parseWeekdays('oops')).toEqual([...ALL_WEEKDAYS]);
    expect(parseWeekdays('[]')).toEqual([...ALL_WEEKDAYS]);
  });

  test('keeps known days, sorted, once each', () => {
    expect(parseWeekdays('[5, 1, 1, 9, 3]')).toEqual([1, 3, 5]);
  });
});

describe('toggleWeekday', () => {
  test('turns a day off and back on in order', () => {
    expect(toggleWeekday([1, 2, 3, 4, 5, 6, 7], 7)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(toggleWeekday([1, 2, 3, 4, 5], 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('the last day left stays on', () => {
    expect(toggleWeekday([3], 3)).toEqual([3]);
  });
});

describe('shownWeekDays', () => {
  test('only the enabled days', () => {
    const shown = shownWeekDays(week.days, weekdays, []);
    expect(shown.map(isoWeekday)).toEqual([1, 2, 3, 4, 5]);
  });

  test('a day turned off with a lecture on it is shown anyway', () => {
    const saturdayLecture = new Date(2026, 9, 17, 10, 10).toISOString();
    const shown = shownWeekDays(week.days, weekdays, [saturdayLecture]);
    expect(shown.map(isoWeekday)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('firstEnabledFrom', () => {
  test('an enabled day is itself', () => {
    expect(isSameDay(firstEnabledFrom(new Date(2026, 9, 14, 15), weekdays), new Date(2026, 9, 14))).toBe(true);
  });

  test('a Sunday turned off moves on to Monday of the next week', () => {
    expect(isSameDay(firstEnabledFrom(new Date(2026, 9, 18), weekdays), new Date(2026, 9, 19))).toBe(true);
  });
});
