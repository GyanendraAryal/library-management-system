import axios from "axios";
import { parseApiError } from "../utils/errors";
import { store } from "../store";
import { clearCredentials } from "../store/authSlice";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const BASE_URL = configuredBaseUrl || (import.meta.env.DEV ? "http://localhost:8000" : "");

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    if (import.meta.env.PROD) {
        const configurationError = new Error(
            "The API URL is not configured correctly. Set VITE_API_BASE_URL to your Django backend URL in Vercel.",
        );
        configurationError.name = "ApiConfigurationError";

        if (!BASE_URL) {
            throw configurationError;
        }

        let apiOrigin: string;
        try {
            apiOrigin = new URL(BASE_URL, window.location.origin).origin;
        } catch {
            throw configurationError;
        }

        if (apiOrigin === window.location.origin) {
            throw configurationError;
        }
    }

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
