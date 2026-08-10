export type AgentMobileTaskType =
  | "RETURN_PICKUP"
  | "DELIVERY"
  | "PROOF_VERIFICATION"
  | "SUPPORT_VISIT";

export type AgentMobileTaskStatus =
  | "ASSIGNED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "REACHED_LOCATION"
  | "PICKED_UP"
  | "DELIVERED"
  | "FAILED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export type AgentMobileTaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type AgentMobileProofStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "SUBMITTED"
  | "VERIFIED"
  | "REJECTED";

export type AgentMobileFailureReason =
  | "CUSTOMER_NOT_AVAILABLE"
  | "ADDRESS_NOT_FOUND"
  | "CUSTOMER_REFUSED"
  | "PACKAGE_NOT_READY"
  | "AGENT_VEHICLE_ISSUE"
  | "WEATHER_DELAY"
  | "OTHER";

export interface AgentMobileCoordinates {
  latitude: number;
  longitude: number;
}

export interface AgentMobileCustomerInfo {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface AgentMobileAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface AgentMobileTask {
  id: string;
  taskId: string;
  assignmentId?: string;

  agentId: string;
  agentName: string;

  taskType: AgentMobileTaskType;
  status: AgentMobileTaskStatus;
  priority: AgentMobileTaskPriority;

  returnRequestId?: string;
  orderId?: string;
  trackingId?: string;

  customer: AgentMobileCustomerInfo;
  address: AgentMobileAddress;

  productName?: string;
  packageCount: number;
  amountToCollect?: number;

  scheduledAt?: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  reachedAt?: string;
  completedAt?: string;
  failedAt?: string;
  updatedAt?: string;

  proofRequired: boolean;
  proofStatus: AgentMobileProofStatus;
  proofImageUrl?: string;
  proofOtp?: string;
  proofNotes?: string;

  attemptCount: number;
  failureReason?: AgentMobileFailureReason;
  failureNotes?: string;

  routeDistanceKm?: number;
  estimatedTravelMinutes?: number;

  customerInstructions?: string;
  internalNotes?: string;

  canAccept: boolean;
  canStart: boolean;
  canMarkReached: boolean;
  canSubmitProof: boolean;
  canComplete: boolean;
  canFail: boolean;

  coordinates?: AgentMobileCoordinates;
}

export interface AgentMobileTaskUpdatePayload {
  task: AgentMobileTask;
  nextStatus: AgentMobileTaskStatus;
  notes?: string;
  failureReason?: AgentMobileFailureReason;
  proofOtp?: string;
  proofImageUrl?: string;
  coordinates?: AgentMobileCoordinates;
}

export interface AgentMobileActivityLog {
  id: string;
  logId: string;
  taskId: string;
  agentId: string;
  action: AgentMobileTaskStatus;
  notes?: string;
  failureReason?: AgentMobileFailureReason;
  proofOtp?: string;
  proofImageUrl?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  createdBy: string;
}

export interface AgentMobileSummary {
  totalTasks: number;
  assignedTasks: number;
  acceptedTasks: number;
  inProgressTasks: number;
  reachedLocationTasks: number;
  completedTasks: number;
  failedTasks: number;
  proofPendingTasks: number;
  highPriorityTasks: number;
  criticalPriorityTasks: number;
}

export interface AgentMobileDashboardData {
  tasks: AgentMobileTask[];
  activityLogs: AgentMobileActivityLog[];
  summary: AgentMobileSummary;
}

export interface AgentMobileFilters {
  searchText: string;
  status: "ALL" | AgentMobileTaskStatus;
  taskType: "ALL" | AgentMobileTaskType;
  priority: "ALL" | AgentMobileTaskPriority;
}