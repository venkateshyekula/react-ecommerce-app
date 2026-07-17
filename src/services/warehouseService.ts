import { apiClient } from "./apiClient";
import type {
  Warehouse,
  CreateWarehouseInput
} from "../types/delivery";

export const warehouseService = {
  // Get all warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    return apiClient.get<Warehouse[]>("/warehouses");
  },

  // Create a new warehouse
  async createWarehouse(
    data: CreateWarehouseInput
  ): Promise<Warehouse> {
    // FIXED: Added second type argument <Response, Request>
    return apiClient.post<Warehouse, CreateWarehouseInput>(
      "/warehouses",
      data
    );
  },

  // Update an existing warehouse
  async updateWarehouse(
    id: number,
    data: Partial<CreateWarehouseInput>
  ): Promise<Warehouse> {
    // FIXED: Added second type argument <Response, Request>
    return apiClient.patch<Warehouse, Partial<CreateWarehouseInput>>(
      `/warehouses/${id}`,
      data
    );
  },

  // Delete a warehouse
  async deleteWarehouse(id: number): Promise<void> {
    // FIXED: Completed the template literal syntax and closed the block
    await apiClient.delete(`/warehouses/${id}`);
  }
};