import { z } from 'zod';
import { ApiError, NetworkError } from '../../api/errors';
import { FeedbackType, SubmitFeedbackRequest } from '../../api/types';

/**
 * «Оставить отзыв» (issue #82, canvas https://claude.ai/artifact/3gHQb2x1tZeST3hi8AqFQm, artboard 09):
 * a quiet link on the profile → «Что вы хотите рассказать?» → the text → «Спасибо!». The pure part —
 * what each kind says, the form's rules and the wording of failures — lives here so it can be tested.
 */

export const FEEDBACK_MESSAGE_MAX_LENGTH = 2000;

export interface FeedbackKind {
  type: FeedbackType;
  /** The item on the question screen. */
  title: string;
  subtitle: string;
  /** The chip in the header of the text screen. */
  chip: string;
  /** Heading and hint of the text screen. */
  question: string;
  hint: string;
  icon: string;
}

export const FEEDBACK_KINDS: readonly FeedbackKind[] = [
  {
    type: 'BUG',
    title: 'Что-то сломалось',
    subtitle: 'Ошибка, сбой, неверные данные',
    chip: 'Ошибка',
    question: 'Что произошло и где?',
    hint: 'Что вы делали, что ожидали увидеть и что получилось на самом деле.',
    icon: 'alert-circle-outline',
  },
  {
    type: 'IMPROVEMENT',
    title: 'Можно сделать удобнее',
    subtitle: 'Доработка того, что уже есть',
    chip: 'Доработка',
    question: 'Что сделать удобнее?',
    hint: 'Какой экран или действие и как, по-вашему, должно быть.',
    icon: 'wrench-outline',
  },
  {
    type: 'IDEA',
    title: 'Хочу новую функцию',
    subtitle: 'Идея для Univer',
    chip: 'Идея',
    question: 'Какой функции не хватает?',
    hint: 'Опишите идею и чем она вам поможет.',
    icon: 'lightbulb-outline',
  },
];

export function feedbackKind(type: FeedbackType): FeedbackKind {
  return FEEDBACK_KINDS.find((kind) => kind.type === type) ?? FEEDBACK_KINDS[0];
}

/** The server trims before checking the length, so the form does the same. */
export const feedbackMessageSchema = z
  .string()
  .trim()
  .min(1, 'Напишите хотя бы пару слов.')
  .max(FEEDBACK_MESSAGE_MAX_LENGTH, `Не длиннее ${FEEDBACK_MESSAGE_MAX_LENGTH} символов.`);

export interface DeviceInfo {
  appVersion: string;
  platform: SubmitFeedbackRequest['platform'];
  osVersion: string;
}

/**
 * What goes with every feedback besides the text, from `package.json` and `Platform` — no extra
 * library. `osVersion` is the user-facing release: «15» on Android (`Platform.constants.Release`,
 * not the API level), «18.2» on iOS. The server takes at most 32 characters.
 */
export function deviceInfo(appVersion: string, os: string, osVersion: string | number): DeviceInfo {
  return {
    appVersion: appVersion.slice(0, 32),
    platform: os === 'ios' ? 'ios' : 'android',
    osVersion: String(osVersion).slice(0, 32),
  };
}

/** «Univer 0.0.1 · Android 15» — the line under the form that says what is sent. */
export function deviceLine(info: DeviceInfo): string {
  return `Univer ${info.appVersion} · ${info.platform === 'ios' ? 'iOS' : 'Android'} ${info.osVersion}`;
}

function minutesWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'минуту';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'минуты';
  return 'минут';
}

/** «через 42 минуты» / «через час» — when the hourly limit lets the next feedback through. */
export function retryAfterText(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes >= 60 ? 'через час' : `через ${minutes} ${minutesWord(minutes)}`;
}

/** What the text screen says when sending failed. The typed text always stays in the field. */
export function submitErrorText(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'Нет сети. Текст сохранён — отправьте, когда появится связь.';
  }
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return error.retryAfterSeconds != null
        ? `Отзыв можно оставлять раз в час. Следующий — ${retryAfterText(error.retryAfterSeconds)}.`
        : 'Отзыв можно оставлять раз в час. Попробуйте позже.';
    }
    if (error.status === 400) {
      const fieldMessage = error.fieldErrors?.message;
      return fieldMessage ?? 'Проверьте текст отзыва.';
    }
    return error.message;
  }
  return 'Не удалось отправить отзыв. Попробуйте ещё раз.';
}
