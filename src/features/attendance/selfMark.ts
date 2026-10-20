import { LectureDto, MyAttendanceDto } from '../../api/types';

/** A lecture's mark as the time plaque shows it (issue #71, «Цвет времени»). */
export type SelfMark = 'none' | 'attended' | 'missed';

export interface LectureMark {
  mark: SelfMark;
  /** Marked by the teacher: their mark wins over the student's and the plaque can't be tapped. */
  byTeacher: boolean;
}

/** One tap moves round: no mark → «был» → «не был» → no mark. */
export function nextMark(mark: SelfMark): SelfMark {
  return mark === 'none' ? 'attended' : mark === 'attended' ? 'missed' : 'none';
}

/** The resulting mark from `GET /attendance/me`; a lecture absent there is unmarked. */
export function lectureMarkOf(dto: MyAttendanceDto | undefined): LectureMark {
  if (!dto || dto.attended == null) return { mark: 'none', byTeacher: false };
  return { mark: dto.attended ? 'attended' : 'missed', byTeacher: dto.source === 'TEACHER' };
}

/** The `GET /attendance/me` list with `mark` applied to one lecture — what the cache holds right after a tap. */
export function withMark(marks: MyAttendanceDto[], lectureId: string, mark: SelfMark): MyAttendanceDto[] {
  const others = marks.filter((dto) => dto.lectureId !== lectureId);
  return mark === 'none' ? others : [...others, { lectureId, attended: mark === 'attended', source: 'STUDENT' }];
}

/** Only a lecture that has started can be marked — the server refuses one before that. */
export function canMark(lecture: Pick<LectureDto, 'scheduledTime'>, now: Date): boolean {
  return new Date(lecture.scheduledTime).getTime() <= now.getTime();
}

const MARK_WORDS: Record<SelfMark, string> = { none: 'без отметки', attended: 'был', missed: 'не был' };

/** «был», «не был», «без отметки». */
export function markWord(mark: SelfMark): string {
  return MARK_WORDS[mark];
}

/** «08:30, без отметки — отметить», «08:30, был — сменить», «08:30, был — отметил преподаватель». */
export function markAccessibilityLabel(time: string, { mark, byTeacher }: LectureMark): string {
  const action = byTeacher ? 'отметил преподаватель' : mark === 'none' ? 'отметить' : 'сменить';
  return `${time}, ${markWord(mark)} — ${action}`;
}
