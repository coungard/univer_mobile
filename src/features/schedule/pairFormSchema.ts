import { z } from 'zod';

/**
 * Заполнение `Pair` (`UI_UX.md` раздел 4). Ответы на открытые вопросы документа (раздел 7),
 * зафиксированные для этой реализации:
 * - курс выбирается из всех курсов кафедры/университета (`GET /courses`), не только зачисленных;
 * - время начала/окончания всегда наследуется из `BellScheduleEntry` по `pairNumber` — форма его не
 *   запрашивает, только показывает как предпросмотр (см. `PairFormScreen`).
 * `dayOfWeek`/`weekParity` — строки, а не `z.enum`, чтобы дефолтное пустое значение `''` (пока
 * ничего не выбрано) проходило через тот же `SelectField`, что и остальные select-поля в проекте
 * (см. `onboarding/schemas.ts`), вместо борьбы с типами `z.enum` для несуществующего варианта.
 */
export const pairFormSchema = z.object({
  dayOfWeek: z.string().min(1, 'Выберите день недели'),
  weekParity: z.string().min(1, 'Выберите чётность недели'),
  pairNumber: z
    .string()
    .regex(/^\d+$/, 'Введите номер пары')
    .refine((value) => Number(value) >= 1, 'Минимум 1'),
  courseId: z.string().min(1, 'Выберите курс'),
  room: z.string().optional(),
});

export type PairForm = z.infer<typeof pairFormSchema>;
