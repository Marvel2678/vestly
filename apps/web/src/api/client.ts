import axios, { InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

// ─── Public client (no auth) ──────────────────────────────────────────────────
export const publicApi = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

// ─── Authenticated client ─────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // needed to send the httpOnly refresh cookie
});

// Attach access token from memory on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Silent refresh on 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await publicApi.post<{ data: { accessToken: string } }>("/auth/refresh");
      const newToken = data.data.accessToken;
      setAccessToken(newToken);
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch {
      refreshQueue = [];
      setAccessToken(null);
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

// ─── In-memory token store ────────────────────────────────────────────────────
// Never stored in localStorage — lives only in JS memory for security
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
}
