import { apiClient } from "./apiClient";
import type {
  CreateSupportEscalationPayload,
  SupportEscalation,
  SupportEscalationActivity,
  SupportEscalationStatus,
  UpdateSupportEscalationPayload
} from "../types/supportEscalation";

const SUPPORT_ESCALATIONS_ENDPOINT = "/supportEscalations";

const sortEscalationsByLatest = (
  escalations: SupportEscalation[]
): SupportEscalation[] => {
  return [...escalations].sort(
    (firstEscalation, secondEscalation) =>
      new Date(secondEscalation.updatedAt).getTime() -
      new Date(firstEscalation.updatedAt).getTime()
  );
};

const generateEscalationDbId = (): string => {
  return `support-escalation-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generateEscalationNumber = (): string => {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  return `ESC-${datePart}-${Date.now()}`;
};

const createEscalationActivity = ({
  label,
  description,
  createdByName
}: {
  label: string;
  description: string;
  createdByName: string;
}): SupportEscalationActivity => {
  return {
    id: `escalation-activity-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    label,
    description,
    createdByName,
    createdAt: new Date().toISOString()
  };
};

export const supportEscalationService = {
  getEscalations: async (): Promise<SupportEscalation[]> => {
    const escalations = await apiClient.get<SupportEscalation[]>(
      SUPPORT_ESCALATIONS_ENDPOINT
    );

    return sortEscalationsByLatest(escalations);
  },

  getEscalationsByTicketDbId: async (
    ticketDbId: string
  ): Promise<SupportEscalation[]> => {
    const escalations = await apiClient.get<SupportEscalation[]>(
      `${SUPPORT_ESCALATIONS_ENDPOINT}?ticketDbId=${encodeURIComponent(
        ticketDbId
      )}`
    );

    return sortEscalationsByLatest(escalations);
  },

  getActiveEscalationsByTicketDbId: async (
    ticketDbId: string
  ): Promise<SupportEscalation[]> => {
    const escalations = await supportEscalationService.getEscalationsByTicketDbId(
      ticketDbId
    );

    return escalations.filter(
      (escalation) =>
        escalation.status !== "RESOLVED" && escalation.status !== "CANCELLED"
    );
  },

  createEscalation: async (
    payload: CreateSupportEscalationPayload
  ): Promise<SupportEscalation> => {
    const now = new Date().toISOString();

    const escalation: SupportEscalation = {
      id: generateEscalationDbId(),
      escalationId: generateEscalationNumber(),

      ...payload,

      status: "OPEN",
      assignedToUserId: null,
      assignedToName: null,

      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,

      activities: [
        createEscalationActivity({
          label: "Escalation Created",
          description: `Ticket escalated to ${payload.team}.`,
          createdByName: payload.createdByName
        })
      ]
    };

    return apiClient.post<SupportEscalation, SupportEscalation>(
      SUPPORT_ESCALATIONS_ENDPOINT,
      escalation
    );
  },

  updateEscalation: async (
    escalationDbId: string,
    payload: UpdateSupportEscalationPayload
  ): Promise<SupportEscalation> => {
    return apiClient.patch<
      SupportEscalation,
      UpdateSupportEscalationPayload
    >(`${SUPPORT_ESCALATIONS_ENDPOINT}/${encodeURIComponent(escalationDbId)}`, {
      ...payload,
      updatedAt: new Date().toISOString()
    });
  },

  updateEscalationStatus: async ({
    escalation,
    status,
    updatedByName,
    resolutionNote
  }: {
    escalation: SupportEscalation;
    status: SupportEscalationStatus;
    updatedByName: string;
    resolutionNote?: string;
  }): Promise<SupportEscalation> => {
    const now = new Date().toISOString();

    const nextActivities = [
      ...escalation.activities,
      createEscalationActivity({
        label: "Escalation Status Updated",
        description: `Escalation status changed from ${escalation.status} to ${status}.`,
        createdByName: updatedByName
      })
    ];

    return supportEscalationService.updateEscalation(escalation.id, {
      status,
      activities: nextActivities,
      resolvedAt: status === "RESOLVED" ? now : escalation.resolvedAt,
      resolutionNote:
        status === "RESOLVED"
          ? resolutionNote ?? escalation.resolutionNote ?? ""
          : escalation.resolutionNote
    });
  },

  assignEscalation: async ({
    escalation,
    assignedToUserId,
    assignedToName,
    updatedByName
  }: {
    escalation: SupportEscalation;
    assignedToUserId: string;
    assignedToName: string;
    updatedByName: string;
  }): Promise<SupportEscalation> => {
    const nextActivities = [
      ...escalation.activities,
      createEscalationActivity({
        label: "Escalation Assigned",
        description: `Escalation assigned to ${assignedToName}.`,
        createdByName: updatedByName
      })
    ];

    return supportEscalationService.updateEscalation(escalation.id, {
      status:
        escalation.status === "OPEN" ? "ASSIGNED" : escalation.status,
      assignedToUserId,
      assignedToName,
      activities: nextActivities
    });
  },
  assignEscalationToMember: async ({
    escalation,
    assignedToUserId,
    assignedToName,
    updatedByName
  }: {
    escalation: SupportEscalation;
    assignedToUserId: string;
    assignedToName: string;
    updatedByName: string;
  }): Promise<SupportEscalation> => {
    const nextActivities = [
      ...escalation.activities,
      createEscalationActivity({
        label: "Escalation Assigned",
        description: `Escalation assigned to ${assignedToName}.`,
        createdByName: updatedByName
      })
    ];

    return supportEscalationService.updateEscalation(escalation.id, {
      status: escalation.status === "OPEN" ? "ASSIGNED" : escalation.status,
      assignedToUserId,
      assignedToName,
      activities: nextActivities
    });
  },
};