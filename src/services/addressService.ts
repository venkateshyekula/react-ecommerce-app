import { apiClient } from "./apiClient";
import type {
  CreateAddressPayload,
  SavedAddress,
  UpdateAddressPayload
} from "../types/address";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";

const ADDRESSES_ENDPOINT = "/addresses";

export const addressService = {
  getAddressesByUserId: async (userId: string): Promise<SavedAddress[]> => {
    const addresses = await apiClient.get<SavedAddress[]>(
      `${ADDRESSES_ENDPOINT}?userId=${encodeURIComponent(userId)}`
    );

    return addresses.sort((firstAddress, secondAddress) => {
      if (firstAddress.isDefault && !secondAddress.isDefault) {
        return -1;
      }

      if (!firstAddress.isDefault && secondAddress.isDefault) {
        return 1;
      }

      return (
        new Date(secondAddress.createdAt).getTime() -
        new Date(firstAddress.createdAt).getTime()
      );
    });
  },

  createAddress: async (
    payload: CreateAddressPayload
  ): Promise<SavedAddress> => {
    const now = new Date().toISOString();

    const address: SavedAddress = {
      id: `address-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      ...payload
    };

    return apiClient.post<SavedAddress, SavedAddress>(
      ADDRESSES_ENDPOINT,
      address
    );
  },

  updateAddress: async (
    addressId: string,
    payload: UpdateAddressPayload
  ): Promise<SavedAddress> => {
    return apiClient.patch<SavedAddress, UpdateAddressPayload>(
      `${ADDRESSES_ENDPOINT}/${addressId}`,
      payload
    );
  },

  /*deleteAddress: async (addressId: string): Promise<void> => {
    await apiClient.delete<void>(`${ADDRESSES_ENDPOINT}/${addressId}`);
  },*/

 deleteAddress: async (addressId: string): Promise<void> => {
  assertValidDeleteId({
    entityType: "address",
    id: addressId
  });

  await apiClient.delete<void>(
    `${ADDRESSES_ENDPOINT}/${encodeURIComponent(addressId)}`
  );
},

  clearDefaultAddressForUser: async (
    userId: string,
    skipAddressId?: string
  ): Promise<void> => {
    const addresses = await addressService.getAddressesByUserId(userId);

    const defaultAddresses = addresses.filter(
      (address) => address.isDefault && address.id !== skipAddressId
    );

    await Promise.all(
      defaultAddresses.map((address) =>
        addressService.updateAddress(address.id, {
          isDefault: false,
          updatedAt: new Date().toISOString()
        })
      )
    );
  },

  setDefaultAddress: async (
    userId: string,
    addressId: string
  ): Promise<SavedAddress> => {
    await addressService.clearDefaultAddressForUser(userId, addressId);

    return addressService.updateAddress(addressId, {
      isDefault: true,
      updatedAt: new Date().toISOString()
    });
  }
};