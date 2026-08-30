/**
 * Normalizes backend error responses per the table in `API.md`.
 *
 * Quirk to respect (see API.md "Формат ошибок"): for 404 and 422 the response body's `path`
 * field is always `"/"` (or absent), and for 422 `error` is always `"Not Found"` regardless of
 * the actual problem. Callers must key off `status`/`message`, never `error`/`path`.
 */

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  readonly status: number;
  /** Present only for 400 responses — a flat map of field name -> validation message. */
  readonly fieldErrors?: FieldErrors;

  constructor(status: number, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface SpringErrorBody {
  status?: number;
  message?: string;
  // `error`/`path` deliberately not read for 404/422 — see class doc comment above.
}

/** Turns an axios error's response into an `ApiError`. Call from the axios response interceptor. */
export function toApiError(status: number, data: unknown): ApiError {
  switch (status) {
    case 400: {
      // Flat map of field -> message (see API.md).
      const fieldErrors = (data && typeof data === 'object' ? data : {}) as FieldErrors;
      return new ApiError(400, 'Проверьте правильность заполнения полей.', fieldErrors);
    }
    case 401:
      return new ApiError(401, 'Сессия истекла. Пожалуйста, войдите снова.');
    case 403:
      return new ApiError(403, 'Недостаточно прав для этого действия.');
    case 404:
    case 422: {
      const body = (data ?? {}) as SpringErrorBody;
      return new ApiError(status, body.message ?? 'Запрос не может быть выполнен.');
    }
    case 409:
      return new ApiError(409, 'Такой email уже зарегистрирован.');
    default:
      return new ApiError(status, 'Не удалось выполнить запрос. Попробуйте ещё раз.');
  }
}

/** For network failures (no response at all) — timeouts, offline, DNS, etc. */
export class NetworkError extends Error {
  constructor() {
    super('Нет соединения с сервером. Проверьте подключение к сети.');
    this.name = 'NetworkError';
  }
}
