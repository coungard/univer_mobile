import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Manual `POST /lectures` (ROADMAP.md "Фаза 6" — «создание вручную»), the rarer path next to
 * generating from a `Pair` template: `scheduledTime` is split into separate `date`/`time` text
 * fields (`YYYY-MM-DD`/`HH:mm`) rather than one combined input, matching this project's existing
 * plain-text-field convention for dates (see `onboarding/schemas.ts`) — there's no date/time picker
 * dependency in this project (ANDROID_TROUBLESHOOTING.md documents enough native-build pain already).
 * `groupIds` has no picker source of its own (`GroupDto` has no course link, and `Pair`/`Course` don't
 * expose one either — see API.md), so `LectureFormScreen` offers only the groups the teacher's own
 * `Pair` templates are already known to use.
 */
export const lectureFormSchema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  content: z.string().optional(),
  courseId: z.string().min(1, 'Выберите курс'),
  date: z.string().regex(DATE_RE, 'Формат: ГГГГ-ММ-ДД'),
  time: z.string().regex(TIME_RE, 'Формат: ЧЧ:ММ'),
  durationMinutes: z.string().regex(/^\d+$/, 'Введите число минут'),
  room: z.string().optional(),
  groupIds: z.array(z.string()).min(1, 'Выберите хотя бы одну группу'),
});

export type LectureForm = z.infer<typeof lectureFormSchema>;
