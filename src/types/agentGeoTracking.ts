export type AgentGeoTaskType =
  | "RETURN_PICKUP"
  | "DELIVERY"
  | "PROOF_VERIFICATION"
  | "SUPPORT_VISIT";

export type AgentGeoTaskStatus =
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

export type AgentGeoRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AgentGeoTrackingStatus =
  | "LIVE"
  | "STALE"
  | "NO_LOCATION"
  | "COMPLETED"
  | "FAILED";

export interface AgentGeoLocation {
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
}

export interface AgentGeoTrackingRow {
  id: string;
  taskId: string;
  assignmentId?: string;

  agentId: string;
  agentName: string;
  agentPhone?: string;

  taskType: AgentGeoTaskType;
  taskStatus: AgentGeoTaskStatus;
  trackingStatus: AgentGeoTrackingStatus;
  riskLevel: AgentGeoRiskLevel;

  returnRequestId?: string;
  orderId?: string;

  customerName?: string;
  customerPhone?: string;

  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;

  agentLocation: AgentGeoLocation;
  customerLocation: AgentGeoLocation;

  distanceKm?: number;
  lastLocationAgeMinutes: number;

  scheduledAt?: string;
  assignedAt?: string;
  updatedAt?: string;

  elapsedHours: number;
  breachedHours: number;

  issueFlags: string[];
  recommendedActions: string[];
}

export interface AgentGeoLocationLog {
  id: string;
  logId: string;
  taskId: string;
  assignmentId?: string;
  agentId: string;
  agentName?: string;
  latitude: number;
  longitude: number;
  source: "AGENT_MOBILE" | "TASK_UPDATE" | "MANUAL";
  capturedAt: string;
  createdAt: string;
}

export interface AgentGeoTrackingSummary {
  totalRows: number;

  liveTrackingRows: number;
  staleTrackingRows: number;
  noLocationRows: number;
  completedRows: number;
  failedRows: number;

  lowRiskRows: number;
  mediumRiskRows: number;
  highRiskRows: number;
  criticalRiskRows: number;

  activeAgents: number;
  delayedTasks: number;
  breachedTasks: number;

  averageLocationAgeMinutes: number;
}

export interface AgentGeoTrackingDashboardData {
  rows: AgentGeoTrackingRow[];
  locationLogs: AgentGeoLocationLog[];
  summary: AgentGeoTrackingSummary;
}

export interface AgentGeoTrackingFilters {
  searchText: string;
  taskType: "ALL" | AgentGeoTaskType;
  trackingStatus: "ALL" | AgentGeoTrackingStatus;
  riskLevel: "ALL" | AgentGeoRiskLevel;
}