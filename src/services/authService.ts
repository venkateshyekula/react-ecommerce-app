import { apiClient } from "./apiClient";
import type { AuthUser, RegisterPayload, User } from "../types/auth";

const USERS_ENDPOINT = "/users";

const removePassword = (user: User): AuthUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    address: user.address
  };
};

export const authService = {
  getUsers: async (): Promise<User[]> => {
    return apiClient.get<User[]>(USERS_ENDPOINT);
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const users = await apiClient.get<User[]>(
      `${USERS_ENDPOINT}?email=${encodeURIComponent(email.trim().toLowerCase())}`
    );

    return users.length > 0 ? users[0] : null;
  },

  registerUser: async (payload: RegisterPayload): Promise<AuthUser> => {
    const normalizedEmail = payload.email.trim().toLowerCase();

    const existingUser = await authService.getUserByEmail(normalizedEmail);

    if (existingUser) {
      throw new Error("Email is already registered.");
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: payload.name.trim(),
      email: normalizedEmail,
      password: payload.password,
      mobile: payload.mobile.trim(),
      address: payload.address.trim()
    };

    const createdUser = await apiClient.post<User, User>(
      USERS_ENDPOINT,
      newUser
    );

    return removePassword(createdUser);
  },

  loginUser: async (email: string, password: string): Promise<AuthUser> => {
    const user = await authService.getUserByEmail(email);

    if (!user || user.password !== password) {
      throw new Error("Invalid email or password.");
    }

    return removePassword(user);
  }
};