import { ApiError, NetworkError, toApiError } from '../src/api/errors';
import {
  deviceInfo,
  deviceLine,
  FEEDBACK_KINDS,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  feedbackMessageSchema,
  retryAfterText,
  submitErrorText,
} from '../src/features/feedback/feedback';

describe('feedbackMessageSchema', () => {
  it('rejects empty and whitespace-only text', () => {
    expect(feedbackMessageSchema.safeParse('').success).toBe(false);
    expect(feedbackMessageSchema.safeParse('   \n ').success).toBe(false);
  });

  it('trims before checking the length, like the server', () => {
    const result = feedbackMessageSchema.safeParse(`  ${'a'.repeat(FEEDBACK_MESSAGE_MAX_LENGTH)}  `);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(FEEDBACK_MESSAGE_MAX_LENGTH);
  });

  it('rejects text over 2000 characters', () => {
    expect(feedbackMessageSchema.safeParse('a'.repeat(FEEDBACK_MESSAGE_MAX_LENGTH + 1)).success).toBe(false);
  });
});

describe('FEEDBACK_KINDS', () => {
  it('covers the three backend types in the order of the question screen', () => {
    expect(FEEDBACK_KINDS.map((kind) => kind.type)).toEqual(['BUG', 'IMPROVEMENT', 'IDEA']);
  });
});

describe('deviceInfo', () => {
  it('sends the Android release, not the API level', () => {
    const info = deviceInfo('0.0.1', 'android', '15');
    expect(info).toEqual({ appVersion: '0.0.1', platform: 'android', osVersion: '15' });
    expect(deviceLine(info)).toBe('Univer 0.0.1 · Android 15');
  });

  it('names iOS', () => {
    expect(deviceLine(deviceInfo('0.0.1', 'ios', '18.2'))).toBe('Univer 0.0.1 · iOS 18.2');
  });
});

describe('retryAfterText', () => {
  it.each([
    [30, 'через 1 минуту'],
    [120, 'через 2 минуты'],
    [5 * 60, 'через 5 минут'],
    [21 * 60, 'через 21 минуту'],
    [12 * 60, 'через 12 минут'],
    [3599, 'через час'],
  ])('%i s → %s', (seconds, text) => {
    expect(retryAfterText(seconds)).toBe(text);
  });
});

describe('submitErrorText', () => {
  it('words the hourly limit from retryAfterSeconds', () => {
    const error = toApiError(429, { status: 429, message: 'Too many', retryAfterSeconds: 2520 });
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).retryAfterSeconds).toBe(2520);
    expect(submitErrorText(error)).toBe('Отзыв можно оставлять раз в час. Следующий — через 42 минуты.');
  });

  it('keeps the text on a network failure', () => {
    expect(submitErrorText(new NetworkError())).toMatch(/Нет сети/);
  });

  it('shows the server message of the text field on 400', () => {
    expect(submitErrorText(toApiError(400, { message: 'Слишком длинно' }))).toBe('Слишком длинно');
  });
});
