import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import SupportEscalationEvidencePanel from "../../components/support/SupportEscalationEvidencePanel";
import SupportEscalationResolutionGuide from "../../components/support/SupportEscalationResolutionGuide";
import SupportTeamPerformancePanel from "../../components/support/SupportTeamPerformancePanel";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { couponRedemptionService } from "../../services/couponRedemptionService";
import { customerSupportService } from "../../services/customerSupportService";
import { orderService } from "../../services/orderService";
import { paymentTransactionService } from "../../services/paymentTransactionService";
import { refundService } from "../../services/refundService";
import { rewardService } from "../../services/rewardService";
import { supportEscalationService } from "../../services/supportEscalationService";
import { supportTeamService } from "../../services/supportTeamService";
import { walletService } from "../../services/walletService";
import type { CouponRedemption } from "../../types/couponRedemption";
import type { CustomerSupportTicket } from "../../types/customerSupport";
import type { Order } from "../../types/order";
import type { PaymentTransaction } from "../../types/payment";
import type { RefundRequest } from "../../types/refund";
import type { RewardTransaction } from "../../types/rewards";
import type {
  SupportEscalation,
  SupportEscalationPriority,
  SupportEscalationStatus,
  SupportEscalationTeam,
} from "../../types/supportEscalation";
import type {
  SupportTeamMember,
  SupportTeamMemberAvailability,
} from "../../types/supportTeam";
import type { WalletTransaction } from "../../types/wallet";
import {
  formatEscalationLabel,
  getEscalationPriorityBadgeClass,
  getEscalationStatusBadgeClass,
  supportEscalationPriorityOptions,
  supportEscalationStatusOptions,
  supportEscalationTeamOptions,
} from "../../utils/supportEscalationUtils";
import { deriveMemberAvailability } from "../../utils/supportTeamMetricsUtils";
import { getSupportTeamTextGuidance } from "../../utils/supportTicketAccessUtils";

type EscalationStatusFilter = "ALL" | SupportEscalationStatus;
type EscalationTeamFilter = "ALL" | SupportEscalationTeam;
type EscalationPriorityFilter = "ALL" | SupportEscalationPriority;

type EscalationOwnershipFilter =
  | "ALL"
  | "MY_TEAM"
  | "ASSIGNED_TO_ME"
  | "UNASSIGNED";

type EscalationAvailabilityFilter = "ALL" | SupportTeamMemberAvailability;

interface EscalationEvidenceState {
  ticket: CustomerSupportTicket | null;
  relatedOrder: Order | null;
  paymentTransactions: PaymentTransaction[];
  walletTransactions: WalletTransaction[];
  rewardTransactions: RewardTransaction[];
  couponRedemptions: CouponRedemption[];
  refundRequests: RefundRequest[];
  isLoading: boolean;
}

const SupportEscalationQueuePage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [escalations, setEscalations] = useState<SupportEscalation[]>([]);
  const [teamMembers, setTeamMembers] = useState<SupportTeamMember[]>([]);
  const [currentTeamMember, setCurrentTeamMember] =
    useState<SupportTeamMember | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingEscalationId, setUpdatingEscalationId] =
    useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] =
    useState<EscalationStatusFilter>("ALL");
  const [teamFilter, setTeamFilter] = useState<EscalationTeamFilter>("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState<EscalationPriorityFilter>("ALL");
  const [ownershipFilter, setOwnershipFilter] =
    useState<EscalationOwnershipFilter>("ALL");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<EscalationAvailabilityFilter>("ALL");

  const [evidenceByEscalationId, setEvidenceByEscalationId] = useState<
    Record<string, EscalationEvidenceState>
  >({});

  const loadEscalations = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [data, members] = await Promise.all([
        supportEscalationService.getEscalations(),
        supportTeamService.getTeamMembers(),
      ]);

      setEscalations(data);
      setTeamMembers(members);
    } catch {
      setErrorMessage(
        "Unable to load escalation queue. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEscalations();
  }, [loadEscalations]);

  useEffect(() => {
    const loadCurrentTeamMember = async (): Promise<void> => {
      if (!currentUser) {
        setCurrentTeamMember(null);
        return;
      }

      try {
        const member = await supportTeamService.getMemberByUserId(
          currentUser.id,
        );

        setCurrentTeamMember(member);
      } catch {
        setCurrentTeamMember(null);
      }
    };

    void loadCurrentTeamMember();
  }, [currentUser]);

  useEffect(() => {
    if (currentTeamMember) {
      setOwnershipFilter("MY_TEAM");
    }
  }, [currentTeamMember]);

  const getAssignedMember = useCallback(
    (assignedToUserId?: string | null): SupportTeamMember | null => {
      if (!assignedToUserId) {
        return null;
      }

      return (
        teamMembers.find((member) => member.userId === assignedToUserId) ?? null
      );
    },
    [teamMembers],
  );

  const filteredEscalations = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return escalations.filter((escalation) => {
      const matchesStatus =
        statusFilter === "ALL" || escalation.status === statusFilter;

      const matchesTeam =
        teamFilter === "ALL" || escalation.team === teamFilter;

      const matchesPriority =
        priorityFilter === "ALL" || escalation.priority === priorityFilter;

      const matchesOwnership =
        ownershipFilter === "ALL" ||
        (ownershipFilter === "MY_TEAM" &&
          currentTeamMember !== null &&
          escalation.team === currentTeamMember.teamCode) ||
        (ownershipFilter === "ASSIGNED_TO_ME" &&
          currentUser !== null &&
          escalation.assignedToUserId === currentUser.id) ||
        (ownershipFilter === "UNASSIGNED" && !escalation.assignedToUserId);

      const assignedMember = getAssignedMember(escalation.assignedToUserId);

      const matchesAvailability =
        availabilityFilter === "ALL" ||
        (assignedMember !== null &&
          deriveMemberAvailability(assignedMember) === availabilityFilter);

      const searchableText = [
        escalation.escalationId,
        escalation.ticketNumber,
        escalation.orderId ?? "",
        escalation.userName,
        escalation.team,
        escalation.status,
        escalation.priority,
        escalation.reason,
        escalation.assignedToName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return (
        matchesStatus &&
        matchesTeam &&
        matchesPriority &&
        matchesOwnership &&
        matchesAvailability &&
        matchesSearch
      );
    });
  }, [
    escalations,
    searchText,
    statusFilter,
    teamFilter,
    priorityFilter,
    ownershipFilter,
    availabilityFilter,
    currentTeamMember,
    currentUser,
    getAssignedMember,
  ]);

  const performanceMembers = useMemo(() => {
    if (!currentTeamMember) {
      return teamMembers;
    }

    return teamMembers.filter(
      (member) => member.teamCode === currentTeamMember.teamCode,
    );
  }, [currentTeamMember, teamMembers]);

  const loadEscalationEvidence = async (
    escalation: SupportEscalation,
  ): Promise<void> => {
    try {
      setEvidenceByEscalationId((previousState) => ({
        ...previousState,
        [escalation.id]: {
          ticket: null,
          relatedOrder: null,
          paymentTransactions: [],
          walletTransactions: [],
          rewardTransactions: [],
          couponRedemptions: [],
          refundRequests: [],
          isLoading: true,
        },
      }));

      const tickets = await customerSupportService.getTickets();

      const ticket =
        tickets.find(
          (currentTicket) =>
            currentTicket.id === escalation.ticketDbId ||
            currentTicket.ticketId === escalation.ticketNumber,
        ) ?? null;

      let relatedOrder: Order | null = null;
      const orderId = escalation.orderId ?? ticket?.orderId;

      if (orderId) {
        relatedOrder = await orderService.getOrderByOrderId(orderId);
      }

      const [
        userPaymentTransactions,
        userWalletTransactions,
        userRewardTransactions,
        userCouponRedemptions,
        userRefundRequests,
      ] = await Promise.all([
        paymentTransactionService.getTransactionsByUserId(escalation.userId),
        walletService.getTransactionsByUserId(escalation.userId),
        rewardService.getTransactionsByUserId(escalation.userId),
        couponRedemptionService.getRedemptionsByUserId(escalation.userId),
        refundService.getRefundRequestsByUserId(escalation.userId),
      ]);

      const filteredPaymentTransactions = orderId
        ? userPaymentTransactions.filter(
            (transaction) =>
              transaction.orderId === orderId ||
              transaction.issueFlag === "ORDER_NOT_CREATED" ||
              transaction.issueFlag === "DUPLICATE_DEBIT" ||
              transaction.status === "REFUND_REQUIRED",
          )
        : userPaymentTransactions;

      const filteredWalletTransactions = orderId
        ? userWalletTransactions.filter(
            (transaction) => transaction.orderId === orderId,
          )
        : userWalletTransactions;

      const filteredRewardTransactions = orderId
        ? userRewardTransactions.filter(
            (transaction) => transaction.orderId === orderId,
          )
        : userRewardTransactions;

      const filteredCouponRedemptions = orderId
        ? userCouponRedemptions.filter(
            (redemption) => redemption.orderId === orderId,
          )
        : userCouponRedemptions;

      const paymentIds = new Set(
        filteredPaymentTransactions.map((transaction) => transaction.paymentId),
      );

      const filteredRefundRequests = userRefundRequests.filter(
        (refundRequest) => {
          const matchesOrder =
            Boolean(orderId) && refundRequest.orderId === orderId;

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

      setEvidenceByEscalationId((previousState) => ({
        ...previousState,
        [escalation.id]: {
          ticket,
          relatedOrder,
          paymentTransactions: filteredPaymentTransactions,
          walletTransactions: filteredWalletTransactions,
          rewardTransactions: filteredRewardTransactions,
          couponRedemptions: filteredCouponRedemptions,
          refundRequests: filteredRefundRequests,
          isLoading: false,
        },
      }));
    } catch {
      setEvidenceByEscalationId((previousState) => ({
        ...previousState,
        [escalation.id]: {
          ticket: null,
          relatedOrder: null,
          paymentTransactions: [],
          walletTransactions: [],
          rewardTransactions: [],
          couponRedemptions: [],
          refundRequests: [],
          isLoading: false,
        },
      }));

      showToast(
        "Evidence load failed",
        "Unable to load escalation investigation evidence.",
        "warning",
      );
    }
  };

  const handleHideEscalationEvidence = (escalationId: string): void => {
    setEvidenceByEscalationId((previousState) => {
      const nextState = { ...previousState };
      delete nextState[escalationId];
      return nextState;
    });
  };

  const handleAssignToMe = async (
    escalation: SupportEscalation,
  ): Promise<void> => {
    if (!currentUser) {
      showToast(
        "Login required",
        "Please login as support agent to assign escalation.",
        "warning",
      );
      return;
    }

    try {
      setUpdatingEscalationId(escalation.id);

      const updatedEscalation =
        await supportEscalationService.assignEscalationToMember({
          escalation,
          assignedToUserId: currentUser.id,
          assignedToName: currentUser.name,
          updatedByName: currentUser.name,
        });

      setEscalations((previousEscalations) =>
        previousEscalations.map((currentEscalation) =>
          currentEscalation.id === updatedEscalation.id
            ? updatedEscalation
            : currentEscalation,
        ),
      );

      showToast(
        "Escalation assigned",
        `Escalation ${updatedEscalation.escalationId} is assigned to you.`,
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to assign escalation.";

      showToast("Assignment failed", message, "danger");
    } finally {
      setUpdatingEscalationId("");
    }
  };

  const handleStatusChange = async ({
    escalation,
    status,
  }: {
    escalation: SupportEscalation;
    status: SupportEscalationStatus;
  }): Promise<void> => {
    if (!currentUser) {
      return;
    }

    try {
      setUpdatingEscalationId(escalation.id);

      const updatedEscalation =
        await supportEscalationService.updateEscalationStatus({
          escalation,
          status,
          updatedByName: currentUser.name,
        });

      setEscalations((previousEscalations) =>
        previousEscalations.map((currentEscalation) =>
          currentEscalation.id === updatedEscalation.id
            ? updatedEscalation
            : currentEscalation,
        ),
      );

      showToast(
        "Escalation updated",
        `Escalation ${updatedEscalation.escalationId} status updated.`,
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update escalation status.";

      showToast("Update failed", message, "danger");
    } finally {
      setUpdatingEscalationId("");
    }
  };

  const getEscalationResolutionPlaceholder = (
    teamCode: SupportEscalationTeam,
  ): string => {
    return getSupportTeamTextGuidance(teamCode).resolutionNotePlaceholder;
  };

  const handleClearFilters = (): void => {
    setSearchText("");
    setStatusFilter("ALL");
    setTeamFilter("ALL");
    setPriorityFilter("ALL");
    setOwnershipFilter(currentTeamMember ? "MY_TEAM" : "ALL");
    setAvailabilityFilter("ALL");
  };

  const hasActiveFilters =
    searchText.trim().length > 0 ||
    statusFilter !== "ALL" ||
    teamFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    ownershipFilter !== (currentTeamMember ? "MY_TEAM" : "ALL") ||
    availabilityFilter !== "ALL";

  if (isLoading) {
    return (
      <main className="support-escalation-queue-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading escalation queue..." />
        </div>
      </main>
    );
  }

  return (
    <main className="support-escalation-queue-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Support Escalation Queue</h1>
              <p className="text-muted mb-0">
                Track escalated tickets across payment, refund, delivery,
                seller, wallet, coupon, and operations teams.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary support-agent-header-btn"
              onClick={() => void loadEscalations()}
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

        {currentTeamMember ? (
          <div
            className="alert alert-info d-flex align-items-start gap-2"
            role="alert"
          >
            <i className="bi bi-shield-check mt-1" />

            <div>
              <strong>Team queue enabled.</strong>
              <div className="small">
                Defaulting to My Team escalations for{" "}
                <strong>{currentTeamMember.teamCode}</strong>. You can change
                the Ownership filter if needed.
              </div>
            </div>
          </div>
        ) : null}

        <div className="support-ticket-toolbar bg-white border shadow-sm p-3 mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-3">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                placeholder="Escalation, ticket, order, customer"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as EscalationStatusFilter)
                }
              >
                <option value="ALL">All</option>
                {supportEscalationStatusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">Team</label>
              <select
                className="form-select"
                value={teamFilter}
                onChange={(event) =>
                  setTeamFilter(event.target.value as EscalationTeamFilter)
                }
              >
                <option value="ALL">All</option>
                {supportEscalationTeamOptions.map((option) => (
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
                  setPriorityFilter(
                    event.target.value as EscalationPriorityFilter,
                  )
                }
              >
                <option value="ALL">All</option>
                {supportEscalationPriorityOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">Ownership</label>
              <select
                className="form-select"
                value={ownershipFilter}
                onChange={(event) =>
                  setOwnershipFilter(
                    event.target.value as EscalationOwnershipFilter,
                  )
                }
              >
                <option value="ALL">All</option>
                <option value="MY_TEAM">My Team</option>
                <option value="ASSIGNED_TO_ME">Assigned to Me</option>
                <option value="UNASSIGNED">Unassigned</option>
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">Availability</label>
              <select
                className="form-select"
                value={availabilityFilter}
                onChange={(event) =>
                  setAvailabilityFilter(
                    event.target.value as EscalationAvailabilityFilter,
                  )
                }
              >
                <option value="ALL">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="AWAY">Away</option>
                <option value="OFFLINE">Offline</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!hasActiveFilters}
                onClick={handleClearFilters}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <SupportTeamPerformancePanel
          members={performanceMembers}
          escalations={filteredEscalations}
          title={
            currentTeamMember
              ? "My Team Performance"
              : "Support Team Performance"
          }
        />

        {filteredEscalations.length === 0 ? (
          <EmptyState
            title="No escalations found"
            message="No escalations match the selected filters."
            iconClassName="bi bi-exclamation-diamond text-primary"
          />
        ) : (
          <div className="row g-3">
            {filteredEscalations.map((escalation) => (
              <div className="col-lg-12" key={escalation.id}>
                <div className="support-escalation-queue-card bg-white border shadow-sm p-4 h-100">
                  <div className="d-flex justify-content-between gap-3 mb-2">
                    <div>
                      <span className="badge text-bg-light border mb-2">
                        {escalation.escalationId}
                      </span>

                      <h5 className="fw-bold mb-1">
                        {formatEscalationLabel(escalation.team)}
                      </h5>

                      <p className="text-muted small mb-0">
                        Ticket: <strong>{escalation.ticketNumber}</strong>
                        {escalation.orderId
                          ? ` · Order: ${escalation.orderId}`
                          : ""}
                      </p>
                    </div>

                    <div className="d-flex align-items-start gap-2">
                      <span
                        className={`badge ${getEscalationStatusBadgeClass(
                          escalation.status,
                        )}`}
                      >
                        {formatEscalationLabel(escalation.status)}
                      </span>

                      <span
                        className={`badge ${getEscalationPriorityBadgeClass(
                          escalation.priority,
                        )}`}
                      >
                        {formatEscalationLabel(escalation.priority)}
                      </span>
                    </div>
                  </div>

                  <p className="text-muted mb-3">{escalation.reason}</p>

                  <SupportEscalationResolutionGuide team={escalation.team} />

                  <div className="alert alert-light border small mb-3">
                    <strong>Resolution note guidance:</strong>{" "}
                    {getEscalationResolutionPlaceholder(escalation.team)}
                  </div>

                  {evidenceByEscalationId[escalation.id] ? (
                    <>
                      <div className="d-flex justify-content-end mb-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            handleHideEscalationEvidence(escalation.id)
                          }
                        >
                          <i className="bi bi-eye-slash me-1" />
                          Hide Investigation Evidence
                        </button>
                      </div>

                      <SupportEscalationEvidencePanel
                        escalation={escalation}
                        ticket={evidenceByEscalationId[escalation.id].ticket}
                        relatedOrder={
                          evidenceByEscalationId[escalation.id].relatedOrder
                        }
                        paymentTransactions={
                          evidenceByEscalationId[escalation.id]
                            .paymentTransactions
                        }
                        walletTransactions={
                          evidenceByEscalationId[escalation.id]
                            .walletTransactions
                        }
                        rewardTransactions={
                          evidenceByEscalationId[escalation.id]
                            .rewardTransactions
                        }
                        couponRedemptions={
                          evidenceByEscalationId[escalation.id]
                            .couponRedemptions
                        }
                        refundRequests={
                          evidenceByEscalationId[escalation.id].refundRequests
                        }
                        isLoading={
                          evidenceByEscalationId[escalation.id].isLoading
                        }
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary mb-3"
                      onClick={() => void loadEscalationEvidence(escalation)}
                    >
                      <i className="bi bi-search me-1" />
                      Load Investigation Evidence
                    </button>
                  )}

                  <div className="small text-muted mb-3">
                    <div>
                      Customer: <strong>{escalation.userName}</strong>
                    </div>

                    <div>
                      Created:{" "}
                      {new Date(escalation.createdAt).toLocaleString("en-IN")}
                    </div>

                    <div>
                      Updated:{" "}
                      {new Date(escalation.updatedAt).toLocaleString("en-IN")}
                    </div>

                    <div>
                      Assigned To:{" "}
                      <strong>
                        {escalation.assignedToName ?? "Unassigned"}
                      </strong>
                    </div>
                  </div>

                  {escalation.resolutionNote ? (
                    <div className="alert alert-success py-2 small">
                      <strong>Resolution:</strong> {escalation.resolutionNote}
                    </div>
                  ) : null}

                  <div className="d-flex flex-wrap gap-2">
                    <Link
                      to="/support/tickets"
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bi bi-ticket-detailed me-1" />
                      View Tickets
                    </Link>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      disabled={
                        updatingEscalationId === escalation.id ||
                        Boolean(escalation.assignedToUserId)
                      }
                      onClick={() => void handleAssignToMe(escalation)}
                    >
                      Assign to Me
                    </button>

                    <select
                      className="form-select form-select-sm support-escalation-status-select"
                      value={escalation.status}
                      disabled={updatingEscalationId === escalation.id}
                      onChange={(event) =>
                        void handleStatusChange({
                          escalation,
                          status: event.target.value as SupportEscalationStatus,
                        })
                      }
                    >
                      {supportEscalationStatusOptions.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default SupportEscalationQueuePage;