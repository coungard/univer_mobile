import { AvatarFile } from '../../api/endpoints/avatar';
import { ApiError, NetworkError } from '../../api/errors';

/**
 * The profile photo (issue #94, backend univer#137): what is checked on the device before the upload
 * and what the user reads when something goes wrong. No React here, so it is all covered by tests.
 */

/** The server takes up to 5 MB (`413` above); a bigger file isn't sent at all. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** The square the cropper hands back — MOBILE.md of univer: ~1024 px, JPEG of quality ~0.85. */
export const AVATAR_SIZE = 1024;
export const AVATAR_QUALITY = 0.85;

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const UNREADABLE_PHOTO = 'Не удалось прочитать фото. Выберите JPEG, PNG или WebP';
export const PHOTO_TOO_BIG = 'Фото больше 5 МБ';

/** What the picker hands back that matters here (`react-native-image-crop-picker`'s `Image`). */
export interface PickedImage {
  path: string;
  mime: string;
  size: number;
}

/**
 * The picked photo as a file for `uploadMyAvatar`, or why it isn't sent. The cropper re-encodes to
 * JPEG on both platforms (an iPhone's HEIC included), so a different type means something went wrong.
 */
export function avatarFileOf(image: PickedImage): { file: AvatarFile } | { error: string } {
  const type = image.mime?.toLowerCase();
  if (!type || !ACCEPTED_TYPES.includes(type)) return { error: UNREADABLE_PHOTO };
  if (image.size > AVATAR_MAX_BYTES) return { error: PHOTO_TOO_BIG };
  // iOS gives a bare path, Android a `file://` URI; React Native's FormData wants a URI.
  const uri = image.path.startsWith('/') ? `file://${image.path}` : image.path;
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return {
    file: {
      uri,
      name: `avatar.${extension}`,
      type: type === 'image/jpg' ? 'image/jpeg' : type,
    },
  };
}

function secondsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'секунду';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'секунды';
  return 'секунд';
}

/** The message under the photo after a failed upload. */
export function uploadErrorText(error: unknown): string {
  if (error instanceof NetworkError) return 'Нет сети, фото не загружено';
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
      case 415:
        return UNREADABLE_PHOTO;
      case 413:
        return PHOTO_TOO_BIG;
      case 429: {
        const seconds = error.retryAfterSeconds;
        return seconds != null && seconds > 0
          ? `Сервер занят обработкой других фото, попробуйте через ${seconds} ${secondsWord(seconds)}`
          : 'Сервер занят обработкой других фото, попробуйте чуть позже';
      }
      default:
        return error.message;
    }
  }
  return 'Не удалось загрузить фото. Попробуйте ещё раз';
}

/** The message after a failed removal. */
export function deleteErrorText(error: unknown): string {
  if (error instanceof NetworkError) return 'Нет сети, фото не удалено';
  if (error instanceof ApiError) return error.message;
  return 'Не удалось удалить фото. Попробуйте ещё раз';
}

/** What the picker said when it didn't hand back a photo. `null` — the user just closed it. */
export type PickerFailure =
  | { kind: 'cancelled' }
  | { kind: 'denied'; title: string; message: string }
  | { kind: 'failed'; message: string };

/** `react-native-image-crop-picker` rejects with a `code` (`E_PICKER_CANCELLED`, …). */
export function pickerFailureOf(error: unknown, source: 'camera' | 'library'): PickerFailure {
  const code = (error as { code?: unknown } | null)?.code;
  switch (code) {
    case 'E_PICKER_CANCELLED':
      return { kind: 'cancelled' };
    case 'E_NO_CAMERA_PERMISSION':
      return {
        kind: 'denied',
        title: 'Нет доступа к камере',
        message: 'Чтобы сделать фото, разрешите Univer доступ к камере в настройках телефона.',
      };
    case 'E_NO_LIBRARY_PERMISSION':
      return {
        kind: 'denied',
        title: 'Нет доступа к фото',
        message: 'Чтобы выбрать фото, разрешите Univer доступ к фото в настройках телефона.',
      };
    case 'E_PICKER_CANNOT_RUN_CAMERA_ON_SIMULATOR':
    case 'E_CAMERA_IS_NOT_AVAILABLE':
      return {
        kind: 'failed',
        message: 'Камера на этом устройстве недоступна',
      };
    default:
      return {
        kind: 'failed',
        message: source === 'camera' ? 'Не удалось открыть камеру' : 'Не удалось открыть галерею',
      };
  }
}

/** «Иван», «Петров» → «ИП»; with no name at all — the first letter of the login, or «?». */
export function initialsOf(person: {
  firstname?: string | null;
  lastname?: string | null;
  username?: string | null;
}): string {
  const letters = `${person.firstname?.trim().charAt(0) ?? ''}${person.lastname?.trim().charAt(0) ?? ''}`;
  return (letters || person.username?.trim().charAt(0) || '?').toUpperCase();
}

/** The photo to draw, or `undefined` for the initials. A blank link counts as no photo. */
export function avatarUriOf(url: string | null | undefined): string | undefined {
  const trimmed = url?.trim();
  return trimmed ? trimmed : undefined;
}
