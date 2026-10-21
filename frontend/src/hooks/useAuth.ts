import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "../store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useAuth() {
  const auth = useAppSelector((state) => state.auth);
  return {
    user: auth.user,
    token: auth.token,
    isStaff: auth.isStaff,
    isAuthenticated: !!auth.token,
  };
}
