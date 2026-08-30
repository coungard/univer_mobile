import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ensureFreshAccessToken, forceLogout } from '../auth/sessionManager';
import { useAuthStore } from '../auth/authStore';
import { env } from '../config/env';
import { NetworkError, toApiError } from './errors';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retriedAfterRefresh?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { config, response } = error;

    if (!response) {
      // No response at all — offline, DNS failure, timeout, etc. (see API.md: this is distinct
      // from a 401, which means "reached the server but the token is bad").
      return Promise.reject(new NetworkError());
    }

    // Single silent-refresh-and-retry attempt per request (Фаза 1, issue "Тихий refresh").
    if (response.status === 401 && config && !config._retriedAfterRefresh) {
      config._retriedAfterRefresh = true;
      try {
        await ensureFreshAccessToken();
        return apiClient(config);
      } catch {
        await forceLogout();
        return Promise.reject(toApiError(401, response.data));
      }
    }

    return Promise.reject(toApiError(response.status, response.data));
  },
);
