import { endKeycloakSession, login as browserLogin, refreshTokens } from './authService';
import { useAuthStore } from './authStore';
import { clearTokens, loadTokens, saveTokens, StoredTokens } from './keychain';

/**
 * Non-React session orchestration, used by both UI code (`useAuth`) and the axios interceptor
 * (`../api/client`) — the latter can't be a React hook, so the logic lives here instead of inside
 * `useAuth` itself.
 */

/** Called once from the splash screen. Populates `authStore` from whatever is in the keychain. */
export async function restoreSession(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens) {
    useAuthStore.getState().setSession(tokens);
  } else {
    useAuthStore.getState().clearSession();
  }
}

export async function performLogin(): Promise<void> {
  const tokens = await browserLogin();
  await saveTokens(tokens);
  useAuthStore.getState().setSession(tokens);
}

/** Ends the Keycloak SSO session (best-effort) and always clears local state, even on failure. */
export async function performLogout(): Promise<void> {
  const { idToken } = useAuthStore.getState();
  try {
    if (idToken) await endKeycloakSession(idToken);
  } finally {
    await clearTokens();
    useAuthStore.getState().clearSession();
  }
}

let inFlightRefresh: Promise<StoredTokens> | null = null;

/**
 * Refreshes the access token, coalescing concurrent callers into a single Keycloak request (e.g.
 * several screens' queries all hitting a 401 at once after the token expires). Throws if the
 * refresh token itself is invalid/revoked — callers should treat that as "force logout".
 */
export async function ensureFreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error('Нет активной сессии.');

  if (!inFlightRefresh) {
    inFlightRefresh = refreshTokens(refreshToken).finally(() => {
      inFlightRefresh = null;
    });
  }

  const tokens = await inFlightRefresh;
  await saveTokens(tokens);
  useAuthStore.getState().setSession(tokens);
  return tokens.accessToken;
}

/** Refresh failed unrecoverably (revoked/expired refresh token) — drop the session everywhere. */
export async function forceLogout(): Promise<void> {
  await clearTokens();
  useAuthStore.getState().clearSession();
}
