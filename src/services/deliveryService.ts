import { apiClient } from "./apiClient";
import type { CreateZoneInput, DeliveryZone } from "../types/delivery";

export const deliveryService = {
  // Get all zones
  async getZones(): Promise<DeliveryZone[]> {
    return apiClient.get<DeliveryZone[]>("/deliveryZones");
  },

  // Get a single zone by ID
  async getZoneById(id: string | number): Promise<DeliveryZone> {
    return apiClient.get<DeliveryZone>(`/deliveryZones/${id}`);
  },

  // Create a new zone
  async createZone(data: CreateZoneInput): Promise<DeliveryZone> {
    // FIXED: Added CreateZoneInput as the second type argument
    return apiClient.post<DeliveryZone, CreateZoneInput>(
      "/deliveryZones", 
      data
    );
  },

  // Update an existing zone
  async updateZone(
    id: string | number,
    data: Partial<CreateZoneInput>
  ): Promise<DeliveryZone> {
    // FIXED: Added Partial<CreateZoneInput> as the second type argument
    return apiClient.patch<DeliveryZone, Partial<CreateZoneInput>>(
      `/deliveryZones/${id}`, 
      data
    );
  },

  // Delete a zone
  async deleteZone(id: string | number): Promise<void> {
    await apiClient.delete(`/deliveryZones/${id}`);
  }
};