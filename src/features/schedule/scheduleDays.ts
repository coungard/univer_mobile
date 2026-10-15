import { addDays, isSameDay, startOfDay } from './dateUtils';

/**
 * Which days of the week the schedule shows (issue #67), as ISO weekday numbers: 1 = Monday …
 * 7 = Sunday — the order of `PairDto.dayOfWeek` (`MONDAY` … `SUNDAY`) and of the spines.
 */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ALL_WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export const WEEKDAY_SHORT_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export function isoWeekday(date: Date): Weekday {
  return (((date.getDay() + 6) % 7) + 1) as Weekday;
}

/** The stored setting back to a list: sorted, no repeats, never empty — anything else is "all days". */
export function parseWeekdays(stored: string | null | undefined): Weekday[] {
  if (!stored) return [...ALL_WEEKDAYS];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [...ALL_WEEKDAYS];
    const days = ALL_WEEKDAYS.filter((day) => parsed.includes(day));
    return days.length > 0 ? days : [...ALL_WEEKDAYS];
  } catch {
    return [...ALL_WEEKDAYS];
  }
}

/** Turns one day on or off; the last day left on stays on, so the week is never empty. */
export function toggleWeekday(enabled: readonly Weekday[], day: Weekday): Weekday[] {
  if (enabled.includes(day)) {
    return enabled.length > 1 ? enabled.filter((d) => d !== day) : [...enabled];
  }
  return ALL_WEEKDAYS.filter((d) => d === day || enabled.includes(d));
}

/**
 * The days of a week to show: the enabled ones, plus a day turned off that has a lecture anyway (a
 * moved or extra one) — hiding it would lose the lecture.
 */
export function shownWeekDays(
  days: readonly Date[],
  enabled: readonly Weekday[],
  lectureTimes: readonly string[],
): Date[] {
  const lectureDates = lectureTimes.map((time) => new Date(time));
  return days.filter(
    (day) => enabled.includes(isoWeekday(day)) || lectureDates.some((date) => isSameDay(date, day)),
  );
}

/** `day` if it is enabled, else the next enabled day after it — what the day view opens. */
export function firstEnabledFrom(day: Date, enabled: readonly Weekday[]): Date {
  const start = startOfDay(day);
  for (let i = 0; i < 7; i++) {
    const candidate = addDays(start, i);
    if (enabled.includes(isoWeekday(candidate))) return candidate;
  }
  return start;
}
