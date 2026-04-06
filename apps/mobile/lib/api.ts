import axios, { type AxiosError } from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

api.interceptors.request.use(async (config) => {
  try {
    const token = tokenGetter ? await tokenGetter() : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      const data = err.response?.data as { error?: unknown } | undefined;
      const message = typeof data?.error === 'string' ? data.error : 'Session expired. Please sign in again.';
      err.message = message;
    }
    return Promise.reject(err);
  }
);

export default api;
