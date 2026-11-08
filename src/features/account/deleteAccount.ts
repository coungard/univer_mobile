import { ApiError, NetworkError } from '../../api/errors';

/**
 * «Удалить аккаунт» (issue #86, App Store Guideline 5.1.1(v)): a quiet link on the profile → a
 * confirmation screen → `DELETE /users/me` → the login screen. The pure part — what the screen
 * promises will happen and how failures read — lives here so it can be tested.
 */

/**
 * What goes with the account, by role, as the backend actually does it (univer#133): a student's
 * own records are deleted, while a teacher's pairs and lectures belong to the groups and stay
 * without a teacher. Feedback is kept but no longer says who sent it.
 */
export function deletionConsequences(role: 'STUDENT' | 'TEACHER'): string[] {
  if (role === 'TEACHER') {
    return [
      'Профиль преподавателя и вход в Univer',
      'Ваше имя в парах и лекциях — расписание групп останется без преподавателя',
      'Подпись под отзывами — сами отзывы останутся без имени',
    ];
  }
  return [
    'Профиль и вход в Univer',
    'Записи на курсы и посещаемость',
    'Заявки на добавление университета',
    'Подпись под отзывами — сами отзывы останутся без имени',
  ];
}

/** What the confirmation screen says when the request failed. The user stays signed in. */
export function deleteErrorText(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'Нет сети, аккаунт не удалён. Попробуйте, когда появится связь.';
  }
  if (error instanceof ApiError) {
    // 401 never gets here as a failure to show: the client has already tried a refresh and signed
    // out, like any expired session. Everything else carries the server's own message.
    return error.message;
  }
  return 'Не удалось удалить аккаунт. Попробуйте ещё раз.';
}
