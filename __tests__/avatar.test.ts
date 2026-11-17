import { ApiError, NetworkError, toApiError } from '../src/api/errors';
import { withLocalHost } from '../src/api/mediaUrl';
import {
  AVATAR_MAX_BYTES,
  avatarFileOf,
  avatarUriOf,
  deleteErrorText,
  initialsOf,
  PHOTO_TOO_BIG,
  pickerFailureOf,
  UNREADABLE_PHOTO,
  uploadErrorText,
} from '../src/features/profile/avatar';

describe('uploadErrorText', () => {
  it('reads 400 and 415 as an unreadable photo', () => {
    expect(uploadErrorText(toApiError(400, {}))).toBe(UNREADABLE_PHOTO);
    expect(uploadErrorText(toApiError(415, { message: 'Unsupported' }))).toBe(UNREADABLE_PHOTO);
  });

  it('reads 413 as a photo over 5 MB', () => {
    expect(uploadErrorText(toApiError(413, {}))).toBe('Фото больше 5 МБ');
  });

  it('names the seconds of a 429', () => {
    expect(uploadErrorText(toApiError(429, { retryAfterSeconds: 1 }))).toBe(
      'Сервер занят обработкой других фото, попробуйте через 1 секунду',
    );
    expect(uploadErrorText(toApiError(429, { retryAfterSeconds: 3 }))).toBe(
      'Сервер занят обработкой других фото, попробуйте через 3 секунды',
    );
    expect(uploadErrorText(toApiError(429, { retryAfterSeconds: 12 }))).toBe(
      'Сервер занят обработкой других фото, попробуйте через 12 секунд',
    );
    expect(uploadErrorText(toApiError(429, {}))).toBe('Сервер занят обработкой других фото, попробуйте чуть позже');
  });

  it('says there is no network', () => {
    expect(uploadErrorText(new NetworkError())).toBe('Нет сети, фото не загружено');
    expect(deleteErrorText(new NetworkError())).toBe('Нет сети, фото не удалено');
  });

  it('keeps 401 as everywhere else', () => {
    expect(uploadErrorText(toApiError(401, {}))).toBe('Сессия истекла. Пожалуйста, войдите снова.');
  });

  it('gives 413 and 415 their own texts outside the photo too', () => {
    expect(toApiError(413, {})).toEqual(
      expect.objectContaining({
        status: 413,
        message: 'Файл слишком большой.',
      }),
    );
    expect(toApiError(415, {})).toEqual(
      expect.objectContaining({
        status: 415,
        message: 'Такой формат файла не поддерживается.',
      }),
    );
    expect(toApiError(415, {})).toBeInstanceOf(ApiError);
  });
});

describe('avatarFileOf', () => {
  it('turns an iOS path into a file URI', () => {
    expect(avatarFileOf({ path: '/tmp/a.jpg', mime: 'image/jpeg', size: 200_000 })).toEqual({
      file: {
        uri: 'file:///tmp/a.jpg',
        name: 'avatar.jpg',
        type: 'image/jpeg',
      },
    });
  });

  it('keeps an Android URI', () => {
    expect(avatarFileOf({ path: 'file:///data/x.png', mime: 'image/png', size: 10 })).toEqual({
      file: {
        uri: 'file:///data/x.png',
        name: 'avatar.png',
        type: 'image/png',
      },
    });
  });

  it('does not send a file over 5 MB', () => {
    expect(
      avatarFileOf({
        path: '/a.jpg',
        mime: 'image/jpeg',
        size: AVATAR_MAX_BYTES + 1,
      }),
    ).toEqual({
      error: PHOTO_TOO_BIG,
    });
    expect(
      'file' in
        avatarFileOf({
          path: '/a.jpg',
          mime: 'image/jpeg',
          size: AVATAR_MAX_BYTES,
        }),
    ).toBe(true);
  });

  it('does not send what the server would refuse, HEIC included', () => {
    expect(avatarFileOf({ path: '/a.heic', mime: 'image/heic', size: 10 })).toEqual({ error: UNREADABLE_PHOTO });
  });
});

describe('pickerFailureOf', () => {
  it('is silent on cancel', () => {
    expect(pickerFailureOf({ code: 'E_PICKER_CANCELLED' }, 'library')).toEqual({
      kind: 'cancelled',
    });
  });

  it('explains a refused permission', () => {
    expect(pickerFailureOf({ code: 'E_NO_CAMERA_PERMISSION' }, 'camera')).toEqual(
      expect.objectContaining({
        kind: 'denied',
        title: 'Нет доступа к камере',
      }),
    );
    expect(pickerFailureOf({ code: 'E_NO_LIBRARY_PERMISSION' }, 'library')).toEqual(
      expect.objectContaining({ kind: 'denied', title: 'Нет доступа к фото' }),
    );
  });

  it('names the source of an unknown failure', () => {
    expect(pickerFailureOf(new Error('boom'), 'camera')).toEqual({
      kind: 'failed',
      message: 'Не удалось открыть камеру',
    });
  });
});

describe('initials fallback', () => {
  it('draws the initials without a photo', () => {
    expect(avatarUriOf(undefined)).toBeUndefined();
    expect(avatarUriOf(null)).toBeUndefined();
    expect(avatarUriOf('  ')).toBeUndefined();
    expect(avatarUriOf('https://api.univerapp.ru/media/avatars/1/128.jpg')).toBe(
      'https://api.univerapp.ru/media/avatars/1/128.jpg',
    );
  });

  it('takes the first letters of the first and last name', () => {
    expect(initialsOf({ firstname: 'иван', lastname: 'Петров' })).toBe('ИП');
    expect(initialsOf({ firstname: ' ', lastname: '', username: 'student1' })).toBe('S');
    expect(initialsOf({})).toBe('?');
  });
});

describe('withLocalHost', () => {
  it('points the local backend links at the emulator host', () => {
    expect(withLocalHost('http://localhost:8023/media/avatars/1/128.jpg', '10.0.2.2')).toBe(
      'http://10.0.2.2:8023/media/avatars/1/128.jpg',
    );
    expect(withLocalHost('http://127.0.0.1:8023/media/a.jpg', '10.0.2.2')).toBe('http://10.0.2.2:8023/media/a.jpg');
  });

  it('leaves the stand alone', () => {
    const url = 'https://api.univerapp.ru/media/avatars/1/512.jpg';
    expect(withLocalHost(url, '10.0.2.2')).toBe(url);
    expect(withLocalHost('http://localhost.example.com/a.jpg', '10.0.2.2')).toBe('http://localhost.example.com/a.jpg');
  });
});
