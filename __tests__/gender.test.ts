import { apiClient } from '../src/api/client';
import { updateOwnTeacher } from '../src/api/endpoints/teachers';
import { NetworkError, toApiError } from '../src/api/errors';
import { studentRegistrationSchema, teacherRegistrationSchema } from '../src/features/onboarding/schemas';
import { genderSaveErrorText } from '../src/features/profile/gender';

jest.mock('../src/api/client', () => ({ apiClient: { patch: jest.fn() } }));

const student = {
  username: 'ivanova',
  firstname: 'Анна',
  lastname: 'Иванова',
  email: 'anna@example.com',
  password: 'secret123',
  birthday: '2005-09-01',
};

const teacher = { ...student, username: 'petrov', position: 'Доцент' };

describe('registration schemas', () => {
  it.each([
    ['student', studentRegistrationSchema, student],
    ['teacher', teacherRegistrationSchema, teacher],
  ] as const)('ask the %s for the gender', (_, schema, values) => {
    const result = schema.safeParse(values);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([expect.objectContaining({ path: ['gender'], message: 'Укажите пол' })]);
  });

  it.each([
    ['student', studentRegistrationSchema, student],
    ['teacher', teacherRegistrationSchema, teacher],
  ] as const)("send the %s's gender with the registration", (_, schema, values) => {
    const result = schema.safeParse({ ...values, gender: 'FEMALE' });
    expect(result.success).toBe(true);
    expect(result.data?.gender).toBe('FEMALE');
  });

  it('rejects a value the backend does not know', () => {
    expect(studentRegistrationSchema.safeParse({ ...student, gender: 'OTHER' }).success).toBe(false);
  });
});

describe('updateOwnTeacher', () => {
  it('patches the own profile, not a teacher by id', async () => {
    jest.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 't-1', gender: 'MALE' } });
    await expect(updateOwnTeacher({ gender: 'MALE' })).resolves.toEqual({ id: 't-1', gender: 'MALE' });
    expect(apiClient.patch).toHaveBeenCalledWith('/teachers/me', { gender: 'MALE' });
  });
});

describe('genderSaveErrorText', () => {
  it('says nothing was saved without a network', () => {
    expect(genderSaveErrorText(new NetworkError())).toBe('Нет сети, пол не сохранён.');
  });

  it("prefers the server's message about the field", () => {
    expect(genderSaveErrorText(toApiError(400, { gender: 'Допустимые значения: MALE, FEMALE' }))).toBe(
      'Допустимые значения: MALE, FEMALE',
    );
  });

  it('falls back to the error message', () => {
    expect(genderSaveErrorText(toApiError(422, { message: 'Пол обязателен' }))).toBe('Пол обязателен');
  });
});
