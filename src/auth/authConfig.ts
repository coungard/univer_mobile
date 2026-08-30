import { AuthConfiguration, EndSessionConfiguration } from 'react-native-app-auth';
import { env, keycloakEndpoints } from '../config/env';

/**
 * `react-native-app-auth` configuration for the Authorization Code + PKCE flow against
 * `univer-realm`, per the backend's `MOBILE.md`:
 *   - `usePKCE: true` (S256 — the library's default and Keycloak's only supported method)
 *   - system browser (Custom Tabs / ASWebAuthenticationSession), never a WebView — this is
 *     handled by the native library itself, not by anything in this file
 *   - public client, no `clientSecret`
 */
export const authConfig: AuthConfiguration = {
  issuer: `${env.authServerUrl}/realms/${env.realm}`,
  serviceConfiguration: keycloakEndpoints,
  clientId: env.clientId,
  redirectUrl: env.redirectUrl,
  scopes: ['openid', 'profile', 'email'],
  usePKCE: true,
  // The local dev Keycloak (docker-compose) is plain HTTP. Remove this once `authServerUrl`
  // points at a real HTTPS deployment — leaving it on in production defeats the point of PKCE.
  dangerouslyAllowInsecureHttpRequests: env.authServerUrl.startsWith('http://'),
};

export const endSessionConfig: EndSessionConfiguration = {
  issuer: authConfig.issuer,
  serviceConfiguration: keycloakEndpoints,
  clientId: env.clientId,
  dangerouslyAllowInsecureHttpRequests: authConfig.dangerouslyAllowInsecureHttpRequests,
};
