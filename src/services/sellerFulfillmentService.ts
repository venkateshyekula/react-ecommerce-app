import { apiClient } from "./apiClient";
import type {
  CreateSellerFulfillmentInput,
  SellerFulfillmentMapping
} from "../types/delivery";

export const sellerFulfillmentService = {
  // Get all seller fulfillment mappings
  async getMappings(): Promise<SellerFulfillmentMapping[]> {
    return apiClient.get<SellerFulfillmentMapping[]>("/sellerFulfillmentMappings");
  },

  // Get a single mapping by ID
  async getMappingById(
    id: string | number
  ): Promise<SellerFulfillmentMapping> {
    return apiClient.get<SellerFulfillmentMapping>(
      `/sellerFulfillmentMappings/${id}`
    );
  },

  // Create a new fulfillment mapping
  async createMapping(
    data: CreateSellerFulfillmentInput
  ): Promise<SellerFulfillmentMapping> {
    // FIXED: Added CreateSellerFulfillmentInput as the second type argument
    return apiClient.post<SellerFulfillmentMapping, CreateSellerFulfillmentInput>(
      "/sellerFulfillmentMappings",
      data
    );
  },

  // Update an existing fulfillment mapping
  async updateMapping(
    id: string | number,
    data: Partial<CreateSellerFulfillmentInput>
  ): Promise<SellerFulfillmentMapping> {
    // FIXED: Added Partial<CreateSellerFulfillmentInput> as the second type argument
    return apiClient.patch<SellerFulfillmentMapping, Partial<CreateSellerFulfillmentInput>>(
      `/sellerFulfillmentMappings/${id}`,
      data
    );
  },

  // Delete a fulfillment mapping
  async deleteMapping(id: string | number): Promise<void> {
    await apiClient.delete(`/sellerFulfillmentMappings/${id}`);
  }
};