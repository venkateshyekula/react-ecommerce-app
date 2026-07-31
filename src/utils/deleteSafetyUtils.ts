export type DeleteEntityType =
  | "notification"
  | "supportTicket"
  | "address"
  | "product"
  | "coupon"
  | "couponRedemption"
  | "review"
  | "question"
  | "user"
  | "walletTransaction"
  | "rewardRule"
  | "rewardTransaction"
  | "returnRequest"
  | "refund"
  | "order"
  | "deliveryZone"
  | "warehouse"
  | "deliverySlaRule"
  | "sellerFulfillmentMapping"
  | "returnPolicyRule"
  | "sellerReturnDispute"
  | "inventoryRestockLog"
  | "openBoxInventoryItem"
  | "damagedReturnInventoryItem"
  | "agentAssignment"
  | "agentTaskLog"
  | "pickupProof"
  | "deliveryProof";

interface DeleteIdRule {
  prefixes?: string[];
  allowNumeric?: boolean;
}

const deleteIdRules: Record<DeleteEntityType, DeleteIdRule> = {
  notification: {
    prefixes: ["notification-"]
  },

  supportTicket: {
    prefixes: ["support-ticket-"]
  },

  address: {
    prefixes: ["address-"]
  },

  product: {
    prefixes: ["prod-"]
  },

  coupon: {
    prefixes: ["coupon-"]
  },

  couponRedemption: {
    prefixes: ["coupon-redemption-", "coupon-redemptions-", "redemption-"]
  },

  review: {
    prefixes: ["review-"]
  },

  question: {
    prefixes: ["question-"]
  },

  user: {
    prefixes: ["user-", "admin-", "seller-", "support-"]
  },

  walletTransaction: {
    prefixes: ["wallet-", "wallet-db-"]
  },

  rewardRule: {
    prefixes: ["reward-rule-"]
  },

  rewardTransaction: {
    prefixes: ["reward-", "reward-db-"]
  },

  returnRequest: {
    prefixes: ["return-", "return-request-"]
  },

  refund: {
    prefixes: ["refund-"]
  },

  order: {
    prefixes: ["order-", "ORD-"]
  },

  deliveryZone: {
    allowNumeric: true
  },

  warehouse: {
    allowNumeric: true
  },

  deliverySlaRule: {
    allowNumeric: true
  },

  sellerFulfillmentMapping: {
    allowNumeric: true
  },

  returnPolicyRule: {
    allowNumeric: true
  },
  sellerReturnDispute: {
    prefixes: ["seller-dispute-db-", "SRD-"]
  },

  inventoryRestockLog: {
    prefixes: ["restock-log-db-", "RSTK-"]
  },

  openBoxInventoryItem: {
    prefixes: ["open-box-db-", "OBX-"]
  },

  damagedReturnInventoryItem: {
    prefixes: ["damaged-return-db-", "DMG-"]
  },
  agentAssignment: {
    prefixes: ["agent-assignment-db-", "AGT-ASG-"]
  },

  agentTaskLog: {
    prefixes: ["agent-task-log-db-"]
  },

  pickupProof: {
    prefixes: ["pickup-proof-db-", "PKP-PRF-"]
  },

  deliveryProof: {
    prefixes: ["delivery-proof-db-", "DLY-PRF-"]
  }
};

const normalizeDeleteId = (id: string | number): string => {
  return String(id).trim();
};

const isNumericId = (id: string): boolean => {
  return /^\d+$/.test(id);
};

const getExpectedIdMessage = (rule: DeleteIdRule): string => {
  const expectedParts: string[] = [];

  if (rule.prefixes?.length) {
    expectedParts.push(`prefix: ${rule.prefixes.join(" or ")}`);
  }

  if (rule.allowNumeric) {
    expectedParts.push("numeric id");
  }

  return expectedParts.join(" or ");
};

export const assertValidDeleteId = ({
  entityType,
  id
}: {
  entityType: DeleteEntityType;
  id: string | number;
}): void => {
  const normalizedId = normalizeDeleteId(id);
  const rule = deleteIdRules[entityType];

  if (!normalizedId) {
    throw new Error(`Invalid ${entityType} delete id. Id is required.`);
  }

  const hasValidPrefix =
    rule.prefixes?.some((prefix) => normalizedId.startsWith(prefix)) ?? false;

  const hasValidNumericId = Boolean(rule.allowNumeric) && isNumericId(normalizedId);

  if (!hasValidPrefix && !hasValidNumericId) {
    throw new Error(
      `Invalid ${entityType} delete id "${normalizedId}". Expected ${getExpectedIdMessage(
        rule
      )}.`
    );
  }
};

export const isValidDeleteId = ({
  entityType,
  id
}: {
  entityType: DeleteEntityType;
  id: string | number;
}): boolean => {
  try {
    assertValidDeleteId({
      entityType,
      id
    });

    return true;
  } catch {
    return false;
  }
};