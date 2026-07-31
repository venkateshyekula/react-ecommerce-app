export type AgentTaskType = "RETURN_PICKUP" | "ORDER_DELIVERY";

export type AgentAssignmentStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "OUT_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "PICKUP_ATTEMPTED"
  | "DELIVERY_ATTEMPTED"
  | "PICKUP_COMPLETED"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED"
  | "REASSIGNED";

export type AgentAssignmentPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type AgentType =
  | "PICKUP_AGENT"
  | "DELIVERY_AGENT"
  | "LOGISTICS_AGENT"
  | "BOTH";

export interface AgentProfile {
  id: string;
  agentId: string;
  name: string;
  phone: string;
  email?: string;
  agentType: AgentType;
  servicePincodes: string[];
  city?: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  maxDailyTasks?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentAssignment {
  id: string;
  assignmentId: string;

  taskType: AgentTaskType;
  taskId: string;
  orderId?: string;
  returnRequestId?: string;
  returnRequestDbId?: string;
  orderDbId?: string;

  userId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;

  address: string;
  pincode?: string;
  city?: string;
  state?: string;

  agentId?: string;
  agentName?: string;
  agentPhone?: string;
  agentType?: AgentType;

  status: AgentAssignmentStatus;
  priority: AgentAssignmentPriority;

  scheduledDate?: string;
  scheduledSlot?: string;

  attemptCount: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;

  remarks?: string;

  assignedByUserId?: string;
  assignedByName?: string;
  assignedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AgentTaskLog {
  id: string;
  assignmentId: string;
  taskType: AgentTaskType;
  taskId: string;

  agentId?: string;
  status: AgentAssignmentStatus;
  remarks?: string;

  createdByUserId?: string;
  createdByName?: string;
  createdAt: string;
}

export interface CreateAgentAssignmentPayload {
  taskType: AgentTaskType;
  taskId: string;
  orderId?: string;
  returnRequestId?: string;
  returnRequestDbId?: string;
  orderDbId?: string;

  userId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;

  address: string;
  pincode?: string;
  city?: string;
  state?: string;

  priority: AgentAssignmentPriority;

  scheduledDate?: string;
  scheduledSlot?: string;
  remarks?: string;
}

export interface AssignAgentPayload {
  agentId: string;
  agentName: string;
  agentPhone?: string;
  agentType: AgentType;
  assignedByUserId: string;
  assignedByName: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  remarks?: string;
}

export interface UpdateAgentAssignmentPayload {
  agentId?: string;
  agentName?: string;
  agentPhone?: string;
  agentType?: AgentType;

  status?: AgentAssignmentStatus;
  priority?: AgentAssignmentPriority;

  scheduledDate?: string;
  scheduledSlot?: string;

  attemptCount?: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;

  remarks?: string;

  assignedByUserId?: string;
  assignedByName?: string;
  assignedAt?: string;

  updatedAt?: string;
}