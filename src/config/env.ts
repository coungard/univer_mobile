/**
 * Runtime configuration for the backend/Keycloak integration.
 *
 * These values match the local docker-compose setup of `coungard/univer` (see its
 * `docker-compose.yml` / `application.yml`). Override them per-environment later (e.g. via
 * `react-native-config`) instead of hardcoding a different backend here.
 *
 * IMPORTANT: `clientId` below (`univer-mobile`) is the client described in the backend's
 * `MOBILE.md` as the *target* configuration for mobile PKCE login. As of writing, that client
 * does not exist yet in the backend's Keycloak realm import (`init-keycloak/realm-config.json`) —
 * see github.com/coungard/univer_mobile issue #1. Login screens are built against this spec so
 * they are ready the moment the backend team adds the client; until then, the Authorization Code
 * exchange will fail against a local backend with a real "client not found" error from Keycloak.
 */
export const env = {
  /** Spring Boot REST API (`API.md`). */
  apiBaseUrl: 'http://localhost:8023/api/v1',

  /** Keycloak. */
  authServerUrl: 'http://localhost:8082',
  realm: 'univer-realm',
  clientId: 'univer-mobile',

  /** Must match the `univer://` URL scheme registered in AndroidManifest/Info.plist. */
  redirectUrl: 'univer://auth/callback',
  logoutRedirectUrl: 'univer://auth/logout',
} as const;

/** Field names match `react-native-app-auth`'s `ServiceConfiguration`. */
export const keycloakEndpoints = {
  authorizationEndpoint: `${env.authServerUrl}/realms/${env.realm}/protocol/openid-connect/auth`,
  tokenEndpoint: `${env.authServerUrl}/realms/${env.realm}/protocol/openid-connect/token`,
  revocationEndpoint: `${env.authServerUrl}/realms/${env.realm}/protocol/openid-connect/revoke`,
  endSessionEndpoint: `${env.authServerUrl}/realms/${env.realm}/protocol/openid-connect/logout`,
} as const;
