import { TeacherDto } from '../../api/types';

/**
 * «Иванов Иван Иванович» → «Иванов И. И.» — the teacher in a schedule row (issue #68). Only a full
 * name of exactly three words is shortened: two words may be either order («Иван Иванов»), and a name
 * typed with initials already is left as it is. The lecture screen shows the name in full.
 */
export function shortTeacherName(name: string | null | undefined): string | undefined {
  const trimmed = name?.trim();
  if (!trimmed) return undefined;
  const words = trimmed.split(/\s+/);
  if (words.length !== 3 || words.some((word) => word.includes('.'))) return words.join(' ');
  const [surname, first, middle] = words;
  return `${surname} ${first[0].toUpperCase()}. ${middle[0].toUpperCase()}.`;
}

/** The second line of a pair or lecture: «ауд. 125 · Иванов И. И.», or nothing if neither is known. */
export function roomAndTeacher(room: string | null | undefined, teacherName: string | null | undefined): string | undefined {
  const parts = [room ? `ауд. ${room}` : undefined, shortTeacherName(teacherName)].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

/** How a registered teacher is named in the pair form: the full name, or surname and first name. */
export function teacherDisplayName(teacher: TeacherDto): string {
  return teacher.fullname?.trim() || `${teacher.lastname} ${teacher.firstname}`.trim();
}

/** The faculty's teachers whose name contains what is typed, any case — the suggestions of the form. */
export function matchTeachers(teachers: readonly TeacherDto[], query: string, limit = 5): TeacherDto[] {
  const needle = query.trim().toLocaleLowerCase('ru');
  return teachers
    .filter((teacher) => teacherDisplayName(teacher).toLocaleLowerCase('ru').includes(needle))
    .slice(0, limit);
}
