import { useCallback, useState } from 'react';
import { AuthCancelledError } from './authService';
import { useAuthStore } from './authStore';
import { mapAuthError } from './mapAuthError';
import { performLogin, performLogout } from './sessionManager';

/** React-facing entry point for login/logout, with loading/error state for the UI to render. */
export function useAuth() {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.role);
  const claims = useAuthStore((state) => state.claims);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const login = useCallback(async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await performLogin();
    } catch (error) {
      if (error instanceof AuthCancelledError) {
        // User closed the browser — not an error worth surfacing.
        return;
      }
      setLoginError(mapAuthError(error));
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(() => performLogout(), []);

  return { status, role, claims, isLoggingIn, loginError, login, logout };
}
