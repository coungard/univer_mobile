import { TeacherDto } from '../src/api/types';
import {
  matchTeachers,
  roomAndTeacher,
  shortTeacherName,
  teacherDisplayName,
} from '../src/features/schedule/teacherName';

const teacher = (id: string, lastname: string, firstname: string, fullname?: string): TeacherDto => ({
  id,
  username: id,
  firstname,
  lastname,
  fullname,
  email: `${id}@example.com`,
  facultyId: 'f1',
  position: 'Доцент',
});

describe('shortTeacherName', () => {
  test('a full name of three words becomes surname and initials', () => {
    expect(shortTeacherName('Иванов Иван Иванович')).toBe('Иванов И. И.');
    expect(shortTeacherName('  петров  сергей  олегович ')).toBe('петров С. О.');
  });

  test('two words, initials typed already or one word stay as they are', () => {
    expect(shortTeacherName('Иван Иванов')).toBe('Иван Иванов');
    expect(shortTeacherName('Иванов И. И.')).toBe('Иванов И. И.');
    expect(shortTeacherName('Иванов')).toBe('Иванов');
  });

  test('nothing for an empty name', () => {
    expect(shortTeacherName(undefined)).toBeUndefined();
    expect(shortTeacherName('   ')).toBeUndefined();
  });
});

describe('roomAndTeacher', () => {
  test('either, both or neither', () => {
    expect(roomAndTeacher('125', 'Иванов Иван Иванович')).toBe('ауд. 125 · Иванов И. И.');
    expect(roomAndTeacher(undefined, 'Иванов И. И.')).toBe('Иванов И. И.');
    expect(roomAndTeacher('125', undefined)).toBe('ауд. 125');
    expect(roomAndTeacher(undefined, '')).toBeUndefined();
  });
});

describe('matchTeachers', () => {
  const teachers = [
    teacher('t1', 'Иванов', 'Иван', 'Иванов Иван Иванович'),
    teacher('t2', 'Петрова', 'Анна'),
    teacher('t3', 'Сидоров', 'Олег', 'Сидоров Олег Петрович'),
  ];

  test('the name without a full one is surname and first name', () => {
    expect(teacherDisplayName(teachers[1])).toBe('Петрова Анна');
  });

  test('any part of the name, any case', () => {
    expect(matchTeachers(teachers, 'петр').map((t) => t.id)).toEqual(['t2', 't3']);
    expect(matchTeachers(teachers, 'ИВАН').map((t) => t.id)).toEqual(['t1']);
  });

  test('nothing typed is the first few', () => {
    expect(matchTeachers(teachers, '', 2).map((t) => t.id)).toEqual(['t1', 't2']);
  });
});
