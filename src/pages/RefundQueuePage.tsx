import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import RefundRequestCard from "../components/support/RefundRequestCard";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { paymentTransactionService } from "../services/paymentTransactionService";
import { refundService } from "../services/refundService";
import { supportTeamService } from "../services/supportTeamService";
import type { RefundRequest, RefundStatus } from "../types/refund";
import type { SupportEscalationTeam } from "../types/supportEscalation";
import type { SupportTeamMember } from "../types/supportTeam";
import {
  formatRefundStatusLabel,
  refundStatusOptions,
} from "../utils/refundWorkflowUtils";

type RefundStatusFilter = "ALL" | RefundStatus;
type RefundTeamFilter = "ALL" | SupportEscalationTeam;
type RefundCreatedByFilter = "ALL" | "SYSTEM" | "SUPPORT" | "ADMIN";

const RefundQueuePage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [currentTeamMember, setCurrentTeamMember] =
    useState<SupportTeamMember | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingRefundId, setUpdatingRefundId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<RefundStatusFilter>("ALL");
  const [teamFilter, setTeamFilter] = useState<RefundTeamFilter>("ALL");
  const [createdByFilter, setCreatedByFilter] =
    useState<RefundCreatedByFilter>("ALL");

  const loadRefundQueue = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await refundService.getRefundRequests();
      setRefundRequests(data);
    } catch {
      setErrorMessage(
        "Unable to load refund queue. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRefundQueue();
  }, [loadRefundQueue]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentTeamMember = async (): Promise<void> => {
      if (!currentUser || currentUser.role !== "SUPPORT") {
        if (isMounted) setCurrentTeamMember(null);
        return;
      }

      try {
        const member = await supportTeamService.getMemberByUserId(
          currentUser.id,
        );
        if (isMounted) setCurrentTeamMember(member);
      } catch {
        if (isMounted) setCurrentTeamMember(null);
      }
    };

    void loadCurrentTeamMember();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const isAdmin = currentUser?.role === "ADMIN";
  const isSupport = currentUser?.role === "SUPPORT";
  const isRefundTeamMember = currentTeamMember?.teamCode === "REFUND_TEAM";
  const isPaymentFinanceMember =
    currentTeamMember?.teamCode === "PAYMENT_FINANCE";

  const canViewAllRefunds =
    isAdmin || (isSupport && currentTeamMember === null);

  const scopedRefundRequests = useMemo(() => {
    if (canViewAllRefunds) {
      return refundRequests;
    }

    if (isRefundTeamMember) {
      return refundRequests.filter(
        (refund) => refund.assignedTeam === "REFUND_TEAM",
      );
    }

    if (isPaymentFinanceMember) {
      // FIXED: Properly handles the access scope targeting PAYMENT_FINANCE data
      return refundRequests.filter(
        (refund) => refund.assignedTeam === "PAYMENT_FINANCE",
      );
    }

    return [];
  }, [
    refundRequests,
    canViewAllRefunds,
    isRefundTeamMember,
    isPaymentFinanceMember,
  ]);

  const filteredRefundRequests = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return scopedRefundRequests.filter((refund) => {
      const matchesStatus =
        statusFilter === "ALL" || refund.status === statusFilter;

      const matchesTeam =
        teamFilter === "ALL" || refund.assignedTeam === teamFilter;

      const matchesCreatedBy =
        createdByFilter === "ALL" || refund.createdBy === createdByFilter;

      if (!matchesStatus || !matchesTeam || !matchesCreatedBy) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        refund.refundId,
        refund.paymentId,
        refund.orderId ?? "",
        refund.userId,
        refund.userName ?? "",
        refund.reason,
        refund.assignedTeam,
        refund.gatewayRefundReferenceId ?? "",
        refund.resolutionNote ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [
    scopedRefundRequests,
    searchText,
    statusFilter,
    teamFilter,
    createdByFilter,
  ]);

  const summary = useMemo(() => {
    return {
      total: scopedRefundRequests.length,
      pendingReview: scopedRefundRequests.filter(
        (refund) =>
          refund.status === "PENDING_REVIEW" || refund.status === "PENDING",
      ).length,
      initiated: scopedRefundRequests.filter(
        (refund) => refund.status === "INITIATED",
      ).length,
      processing: scopedRefundRequests.filter(
        (refund) => refund.status === "PROCESSING",
      ).length,
      completed: scopedRefundRequests.filter(
        (refund) => refund.status === "COMPLETED",
      ).length,
      failed: scopedRefundRequests.filter(
        (refund) => refund.status === "FAILED",
      ).length,
      totalAmount: scopedRefundRequests.reduce(
        (total, refund) => total + refund.amount,
        0,
      ),
    };
  }, [scopedRefundRequests]);

  const handleUpdateRefundStatus = async ({
    refund,
    status,
    gatewayRefundReferenceId,
    resolutionNote,
  }: {
    refund: RefundRequest;
    status: RefundStatus;
    gatewayRefundReferenceId?: string;
    resolutionNote?: string;
  }): Promise<void> => {
    try {
      setUpdatingRefundId(refund.id);

      let updatedRefund: RefundRequest;

      if (status === "INITIATED") {
        updatedRefund = await refundService.markRefundRequestInitiated({
          refundRequest: refund,
          resolutionNote,
        });

        const payment =
          await paymentTransactionService.getTransactionByPaymentId(
            refund.paymentId,
          );

        if (payment) {
          await paymentTransactionService.markRefundInitiated({
            transactionDbId: payment.id,
            refundId: refund.refundId,
          });
        }
      } else if (status === "PROCESSING") {
        updatedRefund = await refundService.markRefundRequestProcessing({
          refundRequest: refund,
          resolutionNote,
        });
      } else if (status === "COMPLETED") {
        updatedRefund = await refundService.markRefundRequestCompleted({
          refundRequest: refund,
          gatewayRefundReferenceId:
            gatewayRefundReferenceId ?? `GATEWAY-RFND-${refund.refundId}`,
          resolutionNote:
            resolutionNote ??
            "Refund completed and confirmed with gateway reference.",
        });

        const payment =
          await paymentTransactionService.getTransactionByPaymentId(
            refund.paymentId,
          );

        if (payment) {
          await paymentTransactionService.markRefundCompleted({
            transactionDbId: payment.id,
            refundId: refund.refundId,
          });
        }
      } else if (status === "FAILED") {
        updatedRefund = await refundService.markRefundRequestFailed({
          refundRequest: refund,
          resolutionNote:
            resolutionNote ?? "Refund failed during gateway processing.",
        });

        const payment =
          await paymentTransactionService.getTransactionByPaymentId(
            refund.paymentId,
          );

        if (payment) {
          await paymentTransactionService.updateTransaction(payment.id, {
            refundStatus: "FAILED",
          });
        }
      } else {
        updatedRefund = await refundService.updateRefundRequest(refund.id, {
          status,
          gatewayRefundReferenceId,
          resolutionNote,
        });
      }

      setRefundRequests((previousRefunds) =>
        previousRefunds.map((currentRefund) =>
          currentRefund.id === updatedRefund.id ? updatedRefund : currentRefund,
        ),
      );

      showToast(
        "Refund updated",
        `Refund ${updatedRefund.refundId} moved to ${formatRefundStatusLabel(
          updatedRefund.status,
        )}.`,
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update refund request.";

      showToast("Refund update failed", message, "danger");
    } finally {
      setUpdatingRefundId("");
    }
  };

  const handleClearFilters = (): void => {
    setSearchText("");
    setStatusFilter("ALL");
    setTeamFilter("ALL");
    setCreatedByFilter("ALL");
  };

  const hasActiveFilters =
    searchText.trim().length > 0 ||
    statusFilter !== "ALL" ||
    teamFilter !== "ALL" ||
    createdByFilter !== "ALL";

  if (isLoading) {
    return (
      <main className="refund-queue-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading refund queue..." />
        </div>
      </main>
    );
  }

  return (
    <main className="refund-queue-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Refund Queue</h1>
              <p className="text-muted mb-0">
                Review, initiate, process, complete, or fail refund requests
                created by payment and order workflows.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary support-agent-header-btn"
              onClick={() => void loadRefundQueue()}
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
          <div className="alert alert-info d-flex align-items-start gap-2">
            <i className="bi bi-shield-check mt-1" />
            <div>
              <strong>Team scoped refund access enabled.</strong>
              <div className="small">
                You are viewing refund requests available for{" "}
                <strong>{currentTeamMember.teamCode}</strong>.
              </div>
            </div>
          </div>
        ) : null}

        <div className="row g-3 mb-4">
          <div className="col-md-4 col-xl-2">
            <div className="refund-summary-card">
              <span>Total</span>
              <strong>{summary.total}</strong>
            </div>
          </div>

          <div className="col-md-4 col-xl-2">
            <div className="refund-summary-card">
              <span>Pending</span>
              <strong className="text-warning">{summary.pendingReview}</strong>
            </div>
          </div>

          <div className="col-md-4 col-xl-2">
            <div className="refund-summary-card">
              <span>Initiated</span>
              <strong className="text-info">{summary.initiated}</strong>
            </div>
          </div>

          <div className="col-md-4 col-xl-2">
            <div className="refund-summary-card">
              <span>Processing</span>
              <strong className="text-primary">{summary.processing}</strong>
            </div>
          </div>

          <div className="col-md-4 col-xl-2">
            <div className="refund-summary-card">
              <span>Completed</span>
              <strong className="text-success">{summary.completed}</strong>
            </div>
          </div>

          <div className="col-md-4 col-xl-2">
            <div className="refund-summary-card">
              <span>Failed</span>
              <strong className="text-danger">{summary.failed}</strong>
            </div>
          </div>
        </div>

        <div className="refund-total-amount-card bg-white border rounded-4 p-3 mb-4">
          <span className="text-muted fw-semibold">Total Refund Amount</span>
          <strong className="fs-4 ms-2">
            ₹{summary.totalAmount.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="support-ticket-toolbar bg-white border rounded-4 p-3 mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-4">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                placeholder="Refund, payment, order, customer, reference"
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
                  setStatusFilter(event.target.value as RefundStatusFilter)
                }
              >
                <option value="ALL">All</option>
                {refundStatusOptions.map(
                  (option: { value: string; label: string }) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">Team</label>
              <select
                className="form-select"
                value={teamFilter}
                onChange={(event) =>
                  setTeamFilter(event.target.value as RefundTeamFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="REFUND_TEAM">Refund Team</option>
                <option value="PAYMENT_FINANCE">Payment Finance</option>
              </select>
            </div>

            <div className="col-md-4 col-lg-2">
              <label className="form-label fw-semibold">Created By</label>
              <select
                className="form-select"
                value={createdByFilter}
                onChange={(event) =>
                  setCreatedByFilter(
                    event.target.value as RefundCreatedByFilter,
                  )
                }
              >
                <option value="ALL">All</option>
                <option value="SYSTEM">System</option>
                <option value="SUPPORT">Support</option>
                <option value="ADMIN">Admin</option>
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

        {filteredRefundRequests.length === 0 ? (
          <EmptyState
            title="No refund requests found"
            message="No refund requests match the selected filters."
            iconClassName="bi bi-arrow-counterclockwise text-primary"
          />
        ) : (
          <div className="row g-3">
            {filteredRefundRequests.map((refund) => (
              <div className="col-xl-6" key={refund.id}>
                <RefundRequestCard
                  refund={refund}
                  isUpdating={updatingRefundId === refund.id}
                  onUpdateStatus={handleUpdateRefundStatus}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default RefundQueuePage;
