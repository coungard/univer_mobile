import { queryClient } from '../src/api/queryClient';
import { endKeycloakSession } from '../src/auth/authService';
import { useAuthStore } from '../src/auth/authStore';
import { clearTokens } from '../src/auth/keychain';
import { finishAccountDeletion, performLogout } from '../src/auth/sessionManager';
import { useSessionNoticeStore } from '../src/auth/sessionNotice';

jest.mock('../src/auth/keychain', () => ({
  clearTokens: jest.fn(() => Promise.resolve()),
  loadTokens: jest.fn(),
  saveTokens: jest.fn(),
}));

jest.mock('../src/auth/authService', () => ({
  endKeycloakSession: jest.fn(() => Promise.resolve()),
  login: jest.fn(),
  loginWithPassword: jest.fn(),
  refreshTokens: jest.fn(),
}));

/**
 * An unsigned JWT is enough, the store only decodes the claims:
 * `{ "alg": "none" }.{ "sub": "user-1", "realm_access": { "roles": ["STUDENT"] } }`.
 */
const ACCESS_TOKEN =
  'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyLTEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiU1RVREVOVCJdfX0.';

function signIn() {
  useAuthStore.getState().setSession({ accessToken: ACCESS_TOKEN, refreshToken: 'refresh', idToken: 'id' });
  queryClient.setQueryData(['students', 'me'], { id: 'user-1' });
}

beforeEach(() => {
  jest.clearAllMocks();
  useSessionNoticeStore.getState().dismiss();
  signIn();
});

describe('finishAccountDeletion', () => {
  it('forgets the session on the device and leaves a word for the login screen', async () => {
    await finishAccountDeletion();

    expect(clearTokens).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(queryClient.getQueryData(['students', 'me'])).toBeUndefined();
    expect(useSessionNoticeStore.getState().notice).toBe('Аккаунт удалён');
  });

  it("doesn't end the Keycloak session: the user is already gone there", async () => {
    await finishAccountDeletion();
    expect(endKeycloakSession).not.toHaveBeenCalled();
  });

  it('still signs out when the keychain fails', async () => {
    jest.mocked(clearTokens).mockRejectedValueOnce(new Error('keychain'));
    await expect(finishAccountDeletion()).rejects.toThrow('keychain');
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(queryClient.getQueryData(['students', 'me'])).toBeUndefined();
  });
});

describe('performLogout', () => {
  it('drops the cached data of the user who signed out too', async () => {
    await performLogout();

    expect(endKeycloakSession).toHaveBeenCalledWith('id');
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(queryClient.getQueryData(['students', 'me'])).toBeUndefined();
    expect(useSessionNoticeStore.getState().notice).toBeNull();
  });
});
