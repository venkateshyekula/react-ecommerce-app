import { apiClient } from "./apiClient";
import type { ReturnRequest } from "../types/returnRequest";
import type {
  CreateSellerReturnDisputePayload,
  SellerReturnDispute,
  SellerReturnDisputeActivity,
  SellerReturnDisputeActivityRole,
  SellerReturnDisputeEvidence,
  UpdateSellerReturnDisputePayload
} from "../types/sellerReturnDispute";
import { hasSellerItemsInReturn } from "../utils/sellerReturnWorkflowUtils";
import { assertValidDeleteId } from "../utils/deleteSafetyUtils";

const RETURN_REQUESTS_ENDPOINT = "/returnRequests";
const SELLER_RETURN_DISPUTES_ENDPOINT = "/sellerReturnDisputes";

const generateDisputeDbId = (): string => {
  return `seller-dispute-db-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const generateDisputeId = (): string => {
  return `SRD-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${Date.now()}`;
};

const generateActivityId = (): string => {
  return `seller-dispute-activity-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const createDisputeActivity = ({
  label,
  description,
  createdByRole,
  createdByName
}: {
  label: string;
  description: string;
  createdByRole: SellerReturnDisputeActivityRole;
  createdByName?: string;
}): SellerReturnDisputeActivity => {
  return {
    id: generateActivityId(),
    label,
    description,
    createdAt: new Date().toISOString(),
    createdByRole,
    createdByName
  };
};

const getSafeTime = (dateStr?: string | null): number => {
  if (!dateStr) {
    return 0;
  }

  const time = new Date(dateStr).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const sortDisputesByLatest = (
  disputes: SellerReturnDispute[]
): SellerReturnDispute[] => {
  return [...disputes].sort(
    (firstDispute, secondDispute) =>
      getSafeTime(secondDispute.createdAt) -
      getSafeTime(firstDispute.createdAt)
  );
};

export const sellerReturnDisputeService = {
  getSellerReturnRequests: async (
    sellerId: string
  ): Promise<ReturnRequest[]> => {
    const requests = await apiClient.get<ReturnRequest[]>(
      RETURN_REQUESTS_ENDPOINT
    );

    const safeRequests = Array.isArray(requests) ? requests : [];

    return safeRequests
      .filter((request) => hasSellerItemsInReturn(request, sellerId))
      .sort((firstRequest, secondRequest) => {
        const firstTime = getSafeTime(
          firstRequest.updatedAt ?? firstRequest.createdAt
        );
        const secondTime = getSafeTime(
          secondRequest.updatedAt ?? secondRequest.createdAt
        );

        return secondTime - firstTime;
      });
  },

  getDisputes: async (): Promise<SellerReturnDispute[]> => {
    const disputes = await apiClient.get<SellerReturnDispute[]>(
      SELLER_RETURN_DISPUTES_ENDPOINT
    );

    return sortDisputesByLatest(Array.isArray(disputes) ? disputes : []);
  },

  getDisputesBySellerId: async (
    sellerId: string
  ): Promise<SellerReturnDispute[]> => {
    if (!sellerId?.trim()) {
      return sellerReturnDisputeService.getDisputes();
    }

    const endpoint = `${SELLER_RETURN_DISPUTES_ENDPOINT}?sellerId=${encodeURIComponent(
      sellerId.trim()
    )}`;

    const disputes = await apiClient.get<SellerReturnDispute[]>(endpoint);
    const safeDisputes = Array.isArray(disputes) ? disputes : [];

    return sortDisputesByLatest(
      safeDisputes.filter((dispute) => dispute.sellerId === sellerId)
    );
  },

  getDisputesByReturnRequestDbId: async (
    returnRequestDbId: string
  ): Promise<SellerReturnDispute[]> => {
    if (!returnRequestDbId?.trim()) {
      return [];
    }

    const endpoint = `${SELLER_RETURN_DISPUTES_ENDPOINT}?returnRequestDbId=${encodeURIComponent(
      returnRequestDbId.trim()
    )}`;

    const disputes = await apiClient.get<SellerReturnDispute[]>(endpoint);
    const safeDisputes = Array.isArray(disputes) ? disputes : [];

    return sortDisputesByLatest(
      safeDisputes.filter(
        (dispute) => dispute.returnRequestDbId === returnRequestDbId
      )
    );
  },

  createDispute: async (
    payload: CreateSellerReturnDisputePayload
  ): Promise<SellerReturnDispute> => {
    const now = new Date().toISOString();

    const dispute: SellerReturnDispute = {
      ...payload,
      id: generateDisputeDbId(),
      disputeId: generateDisputeId(),
      status: "PENDING_REVIEW",
      sellerEvidence: payload.sellerEvidence ?? [],
      sellerResponseCount: 0,
      activities: [
        createDisputeActivity({
          label: "Dispute Created",
          description: `${payload.sellerName} created a seller return dispute for ${payload.productName}.`,
          createdByRole: "SELLER",
          createdByName: payload.sellerName
        })
      ],
      createdAt: now,
      updatedAt: now
    };

    return apiClient.post<SellerReturnDispute, SellerReturnDispute>(
      SELLER_RETURN_DISPUTES_ENDPOINT,
      dispute
    );
  },

  updateDispute: async (
    disputeDbId: string,
    payload: UpdateSellerReturnDisputePayload
  ): Promise<SellerReturnDispute> => {
    assertValidDeleteId({
      entityType: "sellerReturnDispute",
      id: disputeDbId
    });

    return apiClient.patch<SellerReturnDispute, UpdateSellerReturnDisputePayload>(
      `${SELLER_RETURN_DISPUTES_ENDPOINT}/${encodeURIComponent(disputeDbId)}`,
      {
        ...payload,
        updatedAt: new Date().toISOString()
      }
    );
  },

  updateAdminDecision: async ({
    dispute,
    status,
    adminDecision,
    adminRemarks,
    reviewedByUserId,
    reviewedByName
  }: {
    dispute: SellerReturnDispute;
    status: SellerReturnDispute["status"];
    adminDecision: SellerReturnDispute["adminDecision"];
    adminRemarks: string;
    reviewedByUserId: string;
    reviewedByName: string;
  }): Promise<SellerReturnDispute> => {
    const now = new Date().toISOString();

    const activityLabel =
      status === "APPROVED"
        ? "Dispute Approved"
        : status === "REJECTED"
          ? "Dispute Rejected"
          : status === "NEEDS_MORE_EVIDENCE"
            ? "More Evidence Requested"
            : "Admin Decision Updated";

    const activityDescription =
      status === "NEEDS_MORE_EVIDENCE"
        ? `${reviewedByName} requested more evidence from seller.`
        : `${reviewedByName} updated dispute decision to ${status}.`;

    return sellerReturnDisputeService.updateDispute(dispute.id, {
      status,
      adminDecision,
      adminRemarks,
      reviewedByUserId,
      reviewedByName,
      reviewedAt: now,
      activities: [
        ...(dispute.activities ?? []),
        createDisputeActivity({
          label: activityLabel,
          description: adminRemarks || activityDescription,
          createdByRole: "ADMIN",
          createdByName: reviewedByName
        })
      ]
    });
  },

  submitAdditionalEvidence: async ({
    dispute,
    sellerAdditionalRemarks,
    sellerEvidence
  }: {
    dispute: SellerReturnDispute;
    sellerAdditionalRemarks: string;
    sellerEvidence: SellerReturnDisputeEvidence[];
  }): Promise<SellerReturnDispute> => {
    const now = new Date().toISOString();

    const evidenceCount = sellerEvidence.length;
    const evidenceDescription =
      evidenceCount > 0
        ? `Seller submitted ${evidenceCount} evidence file${
            evidenceCount === 1 ? "" : "s"
          } for admin re-review.`
        : "Seller submitted additional remarks for admin re-review.";

    return sellerReturnDisputeService.updateDispute(dispute.id, {
      status: "PENDING_REVIEW",
      sellerEvidence: [...(dispute.sellerEvidence ?? []), ...sellerEvidence],
      sellerAdditionalRemarks,
      sellerRespondedAt: now,
      sellerResponseCount: (dispute.sellerResponseCount ?? 0) + 1,
      activities: [
        ...(dispute.activities ?? []),
        createDisputeActivity({
          label: "Seller Evidence Submitted",
          description: sellerAdditionalRemarks || evidenceDescription,
          createdByRole: "SELLER",
          createdByName: dispute.sellerName
        })
      ]
    });
  },

  deleteDispute: async (disputeDbId: string): Promise<void> => {
    assertValidDeleteId({
      entityType: "sellerReturnDispute",
      id: disputeDbId
    });

    await apiClient.delete<void>(
      `${SELLER_RETURN_DISPUTES_ENDPOINT}/${encodeURIComponent(disputeDbId)}`
    );
  }
};