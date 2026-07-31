import { apiClient } from "./apiClient";
import type { AgentAssignment } from "../types/agentAssignment";
import type {
    AgentNotification,
    AgentNotificationRecipientRole,
    CreateAgentNotificationPayload
} from "../types/agentNotification";
import type { AgentProofReviewRow } from "../types/agentProofVerification";

const NOTIFICATIONS_ENDPOINT = "/notifications";
const USERS_ENDPOINT = "/users";

type UserLike = {
    id: string;
    name?: string;
    role?: string;
    partnerId?: string;
    pickupPartnerId?: string;
    deliveryPartnerId?: string;
};

const generateNotificationDbId = (): string => {
    return `notification-agent-db-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
};

const generateNotificationId = (): string => {
    return `AGT-NOTIF-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Date.now()}`;
};

const toRecipientRole = (role?: string): AgentNotificationRecipientRole => {
    if (role === "PICKUP_AGENT") {
        return "PICKUP_AGENT";
    }

    if (role === "DELIVERY_AGENT") {
        return "DELIVERY_AGENT";
    }

    if (role === "LOGISTICS_AGENT") {
        return "LOGISTICS_AGENT";
    }

    return "ADMIN";
};

const getUserByPartnerId = async (
    partnerId?: string
): Promise<UserLike | undefined> => {
    if (!partnerId) {
        return undefined;
    }

    try {
        const users = await apiClient.get<UserLike[]>(USERS_ENDPOINT);

        if (!Array.isArray(users)) {
            return undefined;
        }

        return users.find(
            (user) =>
                user.partnerId === partnerId ||
                user.pickupPartnerId === partnerId ||
                user.deliveryPartnerId === partnerId
        );
    } catch {
        return undefined;
    }
};

const getAdminUsers = async (): Promise<UserLike[]> => {
    try {
        const users = await apiClient.get<UserLike[]>(USERS_ENDPOINT);

        if (!Array.isArray(users)) {
            return [];
        }

        return users.filter((user) => user.role === "ADMIN");
    } catch {
        return [];
    }
};

export const agentNotificationService = {
    createNotification: async (
        payload: CreateAgentNotificationPayload
    ): Promise<AgentNotification> => {
        const now = new Date().toISOString();

        const notification: AgentNotification = {
            ...payload,
            id: generateNotificationDbId(),
            notificationId: generateNotificationId(),
            isRead: false,
            createdAt: now,
            updatedAt: now
        };

        return apiClient.post<AgentNotification, AgentNotification>(
            NOTIFICATIONS_ENDPOINT,
            notification
        );
    },

    notifyAgentAssigned: async ({
        assignment,
        assignedAgentRole
    }: {
        assignment: AgentAssignment;
        assignedAgentRole?: string;
    }): Promise<void> => {
        const user = await getUserByPartnerId(assignment.agentId);

        await agentNotificationService.createNotification({
            recipientUserId: user?.id,
            recipientRole: toRecipientRole(assignedAgentRole ?? assignment.agentType),
            recipientPartnerId: assignment.agentId,
            title:
                assignment.taskType === "RETURN_PICKUP"
                    ? "New return pickup assigned"
                    : "New delivery assigned",
            message:
                assignment.taskType === "RETURN_PICKUP"
                    ? `Return pickup task ${assignment.taskId} has been assigned to you.`
                    : `Delivery task ${assignment.taskId} has been assigned to you.`,
            severity: "info",
            entityType: "AGENT_ASSIGNMENT",
            entityId: assignment.assignmentId,
            entityDbId: assignment.id,
            actionUrl:
                assignment.taskType === "RETURN_PICKUP"
                    ? "/agent/returns"
                    : "/agent/deliveries"
        });
    },

    notifyAdminsTaskStatusChanged: async ({
        assignment,
        title,
        message,
        severity
    }: {
        assignment: AgentAssignment;
        title: string;
        message: string;
        severity: "info" | "success" | "warning" | "danger";
    }): Promise<void> => {
        const adminUsers = await getAdminUsers();

        if (adminUsers.length === 0) {
            await agentNotificationService.createNotification({
                recipientRole: "ADMIN",
                title,
                message,
                severity,
                entityType:
                    assignment.taskType === "RETURN_PICKUP"
                        ? "RETURN_PICKUP"
                        : "ORDER_DELIVERY",
                entityId: assignment.assignmentId,
                entityDbId: assignment.id,
                actionUrl: "/admin/agent-workload-dashboard"
            });
            return;
        }

        // Use Promise.allSettled to prevent single admin dispatch failures from rejecting the batch
        await Promise.allSettled(
            adminUsers.map((adminUser) =>
                agentNotificationService.createNotification({
                    recipientUserId: adminUser.id,
                    recipientRole: "ADMIN",
                    title,
                    message,
                    severity,
                    entityType:
                        assignment.taskType === "RETURN_PICKUP"
                            ? "RETURN_PICKUP"
                            : "ORDER_DELIVERY",
                    entityId: assignment.assignmentId,
                    entityDbId: assignment.id,
                    actionUrl: "/admin/agent-workload-dashboard"
                })
            )
        );
    },

    notifyProofReviewToAgent: async ({
        row,
        status,
        remarks
    }: {
        row: AgentProofReviewRow;
        status: "VERIFIED" | "REJECTED" | "PENDING";
        remarks: string;
    }): Promise<void> => {
        const user = await getUserByPartnerId(row.agentId);

        const recipientRole: AgentNotificationRecipientRole =
            row.sourceType === "PICKUP_PROOF" ? "PICKUP_AGENT" : "DELIVERY_AGENT";

        await agentNotificationService.createNotification({
            recipientUserId: user?.id,
            recipientRole,
            recipientPartnerId: row.agentId,
            title:
                status === "VERIFIED"
                    ? "Proof verified by admin"
                    : "Proof rejected by admin",
            message:
                status === "VERIFIED"
                    ? `Your proof ${row.proofId} has been verified.`
                    : `Your proof ${row.proofId} was rejected. Remarks: ${remarks}`,
            severity: status === "VERIFIED" ? "success" : "danger",
            entityType:
                row.sourceType === "PICKUP_PROOF" ? "PICKUP_PROOF" : "DELIVERY_PROOF",
            entityId: row.proofId,
            entityDbId: row.id,
            actionUrl:
                row.sourceType === "PICKUP_PROOF"
                    ? "/agent/returns"
                    : "/agent/deliveries"
        });
    }
};