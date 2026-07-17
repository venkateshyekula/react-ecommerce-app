import type { SupportEscalationTeam } from "./supportEscalation";

export type SupportTeamMemberAvailability =
  | "AVAILABLE"
  | "BUSY"
  | "AWAY"
  | "OFFLINE"
  | "ON_LEAVE";

export interface SupportTeam {
  id: string;
  teamCode: SupportEscalationTeam;
  teamName: string;
  description: string;
  isActive: boolean;
}

export interface SupportTeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  teamCode: SupportEscalationTeam;
  isActive: boolean;

  availabilityStatus?: SupportTeamMemberAvailability;
  activeEscalationCount?: number;
  maxEscalationCapacity?: number;
  lastActiveAt?: string;
}

export interface UpdateSupportTeamMemberPayload {
  availabilityStatus?: SupportTeamMemberAvailability;
  activeEscalationCount?: number;
  maxEscalationCapacity?: number;
  lastActiveAt?: string;
  isActive?: boolean;
}