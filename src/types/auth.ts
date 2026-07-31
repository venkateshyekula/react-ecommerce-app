export type UserRole =
  | "CUSTOMER"
  | "ADMIN"
  | "SELLER"
  | "SUPPORT"
  | "PICKUP_AGENT"
  | "DELIVERY_AGENT"
  | "LOGISTICS_AGENT"
  | "WAREHOUSE_AGENT";
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  mobile?: string;
  phone?: string;
  address?: string;
  role?: UserRole;
  supportTeamCode?: string;
  supportTeamRole?: string;
  warehouseTeamCode?: string;
  warehouseTeamRole?: string;
  isActive?: boolean;
  partnerId?: string;
  pickupPartnerId?: string;
  deliveryPartnerId?: string;
  partnerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  supportTeamCode?: string;
  supportTeamRole?: string;
  warehouseTeamCode?: string;
  warehouseTeamRole?: string;
  isActive?: boolean;
  partnerId?: string;
  pickupPartnerId?: string;
  deliveryPartnerId?: string;
  partnerName?: string;
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