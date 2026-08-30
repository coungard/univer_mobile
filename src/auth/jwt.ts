/**
 * Minimal JWT payload decoder — no signature verification (the token was already validated by
 * Keycloak/the backend; the client only reads claims for UI purposes: whose name to show, which
 * role-based stack to render). Written by hand instead of pulling in `jwt-decode` because RN has
 * no built-in `atob`/`Buffer` and a base64url decode is ~15 lines.
 */

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/* eslint-disable no-bitwise -- inherent to base64 decoding (packing 6-bit groups into bytes) */
function base64Decode(input: string): string {
  const chars = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = chars + '=='.slice(0, (4 - (chars.length % 4)) % 4);

  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const char of padded) {
    if (char === '=') break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}
/* eslint-enable no-bitwise */

/** Keycloak realm roles relevant to this app (see API.md — `APPLICANT`/`GUEST` are unused by the API). */
export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AccessTokenClaims {
  /** Keycloak user id — equals `Student.id`/`Teacher.id` on the backend (see API.md). */
  sub: string;
  exp: number;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles: string[] };
}

export function decodeAccessToken(accessToken: string): AccessTokenClaims | null {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;
    return JSON.parse(base64Decode(payload)) as AccessTokenClaims;
  } catch {
    return null;
  }
}

export function primaryRole(claims: AccessTokenClaims | null): Role | null {
  const roles = claims?.realm_access?.roles ?? [];
  return (['ADMIN', 'TEACHER', 'STUDENT'] as const).find(role => roles.includes(role)) ?? null;
}
