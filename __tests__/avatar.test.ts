import { ApiError, NetworkError, toApiError } from '../src/api/errors';
import {
  AVATAR_CROP_SIZE,
  AVATAR_JPEG_QUALITY,
  AVATAR_MAX_BYTES,
  avatarMimeTypeOf,
  avatarPickerErrorCode,
  avatarSizeProblem,
  avatarUploadFileOf,
  describeAvatarError,
  inSeconds,
  initialsOf,
  isAvatarPermissionDenial,
  isAvatarPickerCancel,
  permissionDeniedText,
  pickerFailedText,
} from '../src/features/profile/avatar';

describe('initialsOf', () => {
  it('takes the first letter of both names', () => {
    expect(initialsOf('Иван', 'Петров')).toBe('ИП');
  });

  it('skips the part that is missing', () => {
    expect(initialsOf('Анна', undefined)).toBe('А');
    expect(initialsOf(null, 'Сидоров')).toBe('С');
  });

  it('ignores surrounding spaces and keeps already-typed initials', () => {
    expect(initialsOf('  анна ', ' Иванова')).toBe('АИ');
  });

  it('never renders blank when both parts are empty', () => {
    expect(initialsOf(undefined, undefined)).toBe('?');
    expect(initialsOf('', '   ')).toBe('?');
  });
});

describe('avatarMimeTypeOf', () => {
  it.each([
    ['image/png', 'image/png'],
    ['image/webp', 'image/webp'],
    ['image/jpeg', 'image/jpeg'],
    ['IMAGE/JPEG', 'image/jpeg'],
    ['image/jpg', 'image/jpeg'],
    ['image/heic', 'image/jpeg'],
    [undefined, 'image/jpeg'],
    ['', 'image/jpeg'],
  ] as const)('%s -> %s', (mime, expected) => {
    expect(avatarMimeTypeOf(mime)).toBe(expected);
  });
});

describe('avatarUploadFileOf', () => {
  it('names the part after the type it will be sent as', () => {
    expect(avatarUploadFileOf({ path: '/tmp/a.png', size: 10, mime: 'image/png' })).toEqual({
      uri: '/tmp/a.png',
      name: 'avatar.png',
      type: 'image/png',
    });
    expect(avatarUploadFileOf({ path: '/tmp/a.webp', size: 10, mime: 'image/webp' })).toEqual({
      uri: '/tmp/a.webp',
      name: 'avatar.webp',
      type: 'image/webp',
    });
  });

  it('falls back to JPEG, which is what the cropper always writes', () => {
    expect(avatarUploadFileOf({ path: '/tmp/a.heic', size: 10, mime: 'image/heic' })).toEqual({
      uri: '/tmp/a.heic',
      name: 'avatar.jpg',
      type: 'image/jpeg',
    });
  });

  it('crops to the square the server scales down from', () => {
    expect(AVATAR_CROP_SIZE).toBe(1024);
    expect(AVATAR_JPEG_QUALITY).toBeGreaterThan(0.5);
    expect(AVATAR_JPEG_QUALITY).toBeLessThan(1);
  });
});

describe('avatarSizeProblem', () => {
  it('lets the server limit itself through', () => {
    expect(avatarSizeProblem(AVATAR_MAX_BYTES)).toBeNull();
  });

  it('asks for a smaller photo before wasting the upload', () => {
    expect(avatarSizeProblem(AVATAR_MAX_BYTES + 1)).toBe('Фото больше 5 МБ. Выберите фото поменьше.');
  });
});

describe('inSeconds', () => {
  it.each([
    [0, 'через 1 секунду'],
    [1, 'через 1 секунду'],
    [2, 'через 2 секунды'],
    [4, 'через 4 секунды'],
    [5, 'через 5 секунд'],
    [11, 'через 11 секунд'],
    [12, 'через 12 секунд'],
    [21, 'через 21 секунду'],
    [22, 'через 22 секунды'],
    [111, 'через 111 секунд'],
  ])('%s -> %s', (seconds, expected) => {
    expect(inSeconds(seconds)).toBe(expected);
  });
});

describe('picker errors', () => {
  it('reads the code off the plain Error the picker rejects with', () => {
    const error = Object.assign(new Error('User cancelled image selection'), { code: 'E_PICKER_CANCELLED' });
    expect(avatarPickerErrorCode(error)).toBe('E_PICKER_CANCELLED');
    expect(isAvatarPickerCancel(error)).toBe(true);
  });

  it('treats a missing or non-string code as no code at all', () => {
    expect(avatarPickerErrorCode(null)).toBeNull();
    expect(avatarPickerErrorCode(undefined)).toBeNull();
    expect(avatarPickerErrorCode('E_PICKER_CANCELLED')).toBeNull();
    expect(avatarPickerErrorCode({ code: 42 })).toBeNull();
    expect(isAvatarPickerCancel(new Error('boom'))).toBe(false);
  });

  it.each(['E_NO_CAMERA_PERMISSION', 'E_NO_LIBRARY_PERMISSION', 'E_PERMISSION'])('sees %s as a denial', (code) => {
    expect(isAvatarPermissionDenial({ code })).toBe(true);
  });

  it('does not confuse a cancel or a crash with a denial', () => {
    expect(isAvatarPermissionDenial({ code: 'E_PICKER_CANCELLED' })).toBe(false);
    expect(isAvatarPermissionDenial({ code: 'E_CANNOT_LAUNCH_CAMERA' })).toBe(false);
    expect(isAvatarPermissionDenial(undefined)).toBe(false);
  });
});

describe('permissionDeniedText', () => {
  it('names the source that was denied and points to the settings', () => {
    expect(permissionDeniedText('camera')).toContain('камере');
    expect(permissionDeniedText('camera')).toContain('настройках');
    expect(permissionDeniedText('gallery')).toContain('галерее');
    expect(permissionDeniedText('gallery')).toContain('настройках');
  });
});

describe('pickerFailedText', () => {
  it('offers the gallery when the camera is the one that failed', () => {
    expect(pickerFailedText('camera')).toContain('галереи');
    expect(pickerFailedText('gallery')).not.toContain('камер');
  });
});

describe('describeAvatarError', () => {
  it.each([400, 415])('asks for a readable format on %s', (status) => {
    expect(describeAvatarError(new ApiError(status, 'Не удалось выполнить запрос.'))).toBe(
      'Не удалось прочитать фото. Выберите JPEG, PNG или WebP.',
    );
  });

  it('explains the limits the server enforces', () => {
    expect(describeAvatarError(toApiError(413, {}))).toBe('Фото больше 5 МБ. Выберите фото поменьше.');
    expect(describeAvatarError(new ApiError(401, 'Unauthorized'))).toBe(
      'Сессия истекла. Войдите снова и повторите загрузку.',
    );
    expect(describeAvatarError(new ApiError(403, 'Forbidden'))).toBe('Недостаточно прав для загрузки фото.');
  });

  it('counts down the upload rate limit', () => {
    expect(describeAvatarError(toApiError(429, { retryAfterSeconds: 7 }))).toBe(
      'Сервер занят обработкой других фото, попробуйте через 7 секунд.',
    );
    expect(describeAvatarError(new ApiError(429, 'Too Many Requests'))).toBe(
      'Сервер занят обработкой других фото, попробуйте позже.',
    );
  });

  it("keeps the server's own message for the rest", () => {
    expect(describeAvatarError(new ApiError(500, 'Не удалось сохранить фото.'))).toBe('Не удалось сохранить фото.');
  });

  it('says plainly that nothing was uploaded without a network', () => {
    expect(describeAvatarError(new NetworkError())).toBe('Нет сети, фото не загружено.');
  });

  it('falls back to a generic sentence for an unknown failure', () => {
    expect(describeAvatarError(new Error('boom'))).toBe('Не удалось загрузить фото. Попробуйте ещё раз.');
    expect(describeAvatarError(undefined)).toBe('Не удалось загрузить фото. Попробуйте ещё раз.');
  });
});
