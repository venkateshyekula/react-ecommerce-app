import type {
  AgentMobileActivityLog,
  AgentMobileAddress,
  AgentMobileCoordinates,
  AgentMobileDashboardData,
  AgentMobileFailureReason,
  AgentMobileProofStatus,
  AgentMobileSummary,
  AgentMobileTask,
  AgentMobileTaskPriority,
  AgentMobileTaskStatus,
  AgentMobileTaskType,
  AgentMobileTaskUpdatePayload
} from "../types/agentMobileExperience";
import { apiClient } from "./apiClient";

const CURRENT_AGENT_ID_STORAGE_KEY = "shopease-current-agent-id";

const GEOLOCATION_TIMEOUT_MS = 15000;
const GEOLOCATION_MAXIMUM_AGE_MS = 30000;

interface AgentAssignmentRecord {
  id: string;
  assignmentId?: string;

  taskType?: string;
  taskId?: string;

  returnRequestId?: string;
  returnRequestDbId?: string;

  orderId?: string;
  orderDbId?: string;

  trackingId?: string;
  awbNumber?: string;

  userId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;

  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;

  latitude?: number;
  longitude?: number;

  destinationCoordinates?: Partial<AgentMobileCoordinates>;
  coordinates?: Partial<AgentMobileCoordinates>;

  agentId?: string;
  agentName?: string;
  agentPhone?: string;
  agentType?: string;

  status?: string;
  priority?: string;

  scheduledDate?: string;
  scheduledAt?: string;
  scheduledSlot?: string;

  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  reachedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  failedAt?: string;

  createdAt?: string;
  updatedAt?: string;

  productName?: string;
  packageCount?: number;
  amountToCollect?: number;

  routeDistanceKm?: number;
  estimatedTravelMinutes?: number;

  customerInstructions?: string;
  internalNotes?: string;
  remarks?: string;

  proofRequired?: boolean;
  proofStatus?: string;
  proofImageUrl?: string;
  proofOtp?: string;
  proofNotes?: string;

  attemptCount?: number;
  failureReason?: AgentMobileFailureReason;
  failureNotes?: string;

  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationAt?: string;
}

interface AgentProfileRecord {
  id: string;
  agentId: string;
  name?: string;
  phone?: string;
  email?: string;
  agentType?: string;
  city?: string;
  status?: string;
}

interface ReturnRequestItemRecord {
  productId?: string;
  name?: string;
  quantity?: number;
  price?: number;
  subtotal?: number;
}

interface ReturnRequestRecord {
  id: string;
  requestId?: string;
  returnRequestId?: string;

  orderId?: string;
  orderDbId?: string;

  userId?: string;
  userName?: string;
  userEmail?: string;

  pickupAddress?: string;
  pickupDate?: string;
  pickupSlot?: string;

  items?: ReturnRequestItemRecord[];

  comments?: string;
  customerComment?: string;
  adminRemarks?: string;

  status?: string;
  pickupStatus?: string;

  pickedUpAt?: string;
  pickupCompletedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface OrderItemRecord {
  productId?: string;
  name?: string;
  quantity?: number;
  price?: number;
  subtotal?: number;
}

interface OrderDeliveryAddressRecord {
  fullName?: string;
  mobile?: string;

  addressLine?: string;
  addressLine1?: string;
  addressLine2?: string;

  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;

  latitude?: number;
  longitude?: number;
}

interface OrderRecord {
  id: string;
  orderId?: string;
  userId?: string;

  items?: OrderItemRecord[];
  deliveryAddress?: OrderDeliveryAddressRecord;

  totalAmount?: number;
  paymentMethod?: string;

  trackingId?: string;
  awbNumber?: string;

  deliveryStatus?: string;
  fulfillmentStatus?: string;
  orderStatus?: string;

  orderDate?: string;
  createdAt?: string;
  updatedAt?: string;
  deliveredAt?: string;
}

interface ExistingProofRecord {
  id: string;
  proofId?: string;

  assignmentId?: string;
  taskId?: string;

  returnRequestId?: string;
  orderId?: string;

  agentId?: string;

  proofUrl?: string;
  proofImageUrl?: string;
  proofOtp?: string;

  otpVerified?: boolean;

  capturedAt?: string;
  deliveredAt?: string;
  createdAt?: string;
}

interface PickupProofRecord {
  id: string;
  proofId: string;

  assignmentId?: string;
  taskId: string;
  returnRequestId?: string;
  orderId?: string;

  agentId: string;
  agentName: string;

  proofType: "PHOTO" | "OTP" | "PHOTO_AND_OTP";

  proofUrl?: string;
  proofImageUrl?: string;
  proofOtp?: string;

  otpVerified: boolean;

  customerRemarks?: string;
  agentRemarks?: string;

  latitude?: number;
  longitude?: number;

  capturedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryProofRecord {
  id: string;
  proofId: string;

  assignmentId?: string;
  taskId: string;
  orderId?: string;

  agentId: string;
  agentName: string;

  proofType: "PHOTO" | "OTP" | "PHOTO_AND_OTP";

  proofUrl?: string;
  proofImageUrl?: string;
  proofOtp?: string;

  otpVerified: boolean;

  customerRemarks?: string;
  agentRemarks?: string;

  latitude?: number;
  longitude?: number;

  deliveredAt: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentTaskLogRecord {
  id: string;
  assignmentId?: string;

  taskType: "RETURN_PICKUP" | "ORDER_DELIVERY";
  taskId: string;

  agentId: string;
  status: string;

  remarks?: string;
  failureReason?: AgentMobileFailureReason;

  proofImageUrl?: string;
  proofOtp?: string;

  latitude?: number;
  longitude?: number;

  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

interface AssignmentPatchRecord {
  status: string;
  updatedAt: string;

  remarks?: string;

  acceptedAt?: string;
  startedAt?: string;
  reachedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  failedAt?: string;

  attemptCount?: number;

  failureReason?: AgentMobileFailureReason | null;
  failureNotes?: string | null;

  proofStatus?: AgentMobileProofStatus;
  proofImageUrl?: string | null;
  proofOtp?: string | null;
  proofNotes?: string | null;

  coordinates?: AgentMobileCoordinates;
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationAt?: string;
}

interface ReturnRequestPatchRecord {
  status?: string;
  pickupStatus?: string;

  pickedUpAt?: string;
  pickupCompletedAt?: string;

  adminRemarks?: string;
  updatedAt: string;
}

interface OrderPatchRecord {
  deliveryStatus?: string;
  fulfillmentStatus?: string;
  orderStatus?: string;

  deliveredAt?: string;
  updatedAt: string;
}

interface NotificationRecord {
  id: string;
  notificationId: string;

  recipientPartnerId: string;
  recipientRole?: "PICKUP_AGENT" | "DELIVERY_AGENT";

  title: string;
  message: string;

  type: "AGENT_TASK";
  category: "AGENT_OPERATIONS";

  severity: "info" | "success" | "warning" | "danger";

  entityType: "AGENT_ASSIGNMENT";
  entityId?: string;
  entityDbId: string;

  actionUrl: string;
  route: string;
  link: string;

  isRead: boolean;

  createdAt: string;
  updatedAt: string;
}

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue || undefined;
};

const normalizeNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return undefined;
};

const parseTimestamp = (value?: string): number => {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsedTime = new Date(value).getTime();
  return Number.isNaN(parsedTime) ? Number.MAX_SAFE_INTEGER : parsedTime;
};

const isValidLatitude = (value: unknown): value is number => {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
};

const isValidLongitude = (value: unknown): value is number => {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
};

const normalizeCoordinates = (
  latitude: unknown,
  longitude: unknown
): AgentMobileCoordinates | undefined => {
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return undefined;
  }

  return { latitude, longitude };
};

const createId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const encodeQueryValue = (value: string): string => {
  return encodeURIComponent(value.trim());
};

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  return error instanceof Error ? error.message : fallbackMessage;
};

const formatEnumLabel = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const normalizeTaskType = (value?: string): AgentMobileTaskType => {
  switch (value) {
    case "ORDER_DELIVERY":
    case "DELIVERY":
      return "DELIVERY";

    case "PROOF_VERIFICATION":
      return "PROOF_VERIFICATION";

    case "SUPPORT_VISIT":
      return "SUPPORT_VISIT";

    case "RETURN_PICKUP":
    default:
      return "RETURN_PICKUP";
  }
};

const normalizeTaskStatus = (value?: string): AgentMobileTaskStatus => {
  switch (value) {
    case "ACCEPTED":
      return "ACCEPTED";

    case "IN_PROGRESS":
    case "OUT_FOR_PICKUP":
    case "OUT_FOR_DELIVERY":
      return "IN_PROGRESS";

    case "REACHED_LOCATION":
    case "ARRIVED":
    case "ARRIVED_AT_LOCATION":
      return "REACHED_LOCATION";

    case "PICKED_UP":
    case "PICKUP_COMPLETED":
      return "PICKED_UP";

    case "DELIVERED":
    case "DELIVERY_COMPLETED":
      return "DELIVERED";

    case "FAILED":
    case "PICKUP_ATTEMPTED":
    case "DELIVERY_ATTEMPTED":
      return "FAILED";

    case "RESCHEDULED":
      return "RESCHEDULED";

    case "COMPLETED":
      return "COMPLETED";

    case "CANCELLED":
      return "CANCELLED";

    case "ASSIGNED":
    case "UNASSIGNED":
    default:
      return "ASSIGNED";
  }
};

const normalizePriority = (value?: string): AgentMobileTaskPriority => {
  switch (value) {
    case "CRITICAL":
      return "CRITICAL";

    case "HIGH":
      return "HIGH";

    case "LOW":
      return "LOW";

    case "MEDIUM":
    default:
      return "MEDIUM";
  }
};

const normalizeProofStatus = (
  proofRequired: boolean,
  value?: string,
  proofExists = false
): AgentMobileProofStatus => {
  if (!proofRequired) {
    return "NOT_REQUIRED";
  }

  if (proofExists) {
    return "SUBMITTED";
  }

  switch (value) {
    case "SUBMITTED":
      return "SUBMITTED";

    case "VERIFIED":
      return "VERIFIED";

    case "REJECTED":
      return "REJECTED";

    case "NOT_REQUIRED":
      return "NOT_REQUIRED";

    case "PENDING":
    default:
      return "PENDING";
  }
};

const getAssignmentStatus = (
  taskType: AgentMobileTaskType,
  nextStatus: AgentMobileTaskStatus
): string => {
  switch (nextStatus) {
    case "IN_PROGRESS":
      if (taskType === "RETURN_PICKUP") {
        return "OUT_FOR_PICKUP";
      }

      if (taskType === "DELIVERY") {
        return "OUT_FOR_DELIVERY";
      }

      return "IN_PROGRESS";

    case "PICKED_UP":
      return "PICKUP_COMPLETED";

    case "DELIVERED":
      return "DELIVERED";

    case "FAILED":
      if (taskType === "RETURN_PICKUP") {
        return "PICKUP_ATTEMPTED";
      }

      if (taskType === "DELIVERY") {
        return "DELIVERY_ATTEMPTED";
      }

      return "FAILED";

    default:
      return nextStatus;
  }
};

const isTerminalStatus = (status: AgentMobileTaskStatus): boolean => {
  return (
    status === "PICKED_UP" ||
    status === "DELIVERED" ||
    status === "COMPLETED" ||
    status === "FAILED" ||
    status === "CANCELLED"
  );
};

const getActionFlags = (
  status: AgentMobileTaskStatus,
  proofRequired: boolean,
  proofStatus: AgentMobileProofStatus
): Pick<
  AgentMobileTask,
  | "canAccept"
  | "canStart"
  | "canMarkReached"
  | "canSubmitProof"
  | "canComplete"
  | "canFail"
> => {
  const proofSubmitted =
    proofStatus === "SUBMITTED" || proofStatus === "VERIFIED";

  return {
    canAccept: status === "ASSIGNED",
    canStart: status === "ACCEPTED",
    canMarkReached: status === "IN_PROGRESS",
    canSubmitProof:
      status === "REACHED_LOCATION" && proofRequired && !proofSubmitted,
    canComplete: status === "REACHED_LOCATION",
    canFail: !isTerminalStatus(status)
  };
};

const getItemDisplayName = (
  items: ReturnRequestItemRecord[] | OrderItemRecord[] | undefined
): string | undefined => {
  const itemNames =
    items
      ?.map((item) => normalizeString(item.name))
      .filter((itemName): itemName is string => Boolean(itemName)) ?? [];

  if (itemNames.length === 0) {
    return undefined;
  }

  if (itemNames.length === 1) {
    return itemNames[0];
  }

  return `${itemNames[0]} + ${itemNames.length - 1} more`;
};

const getPackageCount = (
  items: ReturnRequestItemRecord[] | OrderItemRecord[] | undefined,
  explicitPackageCount?: number
): number => {
  if (
    typeof explicitPackageCount === "number" &&
    explicitPackageCount >= 0
  ) {
    return explicitPackageCount;
  }

  const totalQuantity =
    items?.reduce((total, item) => {
      const quantity = normalizeNumber(item.quantity) ?? 1;
      return total + Math.max(quantity, 0);
    }, 0) ?? 0;

  return Math.max(totalQuantity, 1);
};

const findReturnRequest = (
  records: ReturnRequestRecord[],
  assignment: AgentAssignmentRecord
): ReturnRequestRecord | undefined => {
  return records.find((record) => {
    return (
      record.id === assignment.returnRequestDbId ||
      record.requestId === assignment.returnRequestId ||
      record.returnRequestId === assignment.returnRequestId ||
      record.requestId === assignment.taskId ||
      record.returnRequestId === assignment.taskId
    );
  });
};

const findOrder = (
  records: OrderRecord[],
  assignment: AgentAssignmentRecord
): OrderRecord | undefined => {
  return records.find((record) => {
    return (
      record.id === assignment.orderDbId ||
      record.orderId === assignment.orderId ||
      record.orderId === assignment.taskId
    );
  });
};

const findExistingProof = (
  records: ExistingProofRecord[],
  assignment: AgentAssignmentRecord
): ExistingProofRecord | undefined => {
  return records.find((record) => {
    return (
      record.assignmentId === assignment.assignmentId ||
      record.taskId === assignment.taskId ||
      record.returnRequestId === assignment.returnRequestId ||
      record.returnRequestId === assignment.taskId ||
      record.orderId === assignment.orderId ||
      record.orderId === assignment.taskId
    );
  });
};

const resolveDestinationCoordinates = (
  assignment: AgentAssignmentRecord,
  order?: OrderRecord
): AgentMobileCoordinates | undefined => {
  const directCoordinates = normalizeCoordinates(
    assignment.latitude,
    assignment.longitude
  );

  if (directCoordinates) {
    return directCoordinates;
  }

  const destinationCoordinates = normalizeCoordinates(
    assignment.destinationCoordinates?.latitude,
    assignment.destinationCoordinates?.longitude
  );

  if (destinationCoordinates) {
    return destinationCoordinates;
  }

  return normalizeCoordinates(
    order?.deliveryAddress?.latitude,
    order?.deliveryAddress?.longitude
  );
};

const buildAddress = (
  assignment: AgentAssignmentRecord,
  order?: OrderRecord,
  returnRequest?: ReturnRequestRecord
): AgentMobileAddress => {
  const orderAddress = order?.deliveryAddress;
  const destinationCoordinates = resolveDestinationCoordinates(
    assignment,
    order
  );

  return {
    addressLine1:
      normalizeString(assignment.addressLine1) ??
      normalizeString(orderAddress?.addressLine1) ??
      normalizeString(orderAddress?.addressLine) ??
      normalizeString(assignment.address) ??
      normalizeString(returnRequest?.pickupAddress),

    addressLine2:
      normalizeString(assignment.addressLine2) ??
      normalizeString(orderAddress?.addressLine2),

    city:
      normalizeString(assignment.city) ??
      normalizeString(orderAddress?.city),

    state:
      normalizeString(assignment.state) ??
      normalizeString(orderAddress?.state),

    pincode:
      normalizeString(assignment.pincode) ??
      normalizeString(orderAddress?.pincode),

    landmark:
      normalizeString(assignment.landmark) ??
      normalizeString(orderAddress?.landmark),

    latitude: destinationCoordinates?.latitude,
    longitude: destinationCoordinates?.longitude
  };
};

const calculateSummary = (tasks: AgentMobileTask[]): AgentMobileSummary => {
  return {
    totalTasks: tasks.length,
    assignedTasks: tasks.filter((task) => task.status === "ASSIGNED").length,
    acceptedTasks: tasks.filter((task) => task.status === "ACCEPTED").length,
    inProgressTasks: tasks.filter((task) => task.status === "IN_PROGRESS")
      .length,
    reachedLocationTasks: tasks.filter(
      (task) => task.status === "REACHED_LOCATION"
    ).length,
    completedTasks: tasks.filter(
      (task) =>
        task.status === "PICKED_UP" ||
        task.status === "DELIVERED" ||
        task.status === "COMPLETED"
    ).length,
    failedTasks: tasks.filter((task) => task.status === "FAILED").length,
    proofPendingTasks: tasks.filter(
      (task) => task.proofRequired && task.proofStatus === "PENDING"
    ).length,
    highPriorityTasks: tasks.filter((task) => task.priority === "HIGH").length,
    criticalPriorityTasks: tasks.filter(
      (task) => task.priority === "CRITICAL"
    ).length
  };
};

const mapAssignmentToTask = (
  assignment: AgentAssignmentRecord,
  profiles: AgentProfileRecord[],
  returnRequests: ReturnRequestRecord[],
  orders: OrderRecord[],
  pickupProofs: ExistingProofRecord[],
  deliveryProofs: ExistingProofRecord[]
): AgentMobileTask => {
  const taskType = normalizeTaskType(assignment.taskType);
  const status = normalizeTaskStatus(assignment.status);
  const priority = normalizePriority(assignment.priority);

  const returnRequest = findReturnRequest(returnRequests, assignment);
  const order = findOrder(orders, assignment);
  const profile = profiles.find(
    (record) => record.agentId === assignment.agentId
  );

  const existingProof =
    taskType === "RETURN_PICKUP"
      ? findExistingProof(pickupProofs, assignment)
      : taskType === "DELIVERY"
      ? findExistingProof(deliveryProofs, assignment)
      : undefined;

  const proofRequired =
    typeof assignment.proofRequired === "boolean"
      ? assignment.proofRequired
      : taskType === "RETURN_PICKUP" ||
        taskType === "DELIVERY" ||
        taskType === "PROOF_VERIFICATION";

  const proofStatus = normalizeProofStatus(
    proofRequired,
    assignment.proofStatus,
    Boolean(existingProof)
  );

  const actionFlags = getActionFlags(status, proofRequired, proofStatus);

  const taskId =
    normalizeString(assignment.taskId) ??
    normalizeString(assignment.returnRequestId) ??
    normalizeString(assignment.orderId) ??
    assignment.id;

  const items = returnRequest?.items ?? order?.items;
  const destinationAddress = buildAddress(assignment, order, returnRequest);
  const lastAgentCoordinates = normalizeCoordinates(
    assignment.lastLatitude,
    assignment.lastLongitude
  );

  const proofImageUrl =
    normalizeString(assignment.proofImageUrl) ??
    normalizeString(existingProof?.proofImageUrl) ??
    normalizeString(existingProof?.proofUrl);

  const amountToCollect =
    normalizeNumber(assignment.amountToCollect) ??
    (taskType === "DELIVERY" &&
    order?.paymentMethod === "Cash on Delivery"
      ? normalizeNumber(order.totalAmount)
      : undefined);

  return {
    id: assignment.id,
    taskId,
    assignmentId: normalizeString(assignment.assignmentId),
    agentId: normalizeString(assignment.agentId) ?? "",
    agentName:
      normalizeString(assignment.agentName) ??
      normalizeString(profile?.name) ??
      "Assigned Agent",

    taskType,
    status,
    priority,

    returnRequestId:
      normalizeString(assignment.returnRequestId) ??
      normalizeString(returnRequest?.returnRequestId) ??
      normalizeString(returnRequest?.requestId) ??
      (taskType === "RETURN_PICKUP" ? taskId : undefined),

    orderId:
      normalizeString(assignment.orderId) ??
      normalizeString(order?.orderId) ??
      normalizeString(returnRequest?.orderId),

    trackingId:
      normalizeString(assignment.trackingId) ??
      normalizeString(assignment.awbNumber) ??
      normalizeString(order?.trackingId) ??
      normalizeString(order?.awbNumber),

    customer: {
      customerId:
        normalizeString(assignment.userId) ??
        normalizeString(returnRequest?.userId) ??
        normalizeString(order?.userId),

      customerName:
        normalizeString(assignment.customerName) ??
        normalizeString(returnRequest?.userName) ??
        normalizeString(order?.deliveryAddress?.fullName),

      customerPhone:
        normalizeString(assignment.customerPhone) ??
        normalizeString(order?.deliveryAddress?.mobile),

      customerEmail:
        normalizeString(assignment.customerEmail) ??
        normalizeString(returnRequest?.userEmail)
    },

    address: destinationAddress,
    productName:
      normalizeString(assignment.productName) ?? getItemDisplayName(items),

    packageCount: getPackageCount(
      items,
      normalizeNumber(assignment.packageCount)
    ),

    amountToCollect,

    scheduledAt:
      normalizeString(assignment.scheduledAt) ??
      normalizeString(assignment.scheduledDate) ??
      normalizeString(returnRequest?.pickupDate),

    assignedAt:
      normalizeString(assignment.assignedAt) ??
      normalizeString(assignment.createdAt),

    acceptedAt: normalizeString(assignment.acceptedAt),
    startedAt: normalizeString(assignment.startedAt),
    reachedAt: normalizeString(assignment.reachedAt),
    completedAt: normalizeString(assignment.completedAt),
    failedAt: normalizeString(assignment.failedAt),
    updatedAt: normalizeString(assignment.updatedAt),

    proofRequired,
    proofStatus,
    proofImageUrl,

    proofOtp:
      normalizeString(assignment.proofOtp) ??
      normalizeString(existingProof?.proofOtp),

    proofNotes: normalizeString(assignment.proofNotes),

    attemptCount: normalizeNumber(assignment.attemptCount) ?? 0,
    failureReason: assignment.failureReason,
    failureNotes: normalizeString(assignment.failureNotes),

    routeDistanceKm: normalizeNumber(assignment.routeDistanceKm),
    estimatedTravelMinutes: normalizeNumber(assignment.estimatedTravelMinutes),

    customerInstructions:
      normalizeString(assignment.customerInstructions) ??
      normalizeString(returnRequest?.customerComment) ??
      normalizeString(returnRequest?.comments),

    internalNotes:
      normalizeString(assignment.internalNotes) ??
      normalizeString(assignment.remarks) ??
      normalizeString(returnRequest?.adminRemarks),

    ...actionFlags,
    coordinates: lastAgentCoordinates
  };
};

const safeGet = async <T>(
  endpoint: string,
  fallbackValue: T
): Promise<T> => {
  try {
    return await apiClient.get<T>(endpoint);
  } catch {
    return fallbackValue;
  }
};

const getCurrentAgentId = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const storedAgentId = window.localStorage
    .getItem(CURRENT_AGENT_ID_STORAGE_KEY)
    ?.trim();

  return storedAgentId || undefined;
};

const setCurrentAgentId = (agentId: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedAgentId = agentId.trim();

  if (!normalizedAgentId) {
    window.localStorage.removeItem(CURRENT_AGENT_ID_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    CURRENT_AGENT_ID_STORAGE_KEY,
    normalizedAgentId
  );
};

const clearCurrentAgentId = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CURRENT_AGENT_ID_STORAGE_KEY);
};

const formatDateTime = (value?: string): string => {
  if (!value) {
    return "N/A";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsedDate);
};

const getDashboardData = async (): Promise<AgentMobileDashboardData> => {
  const agentId = getCurrentAgentId();

  const assignmentEndpoint = agentId
    ? `/agentAssignments?agentId=${encodeQueryValue(agentId)}`
    : "/agentAssignments";

  try {
    const [
      assignments,
      profiles,
      returnRequests,
      orders,
      pickupProofs,
      deliveryProofs,
      activityLogs
    ] = await Promise.all([
      apiClient.get<AgentAssignmentRecord[]>(assignmentEndpoint),
      safeGet<AgentProfileRecord[]>("/agentProfiles", []),
      safeGet<ReturnRequestRecord[]>("/returnRequests", []),
      safeGet<OrderRecord[]>("/orders", []),
      safeGet<ExistingProofRecord[]>("/pickupProofs", []),
      safeGet<ExistingProofRecord[]>("/deliveryProofs", []),
      safeGet<AgentMobileActivityLog[]>(
        agentId
          ? `/agentMobileActivityLogs?agentId=${encodeQueryValue(agentId)}`
          : "/agentMobileActivityLogs",
        []
      )
    ]);

    const tasks = assignments
      .filter((assignment) => !agentId || assignment.agentId === agentId)
      .map((assignment) =>
        mapAssignmentToTask(
          assignment,
          profiles,
          returnRequests,
          orders,
          pickupProofs,
          deliveryProofs
        )
      )
      .sort((firstTask, secondTask) => {
        const priorityRank: Record<AgentMobileTaskPriority, number> = {
          CRITICAL: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1
        };

        const priorityDifference =
          priorityRank[secondTask.priority] - priorityRank[firstTask.priority];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        const firstScheduledTime = parseTimestamp(firstTask.scheduledAt);
        const secondScheduledTime = parseTimestamp(secondTask.scheduledAt);

        return firstScheduledTime - secondScheduledTime;
      });

    const sortedActivityLogs = [...activityLogs].sort(
      (firstLog, secondLog) => {
        return parseTimestamp(secondLog.createdAt) - parseTimestamp(firstLog.createdAt);
      }
    );

    return {
      tasks,
      activityLogs: sortedActivityLogs,
      summary: calculateSummary(tasks)
    };
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to load the agent mobile dashboard.")
    );
  }
};

const findAssignment = async (
  task: AgentMobileTask
): Promise<AgentAssignmentRecord> => {
  if (task.id) {
    try {
      return await apiClient.get<AgentAssignmentRecord>(
        `/agentAssignments/${encodeQueryValue(task.id)}`
      );
    } catch {
      // Continue with assignment ID lookup.
    }
  }

  if (task.assignmentId) {
    const assignments = await apiClient.get<AgentAssignmentRecord[]>(
      `/agentAssignments?assignmentId=${encodeQueryValue(task.assignmentId)}`
    );

    if (assignments[0]) {
      return assignments[0];
    }
  }

  const taskAssignments = await apiClient.get<AgentAssignmentRecord[]>(
    `/agentAssignments?taskId=${encodeQueryValue(task.taskId)}`
  );

  if (taskAssignments[0]) {
    return taskAssignments[0];
  }

  throw new Error(`Assignment for task ${task.taskId} was not found.`);
};

const validateUpdatePayload = (
  payload: AgentMobileTaskUpdatePayload
): void => {
  const requiresLiveCoordinates =
    payload.nextStatus === "REACHED_LOCATION" ||
    payload.nextStatus === "PICKED_UP" ||
    payload.nextStatus === "DELIVERED";

  if (requiresLiveCoordinates && !payload.coordinates) {
    throw new Error(
      "Live agent coordinates are required for this task update."
    );
  }

  if (
    payload.coordinates &&
    (!isValidLatitude(payload.coordinates.latitude) ||
      !isValidLongitude(payload.coordinates.longitude))
  ) {
    throw new Error("The captured agent coordinates are invalid.");
  }

  const successfulCompletion =
    payload.nextStatus === "PICKED_UP" ||
    payload.nextStatus === "DELIVERED" ||
    payload.nextStatus === "COMPLETED";

  const hasNewProof =
    Boolean(normalizeString(payload.proofImageUrl)) ||
    Boolean(normalizeString(payload.proofOtp));

  const existingProofAvailable =
    payload.task.proofStatus === "SUBMITTED" ||
    payload.task.proofStatus === "VERIFIED";

  if (
    successfulCompletion &&
    payload.task.proofRequired &&
    !hasNewProof &&
    !existingProofAvailable
  ) {
    throw new Error(
      "Photo proof or customer OTP is required before completing this task."
    );
  }

  if (payload.nextStatus === "FAILED" && !payload.failureReason) {
    throw new Error(
      "Failure reason is required before marking the task as failed."
    );
  }

  if (
    payload.failureReason === "OTHER" &&
    !normalizeString(payload.notes)
  ) {
    throw new Error("Failure notes are required when Other is selected.");
  }
};

const buildAssignmentPatch = (
  assignment: AgentAssignmentRecord,
  payload: AgentMobileTaskUpdatePayload,
  timestamp: string
): AssignmentPatchRecord => {
  const notes = normalizeString(payload.notes);
  const proofImageUrl = normalizeString(payload.proofImageUrl);
  const proofOtp = normalizeString(payload.proofOtp);

  const patch: AssignmentPatchRecord = {
    status: getAssignmentStatus(
      payload.task.taskType,
      payload.nextStatus
    ),
    updatedAt: timestamp,
    remarks:
      notes ?? `Task updated to ${formatEnumLabel(payload.nextStatus)}.`
  };

  switch (payload.nextStatus) {
    case "ACCEPTED":
      patch.acceptedAt = timestamp;
      break;

    case "IN_PROGRESS":
      patch.startedAt = timestamp;
      break;

    case "REACHED_LOCATION":
      patch.reachedAt = timestamp;
      break;

    case "PICKED_UP":
      patch.pickedUpAt = timestamp;
      patch.completedAt = timestamp;
      break;

    case "DELIVERED":
      patch.deliveredAt = timestamp;
      patch.completedAt = timestamp;
      break;

    case "COMPLETED":
      patch.completedAt = timestamp;
      break;

    case "FAILED":
      patch.failedAt = timestamp;
      patch.attemptCount =
        (normalizeNumber(assignment.attemptCount) ??
          payload.task.attemptCount) + 1;
      patch.failureReason = payload.failureReason ?? null;
      patch.failureNotes = notes ?? null;
      break;

    default:
      break;
  }

  if (proofImageUrl || proofOtp) {
    patch.proofStatus = "SUBMITTED";
    patch.proofImageUrl = proofImageUrl ?? null;
    patch.proofOtp = proofOtp ?? null;
    patch.proofNotes = notes ?? null;
  }

  if (payload.coordinates) {
    patch.coordinates = payload.coordinates;
    patch.lastLatitude = payload.coordinates.latitude;
    patch.lastLongitude = payload.coordinates.longitude;
    patch.lastLocationAt = timestamp;
  }

  return patch;
};

const createActivityLog = async (
  payload: AgentMobileTaskUpdatePayload,
  timestamp: string
): Promise<void> => {
  const activityLog: AgentMobileActivityLog = {
    id: createId("agent-mobile-activity-db"),
    logId: createId("AGT-MOB-LOG"),
    taskId: payload.task.taskId,
    agentId: payload.task.agentId,
    action: payload.nextStatus,
    notes: normalizeString(payload.notes),
    failureReason: payload.failureReason,
    proofOtp: normalizeString(payload.proofOtp),
    proofImageUrl: normalizeString(payload.proofImageUrl),
    latitude: payload.coordinates?.latitude,
    longitude: payload.coordinates?.longitude,
    createdAt: timestamp,
    createdBy: payload.task.agentName || payload.task.agentId
  };

  await apiClient.post<AgentMobileActivityLog, AgentMobileActivityLog>(
    "/agentMobileActivityLogs",
    activityLog
  );
};

const createAgentTaskLog = async (
  payload: AgentMobileTaskUpdatePayload,
  timestamp: string
): Promise<void> => {
  const taskLog: AgentTaskLogRecord = {
    id: createId("agent-task-log-db"),
    assignmentId: payload.task.assignmentId,
    taskType:
      payload.task.taskType === "RETURN_PICKUP"
        ? "RETURN_PICKUP"
        : "ORDER_DELIVERY",

    taskId: payload.task.taskId,
    agentId: payload.task.agentId,
    status: getAssignmentStatus(
      payload.task.taskType,
      payload.nextStatus
    ),
    remarks:
      normalizeString(payload.notes) ??
      `Task updated to ${formatEnumLabel(payload.nextStatus)}.`,

    failureReason: payload.failureReason,
    proofImageUrl: normalizeString(payload.proofImageUrl),
    proofOtp: normalizeString(payload.proofOtp),
    latitude: payload.coordinates?.latitude,
    longitude: payload.coordinates?.longitude,
    createdByUserId: payload.task.agentId,
    createdByName: payload.task.agentName,
    createdAt: timestamp
  };

  await apiClient.post<AgentTaskLogRecord, AgentTaskLogRecord>(
    "/agentTaskLogs",
    taskLog
  );
};

const getProofType = (
  proofImageUrl?: string,
  proofOtp?: string
): "PHOTO" | "OTP" | "PHOTO_AND_OTP" => {
  if (proofImageUrl && proofOtp) {
    return "PHOTO_AND_OTP";
  }

  if (proofImageUrl) {
    return "PHOTO";
  }

  return "OTP";
};

const persistPickupProof = async (
  payload: AgentMobileTaskUpdatePayload,
  timestamp: string
): Promise<void> => {
  const proofImageUrl = normalizeString(payload.proofImageUrl);
  const proofOtp = normalizeString(payload.proofOtp);

  if (!proofImageUrl && !proofOtp) {
    return;
  }

  const proofRecord: PickupProofRecord = {
    id: createId("pickup-proof-db"),
    proofId: createId("PKP-PRF"),
    assignmentId: payload.task.assignmentId,
    taskId: payload.task.taskId,
    returnRequestId:
      payload.task.returnRequestId ?? payload.task.taskId,
    orderId: payload.task.orderId,
    agentId: payload.task.agentId,
    agentName: payload.task.agentName,
    proofType: getProofType(proofImageUrl, proofOtp),
    proofUrl: proofImageUrl,
    proofImageUrl,
    proofOtp,
    otpVerified: Boolean(proofOtp),
    customerRemarks: normalizeString(payload.notes),
    agentRemarks:
      normalizeString(payload.notes) ??
      "Return pickup proof submitted by the pickup agent.",
    latitude: payload.coordinates?.latitude,
    longitude: payload.coordinates?.longitude,
    capturedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await apiClient.post<PickupProofRecord, PickupProofRecord>(
    "/pickupProofs",
    proofRecord
  );
};

const persistDeliveryProof = async (
  payload: AgentMobileTaskUpdatePayload,
  timestamp: string
): Promise<void> => {
  const proofImageUrl = normalizeString(payload.proofImageUrl);
  const proofOtp = normalizeString(payload.proofOtp);

  if (!proofImageUrl && !proofOtp) {
    return;
  }

  const proofRecord: DeliveryProofRecord = {
    id: createId("delivery-proof-db"),
    proofId: createId("DLY-PRF"),
    assignmentId: payload.task.assignmentId,
    taskId: payload.task.taskId,
    orderId: payload.task.orderId,
    agentId: payload.task.agentId,
    agentName: payload.task.agentName,
    proofType: getProofType(proofImageUrl, proofOtp),
    proofUrl: proofImageUrl,
    proofImageUrl,
    proofOtp,
    otpVerified: Boolean(proofOtp),
    customerRemarks: normalizeString(payload.notes),
    agentRemarks:
      normalizeString(payload.notes) ??
      "Delivery proof submitted by the delivery agent.",
    latitude: payload.coordinates?.latitude,
    longitude: payload.coordinates?.longitude,
    deliveredAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await apiClient.post<DeliveryProofRecord, DeliveryProofRecord>(
    "/deliveryProofs",
    proofRecord
  );
};

const persistProof = async (
  payload: AgentMobileTaskUpdatePayload,
  timestamp: string
): Promise<void> => {
  const hasProof =
    Boolean(normalizeString(payload.proofImageUrl)) ||
    Boolean(normalizeString(payload.proofOtp));

  if (!hasProof) {
    return;
  }

  if (payload.task.taskType === "RETURN_PICKUP") {
    await persistPickupProof(payload, timestamp);
    return;
  }

  if (payload.task.taskType === "DELIVERY") {
    await persistDeliveryProof(payload, timestamp);
  }
};

const synchronizeReturnRequest = async (
  payload: AgentMobileTaskUpdatePayload,
  timestamp: string
): Promise<void> => {
  if (
    payload.task.taskType !== "RETURN_PICKUP" ||
    !payload.task.returnRequestId
  ) {
    return;
  }

  let returnRequests = await apiClient.get<ReturnRequestRecord[]>(
    `/returnRequests?returnRequestId=${encodeQueryValue(
      payload.task.returnRequestId
    )}`
  );

  if (returnRequests.length === 0) {
    returnRequests = await apiClient.get<ReturnRequestRecord[]>(
      `/returnRequests?requestId=${encodeQueryValue(
        payload.task.returnRequestId
      )}`
    );
  }

  const returnRequest = returnRequests[0];

  if (!returnRequest) {
    return;
  }

  let patch: ReturnRequestPatchRecord | undefined;

  switch (payload.nextStatus) {
    case "IN_PROGRESS":
      patch = {
        status: "PICKUP_SCHEDULED",
        pickupStatus: "OUT_FOR_PICKUP",
        adminRemarks:
          normalizeString(payload.notes) ??
          "Pickup agent started the return pickup.",
        updatedAt: timestamp
      };
      break;

    case "PICKED_UP":
      patch = {
        status: "QUALITY_CHECK_PENDING",
        pickupStatus: "PICKED_UP",
        pickedUpAt: timestamp,
        pickupCompletedAt: timestamp,
        adminRemarks:
          normalizeString(payload.notes) ??
          "Return package picked up successfully.",
        updatedAt: timestamp
      };
      break;

    case "FAILED":
      patch = {
        status: "PICKUP_SCHEDULED",
        pickupStatus: "PICKUP_ATTEMPTED",
        adminRemarks:
          normalizeString(payload.notes) ??
          `Pickup attempt failed: ${
            payload.failureReason ?? "Reason not provided"
          }.`,
        updatedAt: timestamp
      };
      break;

    case "RESCHEDULED":
      patch = {
        status: "PICKUP_SCHEDULED",
        pickupStatus: "RESCHEDULED",
        adminRemarks:
          normalizeString(payload.notes) ??
          "Return pickup was rescheduled.",
        updatedAt: timestamp
      };
      break;

    default:
      return;
  }

  await apiClient.patch<ReturnRequestRecord, ReturnRequestPatchRecord>(
    `/returnRequests/${encodeQueryValue(returnRequest.id)}`,
    patch
  );
};

const synchronizeOrder = async (
  payload: AgentMobileTaskUpdatePayload,
  timestamp: string
): Promise<void> => {
  if (
    payload.task.taskType !== "DELIVERY" ||
    !payload.task.orderId
  ) {
    return;
  }

  const orders = await apiClient.get<OrderRecord[]>(
    `/orders?orderId=${encodeQueryValue(payload.task.orderId)}`
  );

  const order = orders[0];

  if (!order) {
    return;
  }

  let patch: OrderPatchRecord | undefined;

  switch (payload.nextStatus) {
    case "IN_PROGRESS":
      patch = {
        deliveryStatus: "OUT_FOR_DELIVERY",
        fulfillmentStatus: "OUT_FOR_DELIVERY",
        orderStatus: "Out for Delivery",
        updatedAt: timestamp
      };
      break;

    case "DELIVERED":
      patch = {
        deliveryStatus: "DELIVERED",
        fulfillmentStatus: "DELIVERED",
        orderStatus: "Delivered",
        deliveredAt: timestamp,
        updatedAt: timestamp
      };
      break;

    case "FAILED":
      patch = {
        deliveryStatus: "DELIVERY_ATTEMPTED",
        fulfillmentStatus: "DELIVERY_ATTEMPTED",
        orderStatus: "Delivery Attempted",
        updatedAt: timestamp
      };
      break;

    case "RESCHEDULED":
      patch = {
        deliveryStatus: "RESCHEDULED",
        fulfillmentStatus: "DELIVERY_ASSIGNED",
        orderStatus: "Delivery Rescheduled",
        updatedAt: timestamp
      };
      break;

    default:
      return;
  }

  await apiClient.patch<OrderRecord, OrderPatchRecord>(
    `/orders/${encodeQueryValue(order.id)}`,
    patch
  );
};

const createNotification = async (
  assignment: AgentAssignmentRecord,
  payload: AgentMobileTaskUpdatePayload,
  timestamp: string
): Promise<void> => {
  const getSeverity = (): NotificationRecord["severity"] => {
    switch (payload.nextStatus) {
      case "FAILED":
      case "CANCELLED":
        return "danger";

      case "RESCHEDULED":
        return "warning";

      case "PICKED_UP":
      case "DELIVERED":
      case "COMPLETED":
        return "success";

      default:
        return "info";
    }
  };

  const notification: NotificationRecord = {
    id: createId("notification-agent-mobile-db"),
    notificationId: createId("AGT-MOB-NOTIF"),
    recipientPartnerId: payload.task.agentId,
    recipientRole:
      payload.task.taskType === "RETURN_PICKUP"
        ? "PICKUP_AGENT"
        : payload.task.taskType === "DELIVERY"
        ? "DELIVERY_AGENT"
        : undefined,

    title: "Agent task updated",
    message: `Task ${payload.task.taskId} was updated to ${formatEnumLabel(
      payload.nextStatus
    )}.`,

    type: "AGENT_TASK",
    category: "AGENT_OPERATIONS",
    severity: getSeverity(),
    entityType: "AGENT_ASSIGNMENT",
    entityId: assignment.assignmentId,
    entityDbId: assignment.id,
    actionUrl: "/agent/mobile",
    route: "/agent/mobile",
    link: "/agent/mobile",
    isRead: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await apiClient.post<NotificationRecord, NotificationRecord>(
    "/notifications",
    notification
  );
};

const updateTaskStatus = async (
  payload: AgentMobileTaskUpdatePayload
): Promise<AgentMobileTask> => {
  validateUpdatePayload(payload);

  const timestamp = new Date().toISOString();

  try {
    const assignment = await findAssignment(payload.task);

    if (
      assignment.agentId &&
      payload.task.agentId &&
      assignment.agentId !== payload.task.agentId
    ) {
      throw new Error("This task is assigned to a different agent.");
    }

    const assignmentPatch = buildAssignmentPatch(
      assignment,
      payload,
      timestamp
    );

    const updatedAssignment = await apiClient.patch<
      AgentAssignmentRecord,
      AssignmentPatchRecord
    >(
      `/agentAssignments/${encodeQueryValue(assignment.id)}`,
      assignmentPatch
    );

    await persistProof(payload, timestamp);
    await createActivityLog(payload, timestamp);
    await createAgentTaskLog(payload, timestamp);
    await synchronizeReturnRequest(payload, timestamp);
    await synchronizeOrder(payload, timestamp);
    await createNotification(updatedAssignment, payload, timestamp);

    const [profiles, returnRequests, orders, pickupProofs, deliveryProofs] =
      await Promise.all([
        safeGet<AgentProfileRecord[]>("/agentProfiles", []),
        safeGet<ReturnRequestRecord[]>("/returnRequests", []),
        safeGet<OrderRecord[]>("/orders", []),
        safeGet<ExistingProofRecord[]>("/pickupProofs", []),
        safeGet<ExistingProofRecord[]>("/deliveryProofs", [])
      ]);

    return mapAssignmentToTask(
      updatedAssignment,
      profiles,
      returnRequests,
      orders,
      pickupProofs,
      deliveryProofs
    );
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        `Unable to update task ${payload.task.taskId}.`
      )
    );
  }
};

export const getCurrentCoordinates = (): Promise<AgentMobileCoordinates> => {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = normalizeCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );

        if (!coordinates) {
          reject(
            new Error("The browser returned invalid location coordinates.")
          );
          return;
        }

        resolve(coordinates);
      },
      (geolocationError) => {
        switch (geolocationError.code) {
          case geolocationError.PERMISSION_DENIED:
            reject(
              new Error(
                "Location permission was denied. Enable location access and try again."
              )
            );
            break;

          case geolocationError.POSITION_UNAVAILABLE:
            reject(new Error("The current location is unavailable."));
            break;

          case geolocationError.TIMEOUT:
            reject(new Error("The location request timed out. Try again."));
            break;

          default:
            reject(new Error("Unable to determine the current location."));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: GEOLOCATION_MAXIMUM_AGE_MS
      }
    );
  });
};

export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (typeof Notification === "undefined") {
      throw new Error("Browser notifications are not supported.");
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    // Handles promise-based and legacy callback-based implementations (e.g., Safari)
    const result = Notification.requestPermission();
    if (result && typeof (result as Promise<NotificationPermission>).then === "function") {
      return await result;
    }

    return new Promise((resolve) => {
      Notification.requestPermission((permission) => resolve(permission));
    });
  };

export const showLocalNotification = (
  title: string,
  options?: NotificationOptions
): void => {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    new Notification(title, options);
  } catch {
    // Failure must not block core workflow
  }
};

export const agentMobileExperienceService = {
  getCurrentAgentId,
  setCurrentAgentId,
  clearCurrentAgentId,
  getDashboardData,
  updateTaskStatus,
  formatDateTime
};