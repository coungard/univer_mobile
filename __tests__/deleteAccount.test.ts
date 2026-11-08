import { ApiError, NetworkError, toApiError } from '../src/api/errors';
import { deleteErrorText, deletionConsequences } from '../src/features/account/deleteAccount';

describe('deleteErrorText', () => {
  it('says the account is still there when there is no network', () => {
    expect(deleteErrorText(new NetworkError())).toBe('Нет сети, аккаунт не удалён. Попробуйте, когда появится связь.');
  });

  it("shows the server's message when Keycloak is down (500)", () => {
    const message = 'Не удалось удалить аккаунт: сервер авторизации недоступен. Данные не изменены, попробуйте позже';
    expect(deleteErrorText(toApiError(500, { status: 500, message, requestId: 'abc' }))).toBe(message);
  });

  it('falls back to the generic text for a 500 without a message', () => {
    expect(deleteErrorText(toApiError(500, undefined))).toBe('Не удалось выполнить запрос. Попробуйте ещё раз.');
    expect(deleteErrorText(toApiError(503, { message: '  ' }))).toBe('Не удалось выполнить запрос. Попробуйте ещё раз.');
  });

  it('passes other API errors through, e.g. an administrator (403)', () => {
    expect(deleteErrorText(toApiError(403, undefined))).toBe('Недостаточно прав для этого действия.');
  });

  it('has a text for anything unexpected', () => {
    expect(deleteErrorText(new Error('boom'))).toBe('Не удалось удалить аккаунт. Попробуйте ещё раз.');
  });
});

describe('toApiError', () => {
  it("keeps Spring's own text out of non-5xx statuses it doesn't know", () => {
    const error = toApiError(405, { message: "Request method 'GET' is not supported" });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Не удалось выполнить запрос. Попробуйте ещё раз.');
  });
});

describe('deletionConsequences', () => {
  it('tells a student their records go with the account', () => {
    const items = deletionConsequences('STUDENT').join('\n');
    expect(items).toMatch(/посещаемость/);
    expect(items).toMatch(/Заявки/);
    expect(items).toMatch(/отзывы останутся без имени/);
  });

  it("tells a teacher the groups' schedule stays", () => {
    expect(deletionConsequences('TEACHER').join('\n')).toMatch(/расписание групп останется/);
  });
});
