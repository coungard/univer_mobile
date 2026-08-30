import { create } from 'zustand';
import { AccessTokenClaims, decodeAccessToken, primaryRole, Role } from './jwt';
import { StoredTokens } from './keychain';

export type SessionStatus =
  | 'restoring' // app just started, checking keychain for a session
  | 'authenticated'
  | 'unauthenticated';

interface AuthState {
  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpirationDate: string | null;
  claims: AccessTokenClaims | null;
  role: Role | null;

  setSession: (tokens: StoredTokens) => void;
  clearSession: () => void;
}

/**
 * Session state, kept in memory for fast access (e.g. the axios interceptor reads
 * `accessToken`/`accessTokenExpirationDate` on every request). The source of truth for
 * *persistence* across app restarts is the keychain (`./keychain.ts`) — this store is
 * rehydrated from it once, in the splash screen.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'restoring',
  accessToken: null,
  refreshToken: null,
  idToken: null,
  accessTokenExpirationDate: null,
  claims: null,
  role: null,

  setSession: (tokens) => {
    const claims = decodeAccessToken(tokens.accessToken);
    set({
      status: 'authenticated',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken ?? null,
      accessTokenExpirationDate: tokens.accessTokenExpirationDate ?? null,
      claims,
      role: primaryRole(claims),
    });
  },

  clearSession: () =>
    set({
      status: 'unauthenticated',
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpirationDate: null,
      claims: null,
      role: null,
    }),
}));
