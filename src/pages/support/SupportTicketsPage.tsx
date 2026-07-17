import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import SupportAttachmentPreview from "../../components/support/SupportAttachmentPreview";
import SupportConversationThread from "../../components/support/SupportConversationThread";
import SupportInvestigationPanel from "../../components/support/SupportInvestigationPanel";
import SupportEscalationPanel from "../../components/support/SupportEscalationPanel";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { customerSupportService } from "../../services/customerSupportService";
import { notificationService } from "../../services/notificationService";
import { couponRedemptionService } from "../../services/couponRedemptionService";
import { orderService } from "../../services/orderService";
import { paymentTransactionService } from "../../services/paymentTransactionService";
import { rewardService } from "../../services/rewardService";
import { walletService } from "../../services/walletService";
import { supportEscalationService } from "../../services/supportEscalationService";
import { supportTeamService } from "../../services/supportTeamService";
import type { CouponRedemption } from "../../types/couponRedemption";
import type { Order } from "../../types/order";
import type { PaymentTransaction } from "../../types/payment";
import type { RewardTransaction } from "../../types/rewards";
import type { WalletTransaction } from "../../types/wallet";
import type { SupportTeamMember } from "../../types/supportTeam";
import type {
  CreateSupportEscalationPayload,
  SupportEscalation,
  SupportEscalationStatus,
  SupportEscalationTeam,
} from "../../types/supportEscalation";
import type {
  CustomerSupportTicket,
  SupportTicketAttachment,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "../../types/customerSupport";
import {
  createSupportTicketActivity,
  createSupportTicketMessage,
  getNextStatusAfterSupportReply,
  getTicketActivities,
  getTicketMessages,
} from "../../utils/supportTicketUtils";
import {
  createCustomerSupportReplyNotification,
  createCustomerTicketStatusNotification,
} from "../../utils/supportNotificationUtils";
import {
  buildSupportSlaSummary,
  calculateSlaDueAt,
  getSlaBadgeClass,
  getSlaLabel,
  getSupportSlaState,
  getTicketSlaDueAt,
  normalizeSupportTicketSla,
  shouldAutoEscalateTicket,
} from "../../utils/supportSlaUtils";
import {
  convertFileToSupportAttachment,
  SUPPORT_ATTACHMENT_MAX_COUNT,
} from "../../utils/supportAttachmentUtils";
import {
  hasActiveEscalation,
  suggestEscalationTeam,
} from "../../utils/supportEscalationUtils";
import { buildSupportInvestigation } from "../../utils/supportInvestigationUtils";
import {
  getSupportTeamTextGuidance,
  getSupportTicketAccessPolicy,
} from "../../utils/supportTicketAccessUtils";
import { refundService } from "../../services/refundService";
import { RefundRequest } from "../../types/refund";

type TicketStatusFilter = "ALL" | SupportTicketStatus;
type TicketPriorityFilter = "ALL" | SupportTicketPriority;
type TicketCategoryFilter = "ALL" | SupportTicketCategory;

type TicketSlaFilter =
  | "ALL"
  | "OVERDUE"
  | "DUE_TODAY"
  | "BREACH_SOON"
  | "ESCALATED";

type SupportTimelineItemType =
  | "TICKET_CREATED"
  | "STATUS_UPDATE"
  | "CUSTOMER_MESSAGE"
  | "SUPPORT_MESSAGE"
  | "SYSTEM";

interface SupportTimelineItem {
  id: string;
  label: string;
  description: string;
  actorName: string;
  createdAt: string;
  type: SupportTimelineItemType;
}

const statusOptions: Array<{
  label: string;
  value: SupportTicketStatus;
}> = [
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

const categoryOptions: Array<{
  label: string;
  value: SupportTicketCategory;
}> = [
  { label: "Order", value: "ORDER" },
  { label: "Return / Refund", value: "RETURN_REFUND" },
  { label: "Payment", value: "PAYMENT" },
  { label: "Wallet / Rewards", value: "WALLET_REWARDS" },
  { label: "Coupon", value: "COUPON" },
  { label: "Account", value: "ACCOUNT" },
  { label: "Delivery", value: "DELIVERY" },
  { label: "Other", value: "OTHER" },
];

const priorityOptions: Array<{
  label: string;
  value: SupportTicketPriority;
}> = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Urgent", value: "URGENT" },
];

const MIN_SUPPORT_REPLY_LENGTH = 2;
const MAX_SUPPORT_REPLY_LENGTH = 1500;
const MAX_INTERNAL_NOTE_LENGTH = 1000;

const validSupportStatuses = statusOptions.map((option) => option.value);

const getStatusBadgeClass = (status: SupportTicketStatus): string => {
  switch (status) {
    case "OPEN":
      return "text-bg-warning";

    case "IN_PROGRESS":
      return "text-bg-info";

    case "ON_HOLD":
      return "text-bg-secondary";

    case "RESOLVED":
      return "text-bg-success";

    case "CLOSED":
      return "text-bg-dark";

    default:
      return "text-bg-light";
  }
};

const getPriorityBadgeClass = (priority: SupportTicketPriority): string => {
  switch (priority) {
    case "URGENT":
      return "text-bg-danger";

    case "HIGH":
      return "text-bg-warning";

    case "MEDIUM":
      return "text-bg-info";

    case "LOW":
    default:
      return "text-bg-light border";
  }
};

const formatLabel = (value: string): string => {
  if (!value) {
    return "";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const isMessageLikeActivity = (label: string): boolean => {
  const normalizedLabel = label.toLowerCase();

  return (
    normalizedLabel.includes("support replied") ||
    normalizedLabel.includes("customer replied")
  );
};

const getSupportTimelineItems = (
  ticket: CustomerSupportTicket,
): SupportTimelineItem[] => {
  const activityItems: SupportTimelineItem[] = getTicketActivities(ticket)
    .filter((activity) => !isMessageLikeActivity(activity.label))
    .map((activity) => ({
      id: `activity-${activity.id}`,
      label: activity.label,
      description: activity.description,
      actorName:
        activity.createdByRole === "SUPPORT"
          ? (ticket.assignedToSupportName ?? "Support Team")
          : activity.createdByRole === "CUSTOMER"
            ? ticket.userName
            : "ShopEase System",
      createdAt: activity.createdAt,
      type: activity.label.toLowerCase().includes("created")
        ? "TICKET_CREATED"
        : activity.label.toLowerCase().includes("status") ||
            activity.label.toLowerCase().includes("updated")
          ? "STATUS_UPDATE"
          : "SYSTEM",
    }));

  const messageItems: SupportTimelineItem[] = getTicketMessages(ticket).map(
    (message) => ({
      id: `message-${message.id}`,
      label:
        message.authorRole === "SUPPORT"
          ? "Support Agent Replied"
          : message.authorRole === "CUSTOMER"
            ? "Customer Replied"
            : "System Message",
      description: message.message,
      actorName: message.authorName,
      createdAt: message.createdAt,
      type:
        message.authorRole === "SUPPORT"
          ? "SUPPORT_MESSAGE"
          : message.authorRole === "CUSTOMER"
            ? "CUSTOMER_MESSAGE"
            : "SYSTEM",
    }),
  );

  const timelineItems = [...activityItems, ...messageItems].sort(
    (firstItem, secondItem) =>
      new Date(firstItem.createdAt).getTime() -
      new Date(secondItem.createdAt).getTime(),
  );

  const uniqueTimelineItems = new Map<string, SupportTimelineItem>();

  timelineItems.forEach((item) => {
    const uniqueKey = `${item.label}-${item.description}-${item.createdAt}`;

    if (!uniqueTimelineItems.has(uniqueKey)) {
      uniqueTimelineItems.set(uniqueKey, item);
    }
  });

  return Array.from(uniqueTimelineItems.values());
};

const getTimelineIconClass = (type: SupportTimelineItemType): string => {
  switch (type) {
    case "TICKET_CREATED":
      return "bi bi-ticket-detailed";

    case "CUSTOMER_MESSAGE":
      return "bi bi-person-lines-fill";

    case "SUPPORT_MESSAGE":
      return "bi bi-headset";

    case "STATUS_UPDATE":
      return "bi bi-arrow-repeat";

    case "SYSTEM":
    default:
      return "bi bi-info-circle";
  }
};

const getTimelineStepClass = (
  type: SupportTimelineItemType,
  index: number,
  totalItems: number,
): string => {
  const stateClass = index === totalItems - 1 ? "active" : "completed";

  switch (type) {
    case "SUPPORT_MESSAGE":
      return `${stateClass} support`;

    case "CUSTOMER_MESSAGE":
      return `${stateClass} customer`;

    case "STATUS_UPDATE":
      return `${stateClass} status`;

    case "TICKET_CREATED":
      return `${stateClass} created`;

    case "SYSTEM":
    default:
      return `${stateClass} system`;
  }
};

const getTimelineStepDescription = (type: SupportTimelineItemType): string => {
  switch (type) {
    case "TICKET_CREATED":
      return "Support ticket has been created and is waiting for review.";

    case "SUPPORT_MESSAGE":
      return "Support team added a reply for the customer.";

    case "CUSTOMER_MESSAGE":
      return "Customer added more information to the ticket.";

    case "STATUS_UPDATE":
      return "Ticket status was updated by the support workflow.";

    case "SYSTEM":
    default:
      return "Ticket activity was recorded.";
  }
};

const validateSupportTicketUpdate = ({
  selectedTicket,
  nextStatus,
  replyText,
  internalNote,
  attachmentCount,
}: {
  selectedTicket: CustomerSupportTicket;
  nextStatus: SupportTicketStatus;
  replyText: string;
  internalNote: string;
  attachmentCount: number;
}): string | null => {
  const trimmedReply = replyText.trim();
  const trimmedInternalNote = internalNote.trim();
  const statusChanged = selectedTicket.status !== nextStatus;
  const internalNoteChanged =
    (selectedTicket.internalNote ?? "") !== trimmedInternalNote;
  const hasReplyContent = trimmedReply.length > 0 || attachmentCount > 0;

  if (!validSupportStatuses.includes(nextStatus)) {
    return "Please select a valid ticket status.";
  }

  if (
    trimmedReply.length > 0 &&
    trimmedReply.length < MIN_SUPPORT_REPLY_LENGTH
  ) {
    return `Support reply should be at least ${MIN_SUPPORT_REPLY_LENGTH} characters.`;
  }

  if (trimmedReply.length > MAX_SUPPORT_REPLY_LENGTH) {
    return `Support reply should not exceed ${MAX_SUPPORT_REPLY_LENGTH} characters.`;
  }

  if (trimmedInternalNote.length > MAX_INTERNAL_NOTE_LENGTH) {
    return `Internal note should not exceed ${MAX_INTERNAL_NOTE_LENGTH} characters.`;
  }

  if (!statusChanged && !hasReplyContent && !internalNoteChanged) {
    return "Please update status, add a reply, attach evidence, or change the internal note before saving.";
  }

  if (
    nextStatus === "RESOLVED" &&
    !hasReplyContent &&
    !selectedTicket.supportReply
  ) {
    return "Please add a support reply before resolving the ticket.";
  }

  return null;
};

const SupportTicketsPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<CustomerSupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] =
    useState<CustomerSupportTicket | null>(null);

  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState<TicketPriorityFilter>("ALL");
  const [categoryFilter, setCategoryFilter] =
    useState<TicketCategoryFilter>("ALL");
  const [slaFilter, setSlaFilter] = useState<TicketSlaFilter>("ALL");

  const [replyText, setReplyText] = useState<string>("");
  const [replyAttachments, setReplyAttachments] = useState<
    SupportTicketAttachment[]
  >([]);
  const [internalNote, setInternalNote] = useState<string>("");
  const [nextStatus, setNextStatus] =
    useState<SupportTicketStatus>("IN_PROGRESS");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingTicketId, setUpdatingTicketId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [investigationOrder, setInvestigationOrder] = useState<Order | null>(
    null,
  );
  const [
    investigationPaymentTransactions,
    setInvestigationPaymentTransactions,
  ] = useState<PaymentTransaction[]>([]);
  const [investigationWalletTransactions, setInvestigationWalletTransactions] =
    useState<WalletTransaction[]>([]);
  const [investigationRewardTransactions, setInvestigationRewardTransactions] =
    useState<RewardTransaction[]>([]);
  const [investigationCouponRedemptions, setInvestigationCouponRedemptions] =
    useState<CouponRedemption[]>([]);
  const [investigationRefundRequests, setInvestigationRefundRequests] =
    useState<RefundRequest[]>([]);  
  const [isInvestigationLoading, setIsInvestigationLoading] =
    useState<boolean>(false);

  const [ticketEscalations, setTicketEscalations] = useState<
    SupportEscalation[]
  >([]);
  const [isEscalationLoading, setIsEscalationLoading] =
    useState<boolean>(false);
  const [isEscalationSaving, setIsEscalationSaving] = useState<boolean>(false);
  const [currentTeamMember, setCurrentTeamMember] =
    useState<SupportTeamMember | null>(null);
  const [teamScopedTicketIds, setTeamScopedTicketIds] = useState<Set<string>>(
    new Set(),
  );

  const loadTickets = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await customerSupportService.getTickets();

      const normalizedTickets = data.map((ticket) =>
        normalizeSupportTicketSla(ticket),
      );

      setTickets(
        [...normalizedTickets].sort(
          (first, second) =>
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime(),
        ),
      );
    } catch {
      setErrorMessage(
        "Unable to load support tickets. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetInvestigationDetails = useCallback((): void => {
    setInvestigationOrder(null);
    setInvestigationPaymentTransactions([]);
    setInvestigationWalletTransactions([]);
    setInvestigationRewardTransactions([]);
    setInvestigationCouponRedemptions([]);
    setInvestigationRefundRequests([]);
  }, []);

  const loadInvestigationDetails = useCallback(
  async (ticket: CustomerSupportTicket): Promise<void> => {
    try {
      setIsInvestigationLoading(true);
      resetInvestigationDetails();

      const [
        userPaymentTransactions,
        userWalletTransactions,
        userRewardTransactions,
        userCouponRedemptions,
        userRefundRequests,
      ] = await Promise.all([
        paymentTransactionService.getTransactionsByUserId(ticket.userId),
        walletService.getTransactionsByUserId(ticket.userId),
        rewardService.getTransactionsByUserId(ticket.userId),
        couponRedemptionService.getRedemptionsByUserId(ticket.userId),
        refundService.getRefundRequestsByUserId(ticket.userId),
      ]);

      let relatedOrder: Order | null = null;

      if (ticket.orderId) {
        relatedOrder = await orderService.getOrderByOrderId(ticket.orderId);
      }

      const filteredPaymentTransactions = ticket.orderId
        ? userPaymentTransactions.filter(
            (transaction) =>
              transaction.orderId === ticket.orderId ||
              transaction.issueFlag === "ORDER_NOT_CREATED" ||
              transaction.issueFlag === "DUPLICATE_DEBIT" ||
              transaction.status === "REFUND_REQUIRED",
          )
        : userPaymentTransactions;

      const filteredWalletTransactions = ticket.orderId
        ? userWalletTransactions.filter(
            (transaction) => transaction.orderId === ticket.orderId,
          )
        : userWalletTransactions;

      const filteredRewardTransactions = ticket.orderId
        ? userRewardTransactions.filter(
            (transaction) => transaction.orderId === ticket.orderId,
          )
        : userRewardTransactions;

      const filteredCouponRedemptions = ticket.orderId
        ? userCouponRedemptions.filter(
            (redemption) => redemption.orderId === ticket.orderId,
          )
        : userCouponRedemptions;

      const paymentIds = new Set(
        filteredPaymentTransactions.map((transaction) => transaction.paymentId),
      );

      const filteredRefundRequests = userRefundRequests.filter(
        (refundRequest) => {
          const matchesOrder =
            Boolean(ticket.orderId) && refundRequest.orderId === ticket.orderId;

          const matchesPayment = paymentIds.has(refundRequest.paymentId);

          const matchesUnlinkedIssue =
            !refundRequest.orderId &&
            filteredPaymentTransactions.some(
              (transaction) =>
                transaction.paymentId === refundRequest.paymentId &&
                (transaction.issueFlag === "ORDER_NOT_CREATED" ||
                  transaction.issueFlag === "DUPLICATE_DEBIT" ||
                  transaction.status === "REFUND_REQUIRED"),
            );

          return matchesOrder || matchesPayment || matchesUnlinkedIssue;
        },
      );

      setInvestigationOrder(relatedOrder);
      setInvestigationPaymentTransactions(filteredPaymentTransactions);
      setInvestigationWalletTransactions(filteredWalletTransactions);
      setInvestigationRewardTransactions(filteredRewardTransactions);
      setInvestigationCouponRedemptions(filteredCouponRedemptions);
      setInvestigationRefundRequests(filteredRefundRequests);
    } catch {
      resetInvestigationDetails();

      showToast(
        "Investigation load failed",
        "Unable to load related order/payment details for this ticket.",
        "warning",
      );
    } finally {
      setIsInvestigationLoading(false);
    }
  },
  [resetInvestigationDetails, showToast],
);

  const resetEscalationDetails = useCallback((): void => {
    setTicketEscalations([]);
  }, []);

  const loadEscalationDetails = useCallback(
    async (ticket: CustomerSupportTicket): Promise<void> => {
      try {
        setIsEscalationLoading(true);

        const data = await supportEscalationService.getEscalationsByTicketDbId(
          ticket.id,
        );

        setTicketEscalations(data);
      } catch {
        setTicketEscalations([]);

        showToast(
          "Escalation load failed",
          "Unable to load escalation details for this ticket.",
          "warning",
        );
      } finally {
        setIsEscalationLoading(false);
      }
    },
    [showToast],
  );

  const loadCurrentTeamScope = useCallback(async (): Promise<void> => {
    if (!currentUser || currentUser.role !== "SUPPORT") {
      setCurrentTeamMember(null);
      setTeamScopedTicketIds(new Set());
      return;
    }

    const fallbackTeamCode = (
      currentUser as {
        supportTeamCode?: SupportEscalationTeam;
        supportTeamRole?: string;
      }
    ).supportTeamCode;

    const buildFallbackMember = (): SupportTeamMember | null => {
      if (!fallbackTeamCode) {
        return null;
      }

      return {
        id: `fallback-team-member-${currentUser.id}`,
        userId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role:
          (currentUser as { supportTeamRole?: string }).supportTeamRole ??
          "SUPPORT_TEAM_MEMBER",
        teamCode: fallbackTeamCode,
        isActive: true,
      };
    };

    try {
      const member = await supportTeamService.getMemberByUserId(currentUser.id);
      const resolvedMember = member ?? buildFallbackMember();

      setCurrentTeamMember(resolvedMember);

      if (!resolvedMember) {
        setTeamScopedTicketIds(new Set());
        return;
      }

      const escalations = await supportEscalationService.getEscalations();

      const scopedTicketIds = new Set(
        escalations
          .filter(
            (escalation) =>
              escalation.team === resolvedMember.teamCode ||
              escalation.assignedToUserId === currentUser.id,
          )
          .map((escalation) => escalation.ticketDbId),
      );

      setTeamScopedTicketIds(scopedTicketIds);
    } catch {
      const fallbackMember = buildFallbackMember();

      setCurrentTeamMember(fallbackMember);

      if (!fallbackMember) {
        setTeamScopedTicketIds(new Set());
        return;
      }

      try {
        const escalations = await supportEscalationService.getEscalations();

        const scopedTicketIds = new Set(
          escalations
            .filter(
              (escalation) =>
                escalation.team === fallbackMember.teamCode ||
                escalation.assignedToUserId === currentUser.id,
            )
            .map((escalation) => escalation.ticketDbId),
        );

        setTeamScopedTicketIds(scopedTicketIds);
      } catch {
        setTeamScopedTicketIds(new Set());
      }
    }
  }, [currentUser]);
  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    void loadCurrentTeamScope();
  }, [loadCurrentTeamScope]);

  const teamScopedTickets = useMemo(() => {
    if (!currentTeamMember) {
      return tickets;
    }

    return tickets.filter(
      (ticket) =>
        teamScopedTicketIds.has(ticket.id) ||
        ticket.assignedToSupportId === currentUser?.id,
    );
  }, [tickets, currentTeamMember, teamScopedTicketIds, currentUser]);

  const summary = useMemo(() => {
    return {
      total: teamScopedTickets.length,
      open: teamScopedTickets.filter((ticket) => ticket.status === "OPEN")
        .length,
      inProgress: teamScopedTickets.filter(
        (ticket) => ticket.status === "IN_PROGRESS",
      ).length,
      onHold: teamScopedTickets.filter((ticket) => ticket.status === "ON_HOLD")
        .length,
      resolved: teamScopedTickets.filter(
        (ticket) => ticket.status === "RESOLVED",
      ).length,
      closed: teamScopedTickets.filter((ticket) => ticket.status === "CLOSED")
        .length,
      urgent: teamScopedTickets.filter((ticket) => ticket.priority === "URGENT")
        .length,
    };
  }, [teamScopedTickets]);

  const slaSummary = useMemo(() => {
    return buildSupportSlaSummary(teamScopedTickets);
  }, [teamScopedTickets]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchText.trim().length > 0 ||
      statusFilter !== "ALL" ||
      categoryFilter !== "ALL" ||
      priorityFilter !== "ALL" ||
      slaFilter !== "ALL"
    );
  }, [searchText, statusFilter, categoryFilter, priorityFilter, slaFilter]);

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return teamScopedTickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || ticket.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === "ALL" || ticket.category === categoryFilter;

      const matchesSla =
        slaFilter === "ALL" ||
        (slaFilter === "ESCALATED" && Boolean(ticket.escalated)) ||
        getSupportSlaState(ticket) === slaFilter;

      const searchableText = [
        ticket.ticketId,
        ticket.userName,
        ticket.userEmail,
        ticket.subject,
        ticket.message,
        ticket.orderId ?? "",
        ticket.status,
        ticket.category,
        ticket.priority,
        ticket.supportReply ?? "",
        ticket.internalNote ?? "",
        ticket.assignedToSupportName ?? "",
        ticket.escalationReason ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const isDedicatedTeamMember = Boolean(currentTeamMember);
      const matchesTeamScope =
        !isDedicatedTeamMember ||
        teamScopedTicketIds.has(ticket.id) ||
        ticket.assignedToSupportId === currentUser?.id;

      return (
        matchesTeamScope &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesSla &&
        matchesSearch
      );
    });
  }, [
    teamScopedTickets,
    searchText,
    statusFilter,
    priorityFilter,
    categoryFilter,
    slaFilter,
    currentTeamMember, // Added
    teamScopedTicketIds, // Added
    currentUser?.id, // Added (safely checks the id property)
  ]);

  const currentSupportTeamCode = useMemo(() => {
    return (
      currentTeamMember?.teamCode ??
      (currentUser as { supportTeamCode?: SupportEscalationTeam } | null)
        ?.supportTeamCode ??
      null
    );
  }, [currentTeamMember, currentUser]);

  const accessPolicy = useMemo(() => {
  return getSupportTicketAccessPolicy({
    currentUser: currentUser
      ? {
          ...currentUser,
          supportTeamCode: currentUser.supportTeamCode as SupportEscalationTeam | undefined,
        }
      : null,
    currentTeamMember,
  });
}, [currentUser, currentTeamMember]);

  const teamTextGuidance = useMemo(() => {
    return getSupportTeamTextGuidance(currentSupportTeamCode);
  }, [currentSupportTeamCode]);

  const canUpdateSelectedTicket = useMemo(() => {
    if (!selectedTicket) {
      return false;
    }

    const statusChanged = selectedTicket.status !== nextStatus;
    const hasReplyContent =
      accessPolicy.canSendCustomerReply
        ? replyText.trim().length > 0 || replyAttachments.length > 0
        : replyText.trim().length > 0;
    const internalNoteChanged =
      (selectedTicket.internalNote ?? "") !== internalNote.trim();

    return statusChanged || hasReplyContent || internalNoteChanged;
  }, [selectedTicket, nextStatus, replyText, replyAttachments, internalNote, accessPolicy]);

  const selectedTicketInvestigation = useMemo(() => {
    if (!selectedTicket) {
      return null;
    }

    return buildSupportInvestigation({
      ticket: selectedTicket,
      relatedOrder: investigationOrder,
      paymentTransactions: investigationPaymentTransactions,
      walletTransactions: investigationWalletTransactions,
      rewardTransactions: investigationRewardTransactions,
      couponRedemptions: investigationCouponRedemptions,
    });
  }, [
    selectedTicket,
    investigationOrder,
    investigationPaymentTransactions,
    investigationWalletTransactions,
    investigationRewardTransactions,
    investigationCouponRedemptions,
  ]);

  useEffect(() => {
    if (!selectedTicket) {
      return;
    }

    const latestSelectedTicket = tickets.find(
      (ticket) => ticket.id === selectedTicket.id,
    );

    if (latestSelectedTicket) {
      setSelectedTicket(latestSelectedTicket);
    }

    const isStillVisible = filteredTickets.some(
      (ticket) => ticket.id === selectedTicket.id,
    );

    if (!isStillVisible) {
      setSelectedTicket(null);
      setReplyText("");
      setReplyAttachments([]);
      setInternalNote("");
      setNextStatus("IN_PROGRESS");
      resetInvestigationDetails();
      resetEscalationDetails();
    }
  }, [
    filteredTickets,
    resetEscalationDetails,
    resetInvestigationDetails,
    selectedTicket,
    tickets,
  ]);

  const handleOpenTicket = (ticket: CustomerSupportTicket): void => {
    setSelectedTicket(ticket);
    setReplyText("");
    setReplyAttachments([]);
    setInternalNote(ticket.internalNote ?? "");

    void loadInvestigationDetails(ticket);
    void loadEscalationDetails(ticket);

    if (ticket.status === "OPEN") {
      setNextStatus("IN_PROGRESS");
      return;
    }

    setNextStatus(ticket.status);
  };

  const handleClosePanel = (): void => {
    setSelectedTicket(null);
    setReplyText("");
    setReplyAttachments([]);
    setInternalNote("");
    setNextStatus("IN_PROGRESS");
    resetInvestigationDetails();
    resetEscalationDetails();
  };

  const handleSupportReplyAttachmentChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (!currentUser || !event.target.files) {
      return;
    }

    const selectedFiles = Array.from(event.target.files);

    if (
      replyAttachments.length + selectedFiles.length >
      SUPPORT_ATTACHMENT_MAX_COUNT
    ) {
      showToast(
        "Attachment limit reached",
        `You can upload up to ${SUPPORT_ATTACHMENT_MAX_COUNT} files.`,
        "warning",
      );

      event.target.value = "";
      return;
    }

    try {
      const convertedAttachments = await Promise.all(
        selectedFiles.map((file) =>
          convertFileToSupportAttachment({
            file,
            uploadedByUserId: currentUser.id,
            uploadedByName: currentUser.name,
            uploadedByRole: "SUPPORT",
          }),
        ),
      );

      setReplyAttachments((previousAttachments) => [
        ...previousAttachments,
        ...convertedAttachments,
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to attach selected file.";

      showToast("Attachment failed", message, "danger");
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveSupportReplyAttachment = (attachmentId: string): void => {
    setReplyAttachments((previousAttachments) =>
      previousAttachments.filter(
        (attachment) => attachment.id !== attachmentId,
      ),
    );
  };

  const handleCreateEscalation = async (
    payload: CreateSupportEscalationPayload,
  ): Promise<void> => {
    if (!selectedTicket || !currentUser) {
      return;
    }

    try {
      setIsEscalationSaving(true);

      const createdEscalation =
        await supportEscalationService.createEscalation(payload);

      const updatedTicket = await customerSupportService.updateTicket(
        selectedTicket.id,
        {
          escalated: true,
          escalatedAt: selectedTicket.escalatedAt ?? new Date().toISOString(),
          escalationReason: payload.reason,
        },
      );

      const normalizedUpdatedTicket = normalizeSupportTicketSla(updatedTicket);

      setTicketEscalations((previousEscalations) => [
        createdEscalation,
        ...previousEscalations,
      ]);

      setTickets((previousTickets) =>
        previousTickets.map((ticket) =>
          ticket.id === normalizedUpdatedTicket.id
            ? normalizedUpdatedTicket
            : ticket,
        ),
      );

      setSelectedTicket(normalizedUpdatedTicket);

      showToast(
        "Escalation created",
        `Ticket ${selectedTicket.ticketId} has been escalated successfully.`,
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create escalation.";

      showToast("Escalation failed", message, "danger");
    } finally {
      setIsEscalationSaving(false);
    }
  };

  const handleUpdateEscalationStatus = async ({
    escalation,
    status,
    resolutionNote,
  }: {
    escalation: SupportEscalation;
    status: SupportEscalationStatus;
    resolutionNote?: string;
  }): Promise<void> => {
    if (!currentUser) {
      return;
    }

    if (status === "RESOLVED" && !resolutionNote?.trim()) {
      showToast(
        "Resolution note required",
        "Please add a resolution note before resolving escalation.",
        "warning",
      );
      return;
    }

    try {
      setIsEscalationSaving(true);

      const updatedEscalation =
        await supportEscalationService.updateEscalationStatus({
          escalation,
          status,
          updatedByName: currentUser.name,
          resolutionNote: resolutionNote?.trim(),
        });

      setTicketEscalations((previousEscalations) =>
        previousEscalations.map((currentEscalation) =>
          currentEscalation.id === updatedEscalation.id
            ? updatedEscalation
            : currentEscalation,
        ),
      );

      showToast(
        "Escalation updated",
        `Escalation ${updatedEscalation.escalationId} has been updated.`,
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update escalation.";

      showToast("Escalation update failed", message, "danger");
    } finally {
      setIsEscalationSaving(false);
    }
  };

  const handleAssignEscalationToMember = async ({
    escalation,
    member,
  }: {
    escalation: SupportEscalation;
    member: SupportTeamMember;
  }): Promise<void> => {
    if (!currentUser) {
      return;
    }

    try {
      setIsEscalationSaving(true);

      const updatedEscalation =
        await supportEscalationService.assignEscalationToMember({
          escalation,
          assignedToUserId: member.userId,
          assignedToName: member.name,
          updatedByName: currentUser.name,
        });

      setTicketEscalations((previousEscalations) =>
        previousEscalations.map((currentEscalation) =>
          currentEscalation.id === updatedEscalation.id
            ? updatedEscalation
            : currentEscalation,
        ),
      );

      showToast(
        "Escalation assigned",
        `Escalation ${updatedEscalation.escalationId} has been assigned to ${member.name}.`,
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to assign escalation.";

      showToast("Escalation assignment failed", message, "danger");
    } finally {
      setIsEscalationSaving(false);
    }
  };

  const handleUpdateTicket = async (): Promise<void> => {
    if (!selectedTicket) {
      return;
    }

    try {
      setUpdatingTicketId(selectedTicket.id);

      const now = new Date().toISOString();
      const trimmedReply = replyText.trim();
      const hasNewReply =
        accessPolicy.canSendCustomerReply &&
        (trimmedReply.length > 0 || replyAttachments.length > 0);
      const supportReplyMessage =
        trimmedReply || "Support added attachment evidence.";

      const validationMessage = validateSupportTicketUpdate({
        selectedTicket,
        nextStatus,
        replyText: trimmedReply,
        internalNote,
        attachmentCount: replyAttachments.length,
      });

      if (validationMessage) {
        showToast("Ticket validation failed", validationMessage, "warning");
        return;
      }

      if (nextStatus === "CLOSED" && hasActiveEscalation(ticketEscalations)) {
        showToast(
          "Active escalation exists",
          "Resolve or cancel active escalation before closing the ticket.",
          "warning",
        );
        return;
      }

      const existingMessages = getTicketMessages(selectedTicket);
      const existingActivities = getTicketActivities(selectedTicket);

      const nextMessages = hasNewReply
        ? [
            ...existingMessages,
            createSupportTicketMessage({
              authorId: currentUser?.id ?? "support",
              authorName: currentUser?.name ?? "Support Team",
              authorRole: "SUPPORT",
              message: supportReplyMessage,
              attachments: replyAttachments,
            }),
          ]
        : existingMessages;

      const finalStatus = hasNewReply
        ? getNextStatusAfterSupportReply(nextStatus)
        : nextStatus;

      const statusChanged = selectedTicket.status !== finalStatus;

      const nextActivities = [
        ...existingActivities,
        ...(statusChanged
          ? [
              createSupportTicketActivity({
                label: "Ticket Status Updated",
                description: `Ticket status changed from ${formatLabel(
                  selectedTicket.status,
                )} to ${formatLabel(finalStatus)}.`,
                createdByRole: "SUPPORT",
              }),
            ]
          : []),
        ...(hasNewReply
          ? [
              createSupportTicketActivity({
                label: "Support Replied",
                description: "Support added a reply for the customer.",
                createdByRole: "SUPPORT",
              }),
            ]
          : []),
      ];

      const recalculatedSlaDueAt =
        selectedTicket.slaDueAt ??
        calculateSlaDueAt({
          createdAt: selectedTicket.createdAt,
          priority: selectedTicket.priority,
        });

      const ticketForSla: CustomerSupportTicket = {
        ...selectedTicket,
        status: finalStatus,
        slaDueAt: recalculatedSlaDueAt,
      };

      const nextSlaState = getSupportSlaState(ticketForSla);
      const nextEscalated = shouldAutoEscalateTicket(ticketForSla);

      const finalInternalNote =
        accessPolicy.canAddSuggestedCustomerReply && trimmedReply.length > 0
          ? `${internalNote.trim()}

Suggested Customer Reply:
${trimmedReply}`.trim()
          : internalNote.trim();

      const updatedTicket = await customerSupportService.updateTicket(
        selectedTicket.id,
        {
          status: finalStatus,
          supportReply: hasNewReply
            ? supportReplyMessage
            : (selectedTicket.supportReply ?? undefined),
          internalNote: finalInternalNote || undefined,
          assignedToSupportId: currentUser?.id,
          assignedToSupportName: currentUser?.name,
          resolvedAt:
            finalStatus === "RESOLVED" ? now : selectedTicket.resolvedAt,
          closedAt: finalStatus === "CLOSED" ? now : selectedTicket.closedAt,
          messages: nextMessages,
          activities: nextActivities,
          unreadForCustomer: hasNewReply,
          unreadForSupport: false,
          slaDueAt: recalculatedSlaDueAt,
          slaBreached: nextSlaState === "OVERDUE",
          escalated: nextEscalated,
          escalatedAt:
            selectedTicket.escalatedAt ??
            (nextEscalated ? new Date().toISOString() : undefined),
          escalationReason:
            selectedTicket.escalationReason ??
            (nextEscalated
              ? selectedTicket.priority === "URGENT"
                ? "Urgent priority ticket requires immediate attention."
                : "Ticket has breached SLA."
              : undefined),
        },
      );

      const normalizedUpdatedTicket = normalizeSupportTicketSla(updatedTicket);

      if (hasNewReply) {
        await notificationService.createNotification(
          createCustomerSupportReplyNotification(normalizedUpdatedTicket),
        );
      }

      if (selectedTicket.status !== finalStatus) {
        await notificationService.createNotification(
          createCustomerTicketStatusNotification(normalizedUpdatedTicket),
        );
      }

      setTickets((previousTickets) =>
        previousTickets.map((ticket) =>
          ticket.id === normalizedUpdatedTicket.id
            ? normalizedUpdatedTicket
            : ticket,
        ),
      );

      setSelectedTicket(normalizedUpdatedTicket);
      setReplyText("");
      setReplyAttachments([]);
      setInternalNote(normalizedUpdatedTicket.internalNote ?? "");
      setNextStatus(normalizedUpdatedTicket.status);

      showToast(
        "Ticket updated",
        `Ticket ${normalizedUpdatedTicket.ticketId} has been updated successfully.`,
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update support ticket.";

      showToast("Ticket update failed", message, "danger");
    } finally {
      setUpdatingTicketId("");
    }
  };

  if (isLoading) {
    return (
      <main className="support-agent-tickets-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading support tickets..." />
        </div>
      </main>
    );
  }

  return (
    <main className="support-agent-tickets-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Support Tickets</h1>
              <p className="text-muted mb-0">
                Review customer support requests, monitor SLA risk, and update
                ticket status.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary support-agent-header-btn"
              onClick={() => void loadTickets()}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {errorMessage ? (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <div className="row g-3 mb-4">
          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>Total</span>
              <strong>{summary.total}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>Open</span>
              <strong>{summary.open}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>In Progress</span>
              <strong>{summary.inProgress}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>On Hold</span>
              <strong>{summary.onHold}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>Resolved</span>
              <strong>{summary.resolved}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-summary-tile bg-white border rounded-4 p-3">
              <span>Urgent</span>
              <strong>{summary.urgent}</strong>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md col-6">
            <div className="support-sla-tile bg-white border rounded-4 p-3">
              <span>Active SLA</span>
              <strong>{slaSummary.totalActive}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-sla-tile bg-white border rounded-4 p-3">
              <span>Overdue</span>
              <strong className="text-danger">{slaSummary.overdue}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-sla-tile bg-white border rounded-4 p-3">
              <span>Due Today</span>
              <strong className="text-warning">{slaSummary.dueToday}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-sla-tile bg-white border rounded-4 p-3">
              <span>Breach Soon</span>
              <strong className="text-info">{slaSummary.breachSoon}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-sla-tile bg-white border rounded-4 p-3">
              <span>Escalated</span>
              <strong className="text-danger">{slaSummary.escalated}</strong>
            </div>
          </div>

          <div className="col-md col-6">
            <div className="support-sla-tile bg-white border rounded-4 p-3">
              <span>SLA Urgent</span>
              <strong className="text-danger">{slaSummary.urgent}</strong>
            </div>
          </div>
        </div>

        <div className="support-ticket-toolbar bg-white border rounded-4 p-3 mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-3">
              <label className="form-label fw-semibold">Search</label>

              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted" />
                </span>

                <input
                  className="form-control"
                  placeholder="Ticket, customer, order or subject"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </div>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">Status</label>

              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as TicketStatusFilter)
                }
              >
                <option value="ALL">All</option>
                {statusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">Category</label>

              <select
                className="form-select"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as TicketCategoryFilter)
                }
              >
                <option value="ALL">All</option>
                {categoryOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">Priority</label>

              <select
                className="form-select"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value as TicketPriorityFilter)
                }
              >
                <option value="ALL">All</option>
                {priorityOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">SLA</label>

              <select
                className="form-select"
                value={slaFilter}
                onChange={(event) =>
                  setSlaFilter(event.target.value as TicketSlaFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="OVERDUE">Overdue</option>
                <option value="DUE_TODAY">Due Today</option>
                <option value="BREACH_SOON">Breach Soon</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>

            <div className="col-md-4 col-lg-1">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!hasActiveFilters}
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("ALL");
                  setCategoryFilter("ALL");
                  setPriorityFilter("ALL");
                  setSlaFilter("ALL");
                }}
                title={
                  hasActiveFilters
                    ? "Clear selected filters"
                    : "No filters selected"
                }
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {currentTeamMember ? (
          <div
            className="alert alert-info d-flex align-items-start gap-2"
            role="alert"
          >
            <i className="bi bi-shield-check mt-1" />
            <div>
              <strong>Team scoped view enabled.</strong>
              <div className="small">
                You are viewing tickets linked to{" "}
                <strong className="role-font">
                  {currentTeamMember.teamCode}
                </strong>{" "}
                escalations or assigned to you.
              </div>
            </div>
          </div>
        ) : null}

        {filteredTickets.length === 0 ? (
          <EmptyState
            title="No support tickets found"
            message="There are no support tickets matching your current filters."
            iconClassName="bi bi-ticket-detailed text-primary"
          />
        ) : (
          <div className="row g-3">
            <div className="col-xl-6">
              <div className="support-agent-ticket-list d-flex flex-column gap-3">
                {filteredTickets.map((ticket) => {
                  const slaState = getSupportSlaState(ticket);

                  return (
                    <button
                      type="button"
                      className={`support-agent-ticket-card bg-white border rounded-4 p-4 text-start ${
                        selectedTicket?.id === ticket.id ? "active" : ""
                      }`}
                      key={ticket.id}
                      onClick={() => handleOpenTicket(ticket)}
                    >
                      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                        <div>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            <span className="badge text-bg-light border">
                              {ticket.ticketId}
                            </span>

                            <span
                              className={`badge ${getStatusBadgeClass(
                                ticket.status,
                              )}`}
                            >
                              {formatLabel(ticket.status)}
                            </span>

                            <span
                              className={`badge ${getPriorityBadgeClass(
                                ticket.priority,
                              )}`}
                            >
                              {formatLabel(ticket.priority)}
                            </span>

                            <span className="badge text-bg-light border">
                              {formatLabel(ticket.category)}
                            </span>

                            <span
                              className={`badge ${getSlaBadgeClass(slaState)}`}
                            >
                              {getSlaLabel(slaState)}
                            </span>

                            {ticket.escalated ? (
                              <span className="badge text-bg-danger">
                                Escalated
                              </span>
                            ) : null}

                            {ticket.unreadForSupport ? (
                              <span className="badge text-bg-primary">
                                New Reply
                              </span>
                            ) : null}
                          </div>

                          <h5 className="fw-bold mb-2">{ticket.subject}</h5>

                          <p className="text-muted mb-2 rounded-4 p-3 support-ticket-preview">
                            {ticket.message}
                          </p>

                          <p className="small text-muted mb-0">
                            Customer: <strong>{ticket.userName}</strong> ·{" "}
                            {ticket.userEmail}
                          </p>

                          {ticket.orderId ? (
                            <p className="small text-muted mb-0">
                              Order ID: <strong>{ticket.orderId}</strong>
                            </p>
                          ) : null}
                        </div>

                        <div className="small text-muted text-lg-end">
                          <div>
                            Created:{" "}
                            {new Date(ticket.createdAt).toLocaleString("en-IN")}
                          </div>

                          <div>
                            Updated:{" "}
                            {new Date(ticket.updatedAt).toLocaleString("en-IN")}
                          </div>

                          <div>
                            SLA Due:{" "}
                            {new Date(getTicketSlaDueAt(ticket)).toLocaleString(
                              "en-IN",
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="col-xl-6">
              <div className="support-agent-detail-panel bg-white border rounded-4 p-4">
                {!selectedTicket ? (
                  <div className="text-center py-5">
                    <i className="bi bi-ticket-detailed fs-1 text-muted d-block mb-3" />
                    <h5 className="fw-bold">Select a ticket</h5>
                    <p className="text-muted mb-0">
                      Choose a support ticket from the list to update status or
                      reply.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <span className="badge text-bg-light border mb-2">
                          {selectedTicket.ticketId}
                        </span>

                        <h5 className="fw-bold mb-1">
                          {selectedTicket.subject}
                        </h5>

                        <p className="text-muted small mb-0">
                          {selectedTicket.userName} · {selectedTicket.userEmail}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleClosePanel}
                      >
                        Close
                      </button>
                    </div>

                    <div className="support-agent-message-box border rounded-4 p-3 mb-3">
                      <h6 className="fw-bold mb-2">Customer Message</h6>
                      <p className="text-muted mb-0">
                        {selectedTicket.message}
                      </p>
                    </div>

                    <div className="support-sla-detail-box border rounded-4 p-3 mb-3">
                      <div className="d-flex justify-content-between gap-3">
                        <div>
                          <h6 className="fw-bold mb-1">SLA Tracking</h6>
                          <p className="text-muted small mb-0">
                            Due by{" "}
                            {new Date(
                              getTicketSlaDueAt(selectedTicket),
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="text-end">
                          <span
                            className={`badge ${getSlaBadgeClass(
                              getSupportSlaState(selectedTicket),
                            )}`}
                          >
                            {getSlaLabel(getSupportSlaState(selectedTicket))}
                          </span>

                          {selectedTicket.escalated ? (
                            <span className="badge text-bg-danger ms-2">
                              Escalated
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {selectedTicket.escalationReason ? (
                        <p className="text-danger small fw-semibold mt-2 mb-0">
                          {selectedTicket.escalationReason}
                        </p>
                      ) : null}
                    </div>

                    <SupportInvestigationPanel
                      ticket={selectedTicket}
                      relatedOrder={investigationOrder}
                      paymentTransactions={investigationPaymentTransactions}
                      walletTransactions={investigationWalletTransactions}
                      rewardTransactions={investigationRewardTransactions}
                      couponRedemptions={investigationCouponRedemptions}
                      isLoading={isInvestigationLoading}
                    />
                    <SupportEscalationPanel
                      ticket={selectedTicket}
                      escalations={ticketEscalations}
                      suggestedTeam={suggestEscalationTeam({
                        ticket: selectedTicket,
                        issueType: selectedTicketInvestigation?.issueType,
                      })}
                      recommendedAction={
                        selectedTicketInvestigation?.recommendedAction
                      }
                      currentUser={
                        currentUser
                          ? {
                              id: currentUser.id,
                              name: currentUser.name,
                            }
                          : null
                      }
                      relatedOrder={investigationOrder}
                      paymentTransactions={investigationPaymentTransactions}
                      walletTransactions={investigationWalletTransactions}
                      rewardTransactions={investigationRewardTransactions}
                      couponRedemptions={investigationCouponRedemptions}
                      refundRequests={investigationRefundRequests}
                      isEvidenceLoading={isInvestigationLoading}
                      isTeamMemberView={accessPolicy.isSupportTeamMember}
                      isLoading={isEscalationLoading}
                      isSaving={isEscalationSaving}
                      onCreateEscalation={handleCreateEscalation}
                      onUpdateEscalationStatus={handleUpdateEscalationStatus}
                      onAssignEscalationToMember={
                        handleAssignEscalationToMember
                      }
                    />

                    {accessPolicy.canViewConversationThread ? (
                      <SupportConversationThread
                        messages={getTicketMessages(selectedTicket)}
                        title="Conversation Thread"
                      />
                    ) : (
                      <div className="alert alert-light border small">
                        <strong>Escalation Context Summary:</strong>{" "}
                        Full customer conversation thread is restricted for team
                        members. Use the customer message, investigation
                        workspace, evidence panel, and escalation notes to
                        resolve the assigned issue.
                      </div>
                    )}

                    {accessPolicy.canViewTicketActivity ? (
                    <div className="support-ticket-progress-card mb-3">
                      <div className="support-ticket-progress-header">
                        <div>
                          <h5 className="fw-bold mb-1">Ticket Activity</h5>
                          <p className="mb-0 text-muted">
                            Current Status:{" "}
                            <strong>
                              {formatLabel(selectedTicket.status)}
                            </strong>
                          </p>
                        </div>

                        <span
                          className={`support-ticket-status-pill ${selectedTicket.status.toLowerCase()}`}
                        >
                          {formatLabel(selectedTicket.status)}
                        </span>
                      </div>

                      <div className="support-ticket-progress-timeline">
                        {getSupportTimelineItems(selectedTicket).map(
                          (timelineItem, index, timelineItems) => (
                            <div
                              className={`support-ticket-progress-step ${getTimelineStepClass(
                                timelineItem.type,
                                index,
                                timelineItems.length,
                              )}`}
                              key={timelineItem.id}
                            >
                              <div className="support-ticket-progress-marker">
                                <span className="support-ticket-progress-icon">
                                  <i
                                    className={getTimelineIconClass(
                                      timelineItem.type,
                                    )}
                                  />
                                </span>
                              </div>

                              <div className="support-ticket-progress-content">
                                <h6>{timelineItem.label}</h6>

                                <p className="support-ticket-progress-description">
                                  {getTimelineStepDescription(
                                    timelineItem.type,
                                  )}
                                </p>

                                <div className="support-ticket-progress-event">
                                  <span className="support-ticket-event-dot" />

                                  <div className="support-ticket-event-card">
                                    <strong>{timelineItem.label}</strong>
                                    <p>{timelineItem.description}</p>

                                    <div className="support-ticket-event-meta">
                                      <span>
                                        <i className="bi bi-person-badge" />
                                        {timelineItem.actorName}
                                      </span>

                                      <span>
                                        <i className="bi bi-clock" />
                                        {new Date(
                                          timelineItem.createdAt,
                                        ).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    ) : null}

                    {accessPolicy.canChangeTicketStatus ? (
                      <div className="mb-3">
                        <label
                          htmlFor="ticketStatus"
                          className="form-label fw-semibold"
                        >
                          Ticket Status
                        </label>

                        <select
                          id="ticketStatus"
                          className="form-select"
                          value={nextStatus}
                          onChange={(event) =>
                            setNextStatus(
                              event.target.value as SupportTicketStatus,
                            )
                          }
                        >
                          {statusOptions.map((option) => (
                            <option value={option.value} key={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="alert alert-light border small">
                        <strong>Main ticket status is managed by Support Agents.</strong>
                        <div>
                          Team members should update the escalation status and
                          add a resolution note instead.
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <label
                        htmlFor="supportReply"
                        className="form-label fw-semibold"
                      >
                        Add Support Reply
                      </label>

                      <textarea
                        id="supportReply"
                        className="form-control"
                        rows={5}
                        maxLength={MAX_SUPPORT_REPLY_LENGTH}
                        placeholder="Write a new reply visible to the customer..."
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                      />

                      <div className="file-upload mt-3">
                        <input
                          id="supportAttachments"
                          type="file"
                          className="form-control"
                          multiple
                          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,text/plain,.doc,.docx"
                          onChange={(event) =>
                            void handleSupportReplyAttachmentChange(event)
                          }
                        />
                        <div className="form-text">
                          Upload up to 3 files. Supported: images, PDF, DOC,
                          DOCX, TXT. Max 3 MB each.
                        </div>
                      </div>

                      <SupportAttachmentPreview
                        attachments={replyAttachments}
                        onRemove={handleRemoveSupportReplyAttachment}
                      />
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="internalNote"
                        className="form-label fw-semibold"
                      >
                        Internal Note
                      </label>

                      <textarea
                        id="internalNote"
                        className="form-control"
                        rows={4}
                        maxLength={MAX_INTERNAL_NOTE_LENGTH}
                        placeholder={teamTextGuidance.internalNotePlaceholder}
                        value={internalNote}
                        onChange={(event) =>
                          setInternalNote(event.target.value)
                        }
                      />

                      <div className="form-text text-end">
                        {internalNote.length}/{MAX_INTERNAL_NOTE_LENGTH}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary w-100 support-agent-save-btn"
                      disabled={
                        updatingTicketId === selectedTicket.id ||
                        !canUpdateSelectedTicket
                      }
                      title={
                        canUpdateSelectedTicket
                          ? "Update ticket"
                          : "Make a status, reply, attachment, or note change before updating"
                      }
                      onClick={() => void handleUpdateTicket()}
                    >
                      {updatingTicketId === selectedTicket.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle me-2" />
                          Update Ticket
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default SupportTicketsPage;