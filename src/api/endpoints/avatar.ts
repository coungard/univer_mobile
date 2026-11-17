import { apiClient } from '../client';
import { AvatarDto } from '../types';

/** A picked photo ready to be sent: React Native's `FormData` reads the bytes from `uri` itself. */
export interface AvatarUploadFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * `PUT /users/me/avatar` (issue #94, backend coungard/univer#137) — multipart field `file`, JPEG/PNG/
 * WebP up to 5 MB and 8000×8000. The server bakes EXIF rotation in, center-crops to a square and
 * stores 512×512 + 128×128 variants, answering with fresh permanent URLs. HEIC is `415`.
 *
 * `Content-Type` is deliberately not set: React Native has to add the multipart boundary itself,
 * a hand-written `multipart/form-data` would arrive without one.
 */
export async function uploadMyAvatar(file: AvatarUploadFile): Promise<AvatarDto> {
  const body = new FormData();
  body.append('file', file as unknown as Blob);
  const { data } = await apiClient.put<AvatarDto>('/users/me/avatar', body);
  return data;
}

/** `DELETE /users/me/avatar` — `204` even when there was no photo, so it is always safe to call. */
export async function deleteMyAvatar(): Promise<void> {
  await apiClient.delete('/users/me/avatar');
}
