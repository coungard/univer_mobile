import { AppAuthError } from 'react-native-app-auth';

/**
 * Human-readable text for Keycloak/browser-level auth errors — distinct from the HTTP error
 * table in `API.md`, which is about `/api/v1/...`, not about the Keycloak authorization endpoint
 * itself (see ROADMAP.md "Фаза 1", issue "Экран ошибок авторизации").
 */
export function mapAuthError(error: unknown): string {
  const code = (error as Partial<AppAuthError>)?.code;

  switch (code) {
    case 'browser_not_found':
      return 'Не найден браузер для входа. Установите или включите системный браузер.';
    case 'service_configuration_fetch_error':
      return 'Сервер авторизации недоступен. Проверьте подключение и повторите попытку.';
    case 'token_exchange_failed':
    case 'token_refresh_failed':
      return 'Не удалось получить доступ. Попробуйте войти ещё раз.';
    case 'access_denied':
      return 'Доступ отклонён.';
    default:
      return error instanceof Error
        ? error.message
        : 'Не удалось войти. Попробуйте ещё раз.';
  }
}
