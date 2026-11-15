import { backendHost, env } from '../config/env';

/**
 * A media link from the backend (a profile photo, univer#137) the device can actually open.
 *
 * The local docker-compose backend builds its links as `http://localhost:8023/media/...`, and on the
 * Android emulator `localhost` is the emulator itself — so in the Debug build the host is swapped for
 * the one the REST API is reached by (`10.0.2.2`, see `src/config/env.ts`). The stand's links
 * (`https://api.univerapp.ru/media/...`) are left as they are.
 */
export function mediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return env.backend === 'local' ? withLocalHost(url, backendHost) : url;
}

/** `http://localhost:8023/x` → `http://10.0.2.2:8023/x`; any other host is kept. Exported for tests. */
export function withLocalHost(url: string, host: string): string {
  return url.replace(/^(https?:\/\/)(?:localhost|127\.0\.0\.1)(?=[:/]|$)/, `$1${host}`);
}
