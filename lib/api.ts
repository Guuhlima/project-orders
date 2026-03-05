import axios from "axios";

export const AUTH_TOKEN_KEY = "auth_token";

const apiBaseUrlFallback =
  process.env.NODE_ENV === "production"
    ? "https://project-orders-api.onrender.com"
    : "http://localhost:3333";

export const API_BASE_URL = process.env.NEXT_PUBLIC_URL_API ?? apiBaseUrlFallback;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
