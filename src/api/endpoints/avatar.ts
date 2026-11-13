import { apiClient } from '../client';
import { AvatarDto } from '../types';

/** A picked and cropped photo on the device, as React Native's `FormData` takes a file. */
export interface AvatarFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * `PUT /users/me/avatar` — `STUDENT`/`TEACHER` (univer#137). `multipart/form-data` with the photo in
 * `file`: JPEG, PNG or WebP up to 5 MB. Replaces the previous photo; every upload gives new links.
 * Errors: `413` over 5 MB, `415` not an image (HEIC too), `422` no file, `429` the server is busy
 * with other photos (`retryAfterSeconds`).
 */
export async function uploadMyAvatar(file: AvatarFile): Promise<AvatarDto> {
  const form = new FormData();
  // React Native reads `{ uri, name, type }` as a file to stream; the DOM typing only knows Blob.
  form.append('file', file as unknown as Blob);
  const { data } = await apiClient.put<AvatarDto>('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Hand the FormData to the native networking as it is: it writes the boundary itself.
    transformRequest: (body) => body,
    // A photo over a slow mobile network takes longer than the usual 15 s.
    timeout: 60000,
  });
  return data;
}

/** `DELETE /users/me/avatar` — `204`, also when there is no photo. */
export async function deleteMyAvatar(): Promise<void> {
  await apiClient.delete('/users/me/avatar');
}
