import { useMemo, useState, type ReactNode } from "react";
import { authService } from "../services/authService";
import type {
  AuthContextValue,
  AuthUser,
  RegisterPayload,
  UserRole
} from "../types/auth";
import {
  getFromStorage,
  removeFromStorage,
  setToStorage,
  STORAGE_KEYS
} from "../utils/storage";
import { AuthContext } from "./AuthContextObject";

interface AuthProviderProps {
  children: ReactNode;
}

type StoredAuthUser = Partial<AuthUser> | null;

const DEFAULT_CUSTOMER_ROLE: UserRole = "CUSTOMER";

const normalizeStoredUser = (user: StoredAuthUser): AuthUser | null => {
  if (!user || !user.id || !user.name || !user.email) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile ?? "",
    address: user.address ?? "",
    role: user.role ?? DEFAULT_CUSTOMER_ROLE
  };
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const storedUser = getFromStorage<StoredAuthUser>(
      STORAGE_KEYS.CURRENT_USER,
      null
    );

    return normalizeStoredUser(storedUser);
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