import { apiClient } from "./apiClient";
import type {
  CreateReturnPolicyRuleInput,
  ReturnPolicyRule
} from "../types/returnPolicy";

export const returnPolicyService = {
  // Get all return policy rules
  async getRules(): Promise<ReturnPolicyRule[]> {
    return apiClient.get<ReturnPolicyRule[]>("/returnPolicyRules");
  },

  // Create a new return policy rule
  async createRule(
    data: CreateReturnPolicyRuleInput
  ): Promise<ReturnPolicyRule> {
    // FIXED: Added CreateReturnPolicyRuleInput as the second generic type argument
    return apiClient.post<ReturnPolicyRule, CreateReturnPolicyRuleInput>(
      "/returnPolicyRules",
      data
    );
  },

  // Update an existing return policy rule
  async updateRule(
    id: string | number,
    data: Partial<CreateReturnPolicyRuleInput>
  ): Promise<ReturnPolicyRule> {
    // FIXED: Added Partial<CreateReturnPolicyRuleInput> as the second generic type argument
    return apiClient.patch<ReturnPolicyRule, Partial<CreateReturnPolicyRuleInput>>(
      `/returnPolicyRules/${id}`,
      data
    );
  },

  // Delete a return policy rule
  async deleteRule(id: string | number): Promise<void> {
    await apiClient.delete(`/returnPolicyRules/${id}`);
  }
};