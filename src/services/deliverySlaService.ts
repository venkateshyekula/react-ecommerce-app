import { apiClient } from "./apiClient";
import type {
  CreateDeliverySlaRuleInput,
  DeliverySlaRule
} from "../types/delivery";

export const deliverySlaService = {
  // Get all SLA rules
  async getRules(): Promise<DeliverySlaRule[]> {
    return apiClient.get<DeliverySlaRule[]>("/deliverySlaRules");
  },

  // Get a single SLA rule by ID
  async getRuleById(id: string | number): Promise<DeliverySlaRule> {
    return apiClient.get<DeliverySlaRule>(`/deliverySlaRules/${id}`);
  },

  // Create a new SLA rule
  async createRule(
    data: CreateDeliverySlaRuleInput
  ): Promise<DeliverySlaRule> {
    // FIXED: Added CreateDeliverySlaRuleInput as the second type argument
    return apiClient.post<DeliverySlaRule, CreateDeliverySlaRuleInput>(
      "/deliverySlaRules", 
      data
    );
  },

  // Update an existing SLA rule
  async updateRule(
    id: string | number,
    data: Partial<CreateDeliverySlaRuleInput>
  ): Promise<DeliverySlaRule> {
    // FIXED: Added Partial<CreateDeliverySlaRuleInput> as the second type argument
    return apiClient.patch<DeliverySlaRule, Partial<CreateDeliverySlaRuleInput>>(
      `/deliverySlaRules/${id}`,
      data
    );
  },

  // Delete an SLA rule
  async deleteRule(id: string | number): Promise<void> {
    await apiClient.delete(`/deliverySlaRules/${id}`);
  }
};