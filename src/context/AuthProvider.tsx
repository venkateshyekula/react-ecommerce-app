import { useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/authService";
import type {
  AuthContextValue,
  AuthUser,
  RegisterPayload
} from "../types/auth";
import {
  getFromStorage,
  removeFromStorage,
  setToStorage,
  STORAGE_KEYS
} from "../utils/storage";
import { AuthContext } from "./authContext";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return getFromStorage<AuthUser | null>(STORAGE_KEYS.CURRENT_USER, null);
  });

  const login = async (
    email: string,
    password: string
  ): Promise<AuthUser> => {
    const loggedInUser = await authService.loginUser(email, password);

    setCurrentUser(loggedInUser);
    setToStorage<AuthUser>(STORAGE_KEYS.CURRENT_USER, loggedInUser);

    return loggedInUser;
  };

  const register = async (
    payload: RegisterPayload
  ): Promise<AuthUser> => {
    const registeredUser = await authService.registerUser(payload);

    setCurrentUser(registeredUser);
    setToStorage<AuthUser>(STORAGE_KEYS.CURRENT_USER, registeredUser);

    return registeredUser;
  };

  const logout = (): void => {
    setCurrentUser(null);
    removeFromStorage(STORAGE_KEYS.CURRENT_USER);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      login,
      register,
      logout
    }),
    [currentUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};