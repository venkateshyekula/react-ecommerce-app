export type AddressType = "HOME" | "WORK" | "OTHER";

export interface SavedAddress {
  id: string;
  userId: string;
  fullName: string;
  mobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressPayload {
  userId: string;
  fullName: string;
  mobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
  isDefault: boolean;
}

export interface UpdateAddressPayload {
  fullName?: string;
  mobile?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  addressType?: AddressType;
  isDefault?: boolean;
  updatedAt: string;
}