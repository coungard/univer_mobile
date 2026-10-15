import { LectureDto, StudentDto } from '../../api/types';
import { addDays, formatDayDate, isSameDay, shortDayName, startOfDay } from '../schedule/dateUtils';

/** Greeting over the profile (issue #65, «Карточка дня»), by the hour of the device's clock. */
export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро,';
  if (hour >= 12 && hour < 18) return 'Добрый день,';
  if (hour >= 18 && hour < 23) return 'Добрый вечер,';
  return 'Доброй ночи,';
}

/** When a lecture ends; one without a duration counts as a 90-minute pair. */
export function lectureEnd(lecture: LectureDto): Date {
  return new Date(new Date(lecture.scheduledTime).getTime() + (lecture.durationMinutes ?? 90) * 60_000);
}

/**
 * The lecture for the day card and the one after it: the first that hasn't ended by `now` (so one
 * under way is still "the nearest") and the next one. Lectures come in any order.
 */
export function upcomingLectures(
  lectures: readonly LectureDto[],
  now: Date,
): { nearest?: LectureDto; next?: LectureDto } {
  const ahead = lectures
    .filter((lecture) => lectureEnd(lecture).getTime() > now.getTime())
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  return { nearest: ahead[0], next: ahead[1] };
}

/** «СЕЙЧАС», «СЕГОДНЯ», «ЗАВТРА» or «ПН, 19 ОКТЯБРЯ» — the day of a lecture relative to `now`. */
export function lectureDayLabel(lecture: LectureDto, now: Date): string {
  const start = new Date(lecture.scheduledTime);
  if (start.getTime() <= now.getTime()) return 'СЕЙЧАС';
  if (isSameDay(start, now)) return 'СЕГОДНЯ';
  if (isSameDay(start, addDays(startOfDay(now), 1))) return 'ЗАВТРА';
  return `${shortDayName(start)}, ${formatDayDate(start)}`.toUpperCase();
}

export interface SetupStepItem {
  title: string;
  done: boolean;
  /** The first step not done yet — the one «Продолжить настройку» opens. */
  current: boolean;
}

/** The checklist of the unfinished profile's card, ending with the first pair (PLAN.md, M24). */
export function setupSteps(student: StudentDto, universityName?: string): SetupStepItem[] {
  const steps = [
    { title: universityName ? `Университет — ${universityName}` : 'Университет', done: !!student.universityId },
    { title: 'Факультет', done: !!student.facultyId },
    { title: 'Курс и группа', done: student.yearNumber != null && !!student.groupId },
    { title: 'Первая пара', done: false },
  ];
  const current = steps.findIndex((step) => !step.done);
  return steps.map((step, index) => ({ ...step, current: index === current }));
}

const COUNT_WORDS = ['', 'один', 'два', 'три', 'четыре'];

/** «Ещё один шаг», «Ещё три шага». */
export function stepsLeftTitle(left: number): string {
  const word = COUNT_WORDS[left] ?? String(left);
  return `Ещё ${word} ${left === 1 ? 'шаг' : 'шага'}`;
}
