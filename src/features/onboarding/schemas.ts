import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const today = () => new Date().toISOString().slice(0, 10);

/** Mirrors `RegisterStudentRequest` in API.md — required fields (★) become required here. */
export const studentRegistrationSchema = z.object({
  username: z.string().min(3, 'Минимум 3 символа'),
  firstname: z.string().min(1, 'Обязательное поле'),
  lastname: z.string().min(1, 'Обязательное поле'),
  fullname: z.string().optional(),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  enrollmentDate: z
    .string()
    .regex(DATE_RE, 'Формат: ГГГГ-ММ-ДД')
    .refine((value) => value <= today(), 'Дата не может быть в будущем'),
  universityId: z.string().min(1, 'Выберите университет'),
});

export type StudentRegistrationForm = z.infer<typeof studentRegistrationSchema>;

/** Mirrors `RegisterTeacherRequest` in API.md. */
export const teacherRegistrationSchema = z.object({
  username: z.string().min(3, 'Минимум 3 символа'),
  firstname: z.string().min(1, 'Обязательное поле'),
  lastname: z.string().min(1, 'Обязательное поле'),
  fullname: z.string().optional(),
  password: z.string().min(8, 'Минимум 8 символов'),
  email: z.string().email('Некорректный email'),
  // Not part of RegisterTeacherRequest itself — an intermediate UI-only step to narrow the
  // department picker, mirroring how a real org chart is navigated (see API.md: departments are
  // listed per faculty/university, there's no flat "all departments" endpoint used here).
  universityId: z.string().min(1, 'Выберите университет'),
  departmentId: z.string().min(1, 'Выберите кафедру'),
  position: z.string().min(1, 'Обязательное поле'),
});

export type TeacherRegistrationForm = z.infer<typeof teacherRegistrationSchema>;
