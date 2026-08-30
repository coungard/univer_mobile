import * as Keychain from 'react-native-keychain';

/**
 * OS-protected token storage (Keychain on iOS, Keystore-backed on Android), as required by the
 * backend's `MOBILE.md`. Only the refresh token strictly needs this level of protection, but it's
 * simplest to keep both tokens together as one JSON blob under one keychain entry.
 */

const SERVICE = 'univer-mobile.auth';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  /** ISO string; undefined means "unknown expiry, treat as expired and refresh on first use". */
  accessTokenExpirationDate?: string;
  /** Needed for RP-initiated logout (`id_token_hint`) — see `authService.endKeycloakSession`. */
  idToken?: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Keychain.setGenericPassword('univer-mobile', JSON.stringify(tokens), {
    service: SERVICE,
  });
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  if (!result) return null;
  try {
    return JSON.parse(result.password) as StoredTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
