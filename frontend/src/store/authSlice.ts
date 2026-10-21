import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isStaff: boolean;
}

function loadFromStorage(): AuthState {
  const token = localStorage.getItem("token");
  const raw = localStorage.getItem("user");
  if (token && raw) {
    try {
      const user = JSON.parse(raw) as User;
      return { user, token, isStaff: user.is_staff };
    } catch {
      // Corrupt storage — reset
    }
  }
  return { user: null, token: null, isStaff: false };
}

const authSlice = createSlice({
  name: "auth",
  initialState: loadFromStorage(),
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isStaff = action.payload.user.is_staff;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    updateUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isStaff = action.payload.is_staff;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    clearCredentials(state) {
      state.user = null;
      state.token = null;
      state.isStaff = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, updateUser, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
