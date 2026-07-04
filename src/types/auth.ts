export type UserRole = "CUSTOMER" | "ADMIN" | "SELLER" | "SUPPORT";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  mobile: string;
  address: string;
  role?: UserRole;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  role: UserRole;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  mobile: string;
  address: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthContextValue {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
}