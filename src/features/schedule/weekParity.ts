import { SemesterWeekDto, WeekParity } from '../../api/types';

/**
 * A semester week's number and parity (issue #69). The server counts them (univer#107) — by the same
 * rule it makes lectures with, so a pair made `ODD` from an odd week lands on that week; the app only
 * shows them.
 */
export interface SemesterWeek {
  number: number;
  parity: 'ODD' | 'EVEN';
}

/** `"2026-09-01"` as local midnight — `new Date("2026-09-01")` would be UTC midnight. */
export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Back to `"2026-09-01"` in local time — a date for a route param. */
export function formatLocalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The week of `GET /semesters/{id}/week`, or `null` outside the semester (`inSemester: false`) — the
 * first and last weeks count even if the semester covers only part of them.
 */
export function semesterWeekOf(dto: SemesterWeekDto | undefined): SemesterWeek | null {
  // `null`, not just missing, in JSON outside the semester.
  if (!dto?.inSemester || typeof dto.weekNumber !== 'number') return null;
  if (dto.weekParity !== 'ODD' && dto.weekParity !== 'EVEN') return null;
  return { number: dto.weekNumber, parity: dto.weekParity };
}

/** e.g. «7-я неделя · нечётная» — the line under the week's dates. */
export function semesterWeekLabel(week: SemesterWeek): string {
  return `${week.number}-я неделя · ${week.parity === 'ODD' ? 'нечётная' : 'чётная'}`;
}

interface PairSlot {
  dayOfWeek: string;
  weekParity: WeekParity;
  pairNumber: number;
}

/**
 * The first pair number of the bell schedule that is free on `dayOfWeek` for `parity`: not taken by
 * a pair of the group on that day with the same parity or «Каждую неделю» — and for «Каждую неделю»
 * not taken by any. `null` when all are taken.
 */
export function firstFreePairNumber(
  numbers: readonly number[],
  pairs: readonly PairSlot[],
  dayOfWeek: string,
  parity: WeekParity,
): number | null {
  const taken = new Set(
    pairs
      .filter((p) => p.dayOfWeek === dayOfWeek && (parity === 'BOTH' || p.weekParity === 'BOTH' || p.weekParity === parity))
      .map((p) => p.pairNumber),
  );
  return [...numbers].sort((a, b) => a - b).find((n) => !taken.has(n)) ?? null;
}
