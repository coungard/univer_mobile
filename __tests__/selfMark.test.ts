import { MyAttendanceDto } from '../src/api/types';
import {
  canMark,
  lectureMarkOf,
  markAccessibilityLabel,
  nextMark,
  withMark,
} from '../src/features/attendance/selfMark';

describe('nextMark', () => {
  it('goes round: no mark → был → не был → no mark', () => {
    expect(nextMark('none')).toBe('attended');
    expect(nextMark('attended')).toBe('missed');
    expect(nextMark('missed')).toBe('none');
  });
});

describe('lectureMarkOf', () => {
  it('a lecture absent from GET /attendance/me is unmarked', () => {
    expect(lectureMarkOf(undefined)).toEqual({ mark: 'none', byTeacher: false });
  });

  it("the student's own mark can be changed", () => {
    expect(lectureMarkOf({ lectureId: 'l1', attended: true, source: 'STUDENT' })).toEqual({
      mark: 'attended',
      byTeacher: false,
    });
    expect(lectureMarkOf({ lectureId: 'l1', attended: false, source: 'STUDENT' })).toEqual({
      mark: 'missed',
      byTeacher: false,
    });
  });

  it("the teacher's mark is the resulting one and is locked", () => {
    expect(lectureMarkOf({ lectureId: 'l1', attended: false, source: 'TEACHER' })).toEqual({
      mark: 'missed',
      byTeacher: true,
    });
  });
});

describe('withMark', () => {
  const marks: MyAttendanceDto[] = [
    { lectureId: 'l1', attended: true, source: 'STUDENT' },
    { lectureId: 'l2', attended: false, source: 'TEACHER' },
  ];

  it('adds a mark', () => {
    expect(withMark(marks, 'l3', 'attended')).toContainEqual({ lectureId: 'l3', attended: true, source: 'STUDENT' });
  });

  it('replaces the mark of the same lecture', () => {
    const next = withMark(marks, 'l1', 'missed');
    expect(next.filter((dto) => dto.lectureId === 'l1')).toEqual([
      { lectureId: 'l1', attended: false, source: 'STUDENT' },
    ]);
  });

  it('removes the mark and leaves the others', () => {
    expect(withMark(marks, 'l1', 'none')).toEqual([marks[1]]);
  });
});

describe('canMark', () => {
  const now = new Date('2026-10-16T10:00:00');

  it('a started lecture can be marked, a future one cannot', () => {
    expect(canMark({ scheduledTime: '2026-10-16T08:30:00' }, now)).toBe(true);
    expect(canMark({ scheduledTime: '2026-10-16T10:00:00' }, now)).toBe(true);
    expect(canMark({ scheduledTime: '2026-10-16T12:20:00' }, now)).toBe(false);
  });
});

describe('markAccessibilityLabel', () => {
  it('names the mark and what a tap does', () => {
    expect(markAccessibilityLabel('08:30', { mark: 'none', byTeacher: false })).toBe('08:30, без отметки — отметить');
    expect(markAccessibilityLabel('10:10', { mark: 'attended', byTeacher: false })).toBe('10:10, был — сменить');
    expect(markAccessibilityLabel('10:10', { mark: 'missed', byTeacher: true })).toBe(
      '10:10, не был — отметил преподаватель',
    );
  });
});
