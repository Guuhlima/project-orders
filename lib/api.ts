import axios from "axios";

export const AUTH_TOKEN_KEY = "auth_token";

const apiBaseUrl = process.env.NEXT_PUBLIC_URL_API ?? "http://localhost:3333";

const api = axios.create({
  baseURL: apiBaseUrl,
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
