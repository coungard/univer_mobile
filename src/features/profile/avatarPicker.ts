/**
 * Native half of the avatar feature (issue #94): camera or gallery, then the same square crop before
 * anything is uploaded. Errors are passed through untouched — `avatar.ts` words them for the user.
 */
import { Platform } from 'react-native';
import ImageCropPicker, { Image } from 'react-native-image-crop-picker';
import { AVATAR_CROP_SIZE, AVATAR_JPEG_QUALITY, AvatarPick } from './avatar';

/**
 * The crop is mandatory and square: the server would center-crop anyway, but letting the student pick
 * the frame is the point. `forceJpg` covers HEIC from an iPhone library (iOS-only), the compression
 * keeps a 1024 px avatar well under the 5 MB limit even on Android.
 */
const CROP_OPTIONS = {
  width: AVATAR_CROP_SIZE,
  height: AVATAR_CROP_SIZE,
  cropping: true,
  mediaType: 'photo',
  compressImageQuality: AVATAR_JPEG_QUALITY,
  forceJpg: true,
  includeBase64: false,
  includeExif: false,
  avoidEmptySpaceAroundImage: true,
  cropperCircleOverlay: true,
  cropperToolbarTitle: 'Фото профиля',
  cropperChooseText: 'Готово',
  cropperCancelText: 'Отмена',
  loadingLabelText: 'Обработка фото…',
  waitAnimationEnd: false,
} as const;

function toPick(image: Image): AvatarPick | null {
  // `path` is null only with `writeTempFile: false`, which the options above don't use.
  return image.path ? { path: image.path, size: image.size, mime: image.mime } : null;
}

/** Gallery via the system photo picker on Android, `PHPicker`-style flow on iOS, then the cropper. */
export async function pickAvatarFromGallery(): Promise<AvatarPick | null> {
  return toPick(await ImageCropPicker.openPicker({ ...CROP_OPTIONS }));
}

/** Camera, front lens by default — a profile photo is usually a selfie — then the same cropper. */
export async function pickAvatarFromCamera(): Promise<AvatarPick | null> {
  return toPick(await ImageCropPicker.openCamera({ ...CROP_OPTIONS, useFrontCamera: true }));
}

/**
 * Deletes the temporary cropped file once it is uploaded or rejected. Skipped on Android: its
 * `cleanSingle` asks for `WRITE_EXTERNAL_STORAGE` on API ≤ 29 right after the upload — a permission
 * dialog at the worst moment, for a file the OS clears from the cache itself.
 */
export function discardAvatarPick(pick: AvatarPick): void {
  if (Platform.OS !== 'ios') return;
  ImageCropPicker.cleanSingle(pick.path).catch(() => {
    // Nothing depends on the temp file being gone.
  });
}
