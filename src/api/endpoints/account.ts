import { apiClient } from '../client';

/**
 * `DELETE /users/me` — any role but ADMIN (issue #86, backend coungard/univer#133). Deletes the
 * account at once: the profile and the Keycloak user with its sessions and refresh tokens. A repeat
 * call is `204` too. `500` with a readable `message` means Keycloak didn't answer and nothing was
 * deleted, so it can just be tried again.
 */
export async function deleteAccount(): Promise<void> {
  await apiClient.delete('/users/me');
}
