import api from "./api";
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  User,
} from "../types";

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login/", payload);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>("/auth/register/", payload);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout/");
  },

  async getProfile(): Promise<User> {
    const response = await api.get<{ data: User }>("/auth/users/profile/");
    return response.data.data;
  },

  async updateProfile(payload: FormData): Promise<User> {
    const response = await api.patch<{ data: User }>("/auth/users/profile/", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  async listUsers(): Promise<{ count: number; data: User[] }> {
    const response = await api.get<{ count: number; data: User[] }>("/auth/users/");
    return response.data;
  },
};
