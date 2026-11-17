/**
 * Client-side half of the avatar feature (issue #94) that is worth testing without a device:
 * limits and file naming for the upload, initials for the photo fallback and the Russian wording of
 * every way picking or uploading can fail. The native picker itself lives in `avatarPicker.ts`.
 */
import { ApiError, NetworkError } from '../../api/errors';
import type { AvatarUploadFile } from '../../api/endpoints/avatar';

/** `PUT /users/me/avatar` accepts at most 5 MB (coungard/univer#137); checked before sending. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** The square the picker crops to. The server scales it down to 512×512 and 128×128 anyway. */
export const AVATAR_CROP_SIZE = 1024;

/** JPEG quality of the cropped file — small enough for a mobile upload, visually lossless here. */
export const AVATAR_JPEG_QUALITY = 0.85;

/** Formats the server stores. Anything else (HEIC above all) is `415`. */
export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

/** What the picker returns for the chosen photo — a subset of its `Image`. */
export interface AvatarPick {
  path: string;
  size: number;
  mime?: string | null;
}

/**
 * «Иван» + «Петров» → «ИП» — the fallback shown until the photo loads or instead of it. One empty
 * part is skipped, both empty give «?» so the circle never renders blank.
 */
export function initialsOf(firstname?: string | null, lastname?: string | null): string {
  const letters = [firstname, lastname]
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0))
    .join('');
  return letters ? letters.toUpperCase() : '?';
}

/**
 * `image/png` stays `image/png`, but anything the whitelist doesn't know becomes `image/jpeg`:
 * both croppers output a JPEG, and the picker may still report the library original (HEIC).
 */
export function avatarMimeTypeOf(mime?: string | null): AvatarMimeType {
  const normalized = (mime ?? '').trim().toLowerCase();
  if (normalized === 'image/jpg') return 'image/jpeg';
  return (AVATAR_MIME_TYPES as readonly string[]).includes(normalized) ? (normalized as AvatarMimeType) : 'image/jpeg';
}

/** The multipart part for `uploadMyAvatar`: URI from the picker plus the extension matching its type. */
export function avatarUploadFileOf(pick: AvatarPick): AvatarUploadFile {
  const type = avatarMimeTypeOf(pick.mime);
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return { uri: pick.path, name: `avatar.${extension}`, type };
}

/** `null` while the photo fits the server limit, otherwise a sentence for the user. */
export function avatarSizeProblem(size: number): string | null {
  return size > AVATAR_MAX_BYTES ? 'Фото больше 5 МБ. Выберите фото поменьше.' : null;
}

/** «через 1 секунду», «через 3 секунды», «через 12 секунд» — the 429 wording of the upload. */
export function inSeconds(seconds: number): string {
  const n = Math.max(1, Math.round(seconds));
  const lastTwo = n % 100;
  const last = n % 10;
  const word =
    last === 1 && lastTwo !== 11 ? 'секунду' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'секунды' : 'секунд';
  return `через ${n} ${word}`;
}

/**
 * Error codes the picker rejects with (see `react-native-image-crop-picker`'s README): the library
 * rejects with a plain `Error` carrying `code`, so only that field is trusted.
 * `E_PICKER_CANCELLED` is a normal outcome, the two permission codes mean the system dialog was
 * denied or «Ask every time» is off — only Settings can fix that now.
 */
export function avatarPickerErrorCode(error: unknown): string | null {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return typeof code === 'string' ? code : null;
}

export function isAvatarPickerCancel(error: unknown): boolean {
  return avatarPickerErrorCode(error) === 'E_PICKER_CANCELLED';
}

export function isAvatarPermissionDenial(error: unknown): boolean {
  const code = avatarPickerErrorCode(error);
  return code === 'E_NO_CAMERA_PERMISSION' || code === 'E_NO_LIBRARY_PERMISSION' || code === 'E_PERMISSION';
}

export type AvatarSource = 'camera' | 'gallery';

/** The message of the permission `Alert`; its only action opens the app's settings. */
export function permissionDeniedText(source: AvatarSource): string {
  return source === 'camera'
    ? 'Нет доступа к камере. Разрешите его в настройках приложения, чтобы сделать фото.'
    : 'Нет доступа к галерее. Разрешите его в настройках приложения, чтобы выбрать фото.';
}

/** Camera missing or its app crashed — picking a photo from the gallery still works. */
export function pickerFailedText(source: AvatarSource): string {
  return source === 'camera'
    ? 'Не удалось открыть камеру. Попробуйте ещё раз или выберите фото из галереи.'
    : 'Не удалось открыть галерею. Попробуйте ещё раз.';
}

/**
 * One sentence for every upload/delete failure: the API-level ones repeat `toApiError`'s wording
 * where the avatar screen needs it spelled out (5 MB, unreadable format, rate limit), the rest fall
 * back to the normalized message.
 */
export function describeAvatarError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
      case 415:
        return 'Не удалось прочитать фото. Выберите JPEG, PNG или WebP.';
      case 401:
        return 'Сессия истекла. Войдите снова и повторите загрузку.';
      case 403:
        return 'Недостаточно прав для загрузки фото.';
      case 413:
        return 'Фото больше 5 МБ. Выберите фото поменьше.';
      case 429:
        return error.retryAfterSeconds
          ? `Сервер занят обработкой других фото, попробуйте ${inSeconds(error.retryAfterSeconds)}.`
          : 'Сервер занят обработкой других фото, попробуйте позже.';
      default:
        return error.message;
    }
  }
  if (error instanceof NetworkError) return 'Нет сети, фото не загружено.';
  return 'Не удалось загрузить фото. Попробуйте ещё раз.';
}
