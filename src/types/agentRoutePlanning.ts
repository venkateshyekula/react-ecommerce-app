import type {
  AgentAssignment,
  AgentProfile,
  AgentTaskType
} from "./agentAssignment";

export type RouteClusterPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

export interface AgentRouteTask {
  assignment: AgentAssignment;
  taskType: AgentTaskType;
  taskId: string;
  customerName: string;
  address: string;
  pincode?: string;
  city?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  priority: RouteClusterPriority;
  agentId?: string;
  agentName?: string;
  status: string;
}

export interface AgentRouteSuggestion {
  agent: AgentProfile;
  assignedTodayCount: number;
  remainingCapacity: number;
  isCapacityAvailable: boolean;
  isPincodeSupported: boolean;
  score: number;
  recommendationReason: string;
}

export interface AgentRouteCluster {
  clusterId: string;
  pincode: string;
  city?: string;
  taskType: AgentTaskType | "MIXED";
  totalTasks: number;
  pickupTasks: number;
  deliveryTasks: number;
  unassignedTasks: number;
  assignedTasks: number;
  urgentTasks: number;
  scheduledDate?: string;
  tasks: AgentRouteTask[];
  suggestedAgents: AgentRouteSuggestion[];
}

export interface AgentRoutePlanningSummary {
  totalClusters: number;
  totalTasks: number;
  pickupTasks: number;
  deliveryTasks: number;
  unassignedTasks: number;
  assignedTasks: number;
  urgentTasks: number;
  clustersWithNoAgentSuggestion: number;
}

export interface AgentRoutePlanningDashboardData {
  summary: AgentRoutePlanningSummary;
  clusters: AgentRouteCluster[];
}