/**
 * Small hand-rolled Monday–Sunday week helpers — no date library in this project (see
 * `auth/jwt.ts`'s decoder for the same "write the ~15 lines by hand" call), and all we need here
 * is week boundaries/labels in the device's local time zone.
 */

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday of the week containing `date` (ISO week start, matching `PairDto.dayOfWeek`'s `MONDAY`…`SUNDAY`). */
function mondayOf(date: Date): Date {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(date, diffToMonday));
}

export interface Week {
  /** Monday 00:00. */
  start: Date;
  /** The Monday after this week's Sunday (i.e. an exclusive upper bound) — handy for range filters. */
  end: Date;
  /** Monday..Sunday, 7 entries. */
  days: Date[];
}

/** The Monday–Sunday week `offsetWeeks` weeks from the current one (0 = this week, -1 = last, ...). */
export function getWeek(offsetWeeks: number, today: Date = new Date()): Week {
  const start = addDays(mondayOf(today), offsetWeeks * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return { start, end: addDays(start, 7), days };
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayName(date: Date): string {
  const day = date.getDay();
  return DAY_NAMES[day === 0 ? 6 : day - 1];
}

export function formatDayDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** e.g. "1–7 сентября" or "29 сентября – 5 октября" when the week spans two months. */
export function formatWeekRangeLabel(week: Week): string {
  const last = addDays(week.start, 6);
  const sameMonth = week.start.getMonth() === last.getMonth();
  const from = sameMonth ? `${week.start.getDate()}` : formatDayDate(week.start);
  return `${from}–${formatDayDate(last)}`;
}
