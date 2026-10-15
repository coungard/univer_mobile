import { LectureDto, StudentDto } from '../src/api/types';
import {
  greeting,
  lectureDayLabel,
  setupSteps,
  stepsLeftTitle,
  upcomingLectures,
} from '../src/features/profile/profileDay';

const lecture = (id: string, start: Date, durationMinutes = 90): LectureDto => ({
  id,
  title: id,
  scheduledTime: start.toISOString(),
  durationMinutes,
  courseId: 'course',
  groupIds: [],
});

// Wednesday, 14 October 2026, 11:00.
const now = new Date(2026, 9, 14, 11, 0);

describe('upcomingLectures', () => {
  test('skips what has ended, keeps one under way, sorts by time', () => {
    const ended = lecture('ended', new Date(2026, 9, 14, 8, 30));
    const ongoing = lecture('ongoing', new Date(2026, 9, 14, 10, 10));
    const later = lecture('later', new Date(2026, 9, 15, 8, 30));
    expect(upcomingLectures([later, ended, ongoing], now)).toEqual({ nearest: ongoing, next: later });
  });

  test('nothing ahead', () => {
    expect(upcomingLectures([lecture('old', new Date(2026, 8, 1, 8, 30))], now)).toEqual({
      nearest: undefined,
      next: undefined,
    });
  });
});

describe('lectureDayLabel', () => {
  test('now, today, tomorrow, a later day', () => {
    expect(lectureDayLabel(lecture('a', new Date(2026, 9, 14, 10, 10)), now)).toBe('СЕЙЧАС');
    expect(lectureDayLabel(lecture('b', new Date(2026, 9, 14, 12, 20)), now)).toBe('СЕГОДНЯ');
    expect(lectureDayLabel(lecture('c', new Date(2026, 9, 15, 8, 30)), now)).toBe('ЗАВТРА');
    expect(lectureDayLabel(lecture('d', new Date(2026, 9, 19, 8, 30)), now)).toBe('ПН, 19 ОКТЯБРЯ');
  });
});

describe('greeting', () => {
  test('by the hour', () => {
    expect(greeting(new Date(2026, 9, 14, 7))).toBe('Доброе утро,');
    expect(greeting(new Date(2026, 9, 14, 13))).toBe('Добрый день,');
    expect(greeting(new Date(2026, 9, 14, 20))).toBe('Добрый вечер,');
    expect(greeting(new Date(2026, 9, 14, 2))).toBe('Доброй ночи,');
  });
});

describe('setupSteps', () => {
  const base: StudentDto = { id: 's1', username: 'u', firstname: 'А', lastname: 'Б', email: 'e' };

  test('with only a university, the faculty is current and three steps are left', () => {
    const steps = setupSteps({ ...base, universityId: 'u1' }, 'ДГТУ');
    expect(steps.map((s) => [s.title, s.done, s.current])).toEqual([
      ['Университет — ДГТУ', true, false],
      ['Факультет', false, true],
      ['Курс и группа', false, false],
      ['Первая пара', false, false],
    ]);
    expect(stepsLeftTitle(steps.filter((s) => !s.done).length)).toBe('Ещё три шага');
  });

  test('a year without a group is not the «Курс и группа» step done', () => {
    const steps = setupSteps({ ...base, universityId: 'u1', facultyId: 'f1', yearNumber: 2 });
    expect(steps[2]).toEqual({ title: 'Курс и группа', done: false, current: true });
  });

  test('wording for one step', () => {
    expect(stepsLeftTitle(1)).toBe('Ещё один шаг');
  });
});
