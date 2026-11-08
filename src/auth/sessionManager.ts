import { queryClient } from '../api/queryClient';
import { endKeycloakSession, login as browserLogin, loginWithPassword, refreshTokens } from './authService';
import { useAuthStore } from './authStore';
import { clearTokens, loadTokens, saveTokens, StoredTokens } from './keychain';
import { useSessionNoticeStore } from './sessionNotice';

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
  await startSession(await browserLogin());
}

/** Straight to a profile after registration — see `authService.loginWithPassword`. */
export async function performPasswordLogin(username: string, password: string): Promise<void> {
  await startSession(await loginWithPassword(username, password));
}

/** A fresh sign-in: the login screen's word about the previous session no longer applies. */
async function startSession(tokens: StoredTokens): Promise<void> {
  await saveTokens(tokens);
  useAuthStore.getState().setSession(tokens);
  useSessionNoticeStore.getState().dismiss();
}

/** Ends the Keycloak SSO session (best-effort) and always clears local state, even on failure. */
export async function performLogout(): Promise<void> {
  const { idToken } = useAuthStore.getState();
  try {
    if (idToken) await endKeycloakSession(idToken);
  } finally {
    await clearLocalSession();
  }
}

/**
 * After `DELETE /users/me` answered `204` (issue #86): the Keycloak user and its sessions are gone
 * already, so there's no end-session call — only the local part of signing out, and a word on the
 * login screen.
 */
export async function finishAccountDeletion(): Promise<void> {
  await clearLocalSession();
  useSessionNoticeStore.getState().show('Аккаунт удалён');
}

/**
 * Forgets the session on the device: tokens in the Keychain/Keystore, the in-memory session (which
 * swaps the app for the login screen) and every cached query of the old user.
 */
async function clearLocalSession(): Promise<void> {
  try {
    await clearTokens();
  } finally {
    useAuthStore.getState().clearSession();
    queryClient.clear();
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
  await clearLocalSession();
}
