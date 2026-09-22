import { authorize, logout as endSession, refresh as refreshTokenRequest } from 'react-native-app-auth';
import { authConfig, endSessionConfig } from './authConfig';
import { env, keycloakEndpoints } from '../config/env';
import { StoredTokens } from './keychain';

/**
 * Thin wrapper around `react-native-app-auth` — keeps the rest of the app talking in terms of
 * `StoredTokens` instead of the library's `AuthorizeResult`/`RefreshResult` shapes, and is the one
 * place that would need to change if the PKCE library were ever swapped out.
 */

export class AuthCancelledError extends Error {
  constructor() {
    super('Вход отменён.');
    this.name = 'AuthCancelledError';
  }
}

function isUserCancelled(error: unknown): boolean {
  // react-native-app-auth surfaces "user cancelled" as a plain Error with this substring on both
  // platforms (there's no single stable `code` for it across iOS/Android AppAuth versions).
  return error instanceof Error && /cancel/i.test(error.message);
}

/** Opens the system browser for login. Throws `AuthCancelledError` if the user backs out. */
export async function login(): Promise<StoredTokens> {
  try {
    const result = await authorize(authConfig);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpirationDate: result.accessTokenExpirationDate,
      idToken: result.idToken,
    };
  } catch (error) {
    if (isUserCancelled(error)) throw new AuthCancelledError();
    throw error;
  }
}

/**
 * `grant_type=password` — direct token exchange with the credentials the user just typed into
 * the registration form, so a brand-new account logs straight into the app instead of bouncing
 * through the system browser a second time. Only `univer-mobile` (a public client) has this grant
 * enabled, and only for this one call site — every other login still goes through `login()`
 * above (Authorization Code + PKCE via the system browser), which is the only flow Keycloak's own
 * SSO session and cookie-based logout rely on.
 */
export async function loginWithPassword(username: string, password: string): Promise<StoredTokens> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: env.clientId,
    username,
    password,
    scope: 'openid profile email',
  });

  const response = await fetch(keycloakEndpoints.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error('Не удалось войти. Попробуйте войти вручную.');
  }

  const result = await response.json();
  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    accessTokenExpirationDate: new Date(Date.now() + result.expires_in * 1000).toISOString(),
    idToken: result.id_token,
  };
}

/** `grant_type=refresh_token` — used both for the silent-refresh interceptor and app startup. */
export async function refreshTokens(currentRefreshToken: string): Promise<StoredTokens> {
  const result = await refreshTokenRequest(authConfig, { refreshToken: currentRefreshToken });
  return {
    accessToken: result.accessToken,
    // Keycloak may or may not rotate the refresh token on refresh; keep the old one if absent.
    refreshToken: result.refreshToken ?? currentRefreshToken,
    accessTokenExpirationDate: result.accessTokenExpirationDate,
    idToken: result.idToken,
  };
}

/**
 * Full logout: ends the Keycloak SSO session via the system browser (so a subsequent login
 * doesn't silently reuse the old session) and redirects to `logoutRedirectUrl`. Local token/
 * keychain cleanup is the caller's responsibility (see `useAuth.logout`) — this function only
 * talks to Keycloak.
 */
export async function endKeycloakSession(idToken: string): Promise<void> {
  try {
    await endSession(endSessionConfig, {
      idToken,
      postLogoutRedirectUrl: env.logoutRedirectUrl,
    });
  } catch (error) {
    if (isUserCancelled(error)) return; // user closed the browser — local state is cleared regardless
    throw error;
  }
}
