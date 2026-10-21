import axios from "axios";
import { parseApiError } from "../utils/errors";
import { store } from "../store";
import { clearCredentials } from "../store/authSlice";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else if (!config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = parseApiError(error.response.data, error.response.status);
      const url = String(error.config?.url ?? "");
      const isAuthEndpoint = url.includes("/auth/login/") || url.includes("/auth/register/");
      if (apiError.status === 401 && !isAuthEndpoint) {
        store.dispatch(clearCredentials());
      }
      return Promise.reject(apiError);
    }
    return Promise.reject(error);
  },
);

export default api;
