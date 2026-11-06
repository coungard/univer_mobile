/**
 * Runtime configuration for the backend/Keycloak integration.
 *
 * Two backends, picked by the build:
 * - **Release** — the stand on the VDS (`coungard/univer` DEPLOY.md): `https://api.univerapp.ru` and
 *   `https://auth.univerapp.ru`, real Let's Encrypt certificates. This is what goes on a phone: the JS is
 *   bundled into the app, so it needs neither Metro nor the developer's machine.
 * - **Debug** — the local docker-compose setup of `coungard/univer` (its `docker-compose.yml`), for the
 *   emulators.
 *
 * `clientId` (`univer-mobile`) and the redirect URIs below are the backend's public PKCE client
 * from its `MOBILE.md`, imported from `init-keycloak/realm-config.json` (coungard/univer#49).
 */
import { Platform } from 'react-native';

/**
 * The Android emulator runs in its own virtual network — `localhost`/`127.0.0.1` there means the
 * emulator itself, not the host machine, so it can't reach a backend running on the host's
 * `localhost`. `10.0.2.2` is the emulator's fixed alias for the host loopback interface. The iOS
 * Simulator, by contrast, shares the host's network namespace, so plain `localhost` works there.
 * Neither of these applies to a physical device — see README "Локальный бэкенд и эмулятор" for
 * that case (needs the host's LAN IP and a reachable network).
 */
const backendHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

/** Release builds talk to the stand; Debug ones to the local backend (see the top of this file). */
const useStand = !__DEV__;

export const env = {
  /** Which backend this build talks to — shown nowhere yet, handy in logs. */
  backend: useStand ? 'stand' : 'local',

  /** Spring Boot REST API (`API.md`). */
  apiBaseUrl: useStand ? 'https://api.univerapp.ru/api/v1' : `http://${backendHost}:8023/api/v1`,

  /**
   * Keycloak. Served over HTTPS (self-signed cert locally) — plain HTTP set a `Secure` session
   * cookie that browsers silently refuse to store, breaking login with "Cookie not found". See
   * ANDROID_TROUBLESHOOTING.md.
   *
   * Deliberately `localhost`, not `backendHost`: this backend's Keycloak has `KC_HOSTNAME=localhost`,
   * so it always writes its login form's `action` (and every other self-referential URL) as
   * `localhost:8443`, regardless of which host the browser's GET came in on. Opening the login page
   * via `10.0.2.2` on Android would set the session cookie on the `10.0.2.2` origin, then the form
   * POST to `localhost` wouldn't carry it — Keycloak replies "Cookie not found". Using `localhost`
   * for both keeps the whole flow on one origin, matching Keycloak's own idea of its hostname.
   * Requires `adb reverse tcp:8443 tcp:8443` on the Android emulator (see ANDROID_TROUBLESHOOTING.md)
   * since `localhost` there normally means the emulator itself, not the host.
   *
   * The stand's Keycloak sits behind Caddy and builds its URLs from the request, so there the public
   * address works from anywhere.
   */
  authServerUrl: useStand ? 'https://auth.univerapp.ru' : 'https://localhost:8443',
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
