import { z } from 'zod';

/**
 * Заполнение `Pair` (`UI_UX.md` раздел 4). Ответы на открытые вопросы документа (раздел 7),
 * зафиксированные для этой реализации:
 * - предмет выбирается из предметов факультета студента (`GET /courses?facultyId=`), недостающий
 *   студент добавляет сам;
 * - время начала/окончания всегда наследуется из `BellScheduleEntry` по `pairNumber` — форма его не
 *   запрашивает, только показывает рядом с номером пары (см. `PairFormScreen`).
 * `dayOfWeek`/`weekParity` — строки, а не `z.enum`, чтобы дефолтное пустое значение `''` (пока
 * ничего не выбрано) проходило через тот же `SelectField`, что и остальные select-поля в проекте
 * (см. `onboarding/schemas.ts`), вместо борьбы с типами `z.enum` для несуществующего варианта.
 */
export const pairFormSchema = z.object({
  dayOfWeek: z.string().min(1, 'Выберите день недели'),
  weekParity: z.string().min(1, 'Выберите чётность недели'),
  pairNumber: z
    .string()
    .regex(/^\d+$/, 'Выберите номер пары')
    .refine((value) => Number(value) >= 1, 'Минимум 1'),
  courseId: z.string().min(1, 'Выберите предмет'),
  room: z.string().optional(),
  // Преподаватель (issue #68): выбранный из преподавателей факультета — `teacherId`, иначе имя
  // текстом; оба необязательны.
  teacherName: z.string().max(100, 'Не длиннее 100 символов').optional(),
  teacherId: z.string().optional(),
});

export type PairForm = z.infer<typeof pairFormSchema>;
