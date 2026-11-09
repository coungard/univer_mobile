import { z } from 'zod';
import { ApiError, NetworkError } from '../../api/errors';
import { Gender } from '../../api/types';

/**
 * Gender of a student or a teacher (issue #92, backend coungard/univer#139): required at
 * registration; those who registered earlier have `null` and can set it later, but never clear it.
 */

export const GENDER_OPTIONS: readonly { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Мужской' },
  { value: 'FEMALE', label: 'Женский' },
];

/** The registration forms' field. Nothing picked yet reads as «Укажите пол», like the server's 400. */
export const genderSchema = z.enum(['MALE', 'FEMALE'], { error: 'Укажите пол' });

/** What a profile says when saving the gender failed. The choice on screen stays as it was. */
export function genderSaveErrorText(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'Нет сети, пол не сохранён.';
  }
  if (error instanceof ApiError) {
    return error.fieldErrors?.gender ?? error.message;
  }
  return 'Не удалось сохранить пол. Попробуйте ещё раз.';
}
