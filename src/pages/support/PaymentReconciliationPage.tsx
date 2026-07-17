import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import PaymentReconciliationCard from "../../components/support/PaymentReconciliationCard";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { checkoutPaymentSessionService } from "../../services/checkoutPaymentSessionService";
import { paymentTransactionService } from "../../services/paymentTransactionService";
import { refundService } from "../../services/refundService";
import { supportTeamService } from "../../services/supportTeamService";
import type { CheckoutPaymentSession } from "../../types/checkoutPayment";
import type { PaymentTransaction } from "../../types/payment";
import type { RefundRequest } from "../../types/refund";
import type { SupportTeamMember } from "../../types/supportTeam";
import {
  buildPaymentReconciliationRecords,
  type PaymentReconciliationIssueType,
  type PaymentReconciliationRecord,
  type PaymentReconciliationSeverity
} from "../../utils/paymentReconciliationUtils";

type ReconciliationIssueFilter = "ALL" | PaymentReconciliationIssueType;
type ReconciliationSeverityFilter = "ALL" | PaymentReconciliationSeverity;

const PaymentReconciliationPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [sessions, setSessions] = useState<CheckoutPaymentSession[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [currentTeamMember, setCurrentTeamMember] = useState<SupportTeamMember | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [creatingRefundPaymentId, setCreatingRefundPaymentId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [searchText, setSearchText] = useState<string>("");
  const [issueFilter, setIssueFilter] = useState<ReconciliationIssueFilter>("ALL");
  const [severityFilter, setSeverityFilter] = useState<ReconciliationSeverityFilter>("ALL");

  const loadReconciliationData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [paymentData, sessionData, refundData] = await Promise.all([
        paymentTransactionService.getTransactions(),
        checkoutPaymentSessionService.getSessions(),
        refundService.getRefundRequests()
      ]);

      setPayments(paymentData);
      setSessions(sessionData);
      setRefundRequests(refundData);
    } catch {
      setErrorMessage(
        "Unable to load payment reconciliation data. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReconciliationData();
  }, [loadReconciliationData]);

  useEffect(() => {
    let isMounted = true;
    
    const loadCurrentTeamMember = async (): Promise<void> => {
      if (!currentUser || currentUser.role !== "SUPPORT") {
        if (isMounted) setCurrentTeamMember(null);
        return;
      }

      try {
        const member = await supportTeamService.getMemberByUserId(currentUser.id);
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

  const canViewReconciliation = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === "ADMIN") return true;
    
    if (currentUser.role === "SUPPORT") {
      return (
        !currentTeamMember ||
        currentTeamMember.teamCode === "PAYMENT_FINANCE" ||
        currentTeamMember.teamCode === "REFUND_TEAM"
      );
    }
    
    return false;
  }, [currentUser, currentTeamMember]);

  const reconciliationRecords = useMemo(() => {
    if (!canViewReconciliation) {
      return [];
    }

    return buildPaymentReconciliationRecords({
      payments,
      sessions,
      refundRequests
    });
  }, [payments, sessions, refundRequests, canViewReconciliation]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return reconciliationRecords.filter((record) => {
      const matchesIssue = issueFilter === "ALL" || record.issueType === issueFilter;
      const matchesSeverity = severityFilter === "ALL" || record.severity === severityFilter;

      if (!matchesIssue || !matchesSeverity) return false;

      const searchableText = [
        record.payment.paymentId,
        record.payment.orderId ?? "",
        record.payment.checkoutReferenceId ?? "",
        record.payment.gatewayReferenceId ?? "",
        record.payment.status,
        record.payment.gatewayStatus ?? "",
        record.payment.issueFlag ?? "",
        record.checkoutSession?.checkoutReferenceId ?? "",
        record.checkoutSession?.status ?? "",
        record.title,
        record.description
      ]
        .join(" ")
        .toLowerCase();

      return !normalizedSearch || searchableText.includes(normalizedSearch);
    });
  }, [reconciliationRecords, searchText, issueFilter, severityFilter]);

  const summary = useMemo(() => {
    let danger = 0;
    let warning = 0;
    let ok = 0;
    let refundCreatable = 0;

    for (let i = 0; i < reconciliationRecords.length; i++) {
      const record = reconciliationRecords[i];
      if (record.severity === "DANGER") danger++;
      if (record.severity === "WARNING") warning++;
      if (record.severity === "OK") ok++;
      if (record.canCreateRefundRequest) refundCreatable++;
    }

    return {
      total: reconciliationRecords.length,
      danger,
      warning,
      ok,
      refundCreatable
    };
  }, [reconciliationRecords]);

  // FIXED: Wrapped in useCallback to protect against stale closures on current user references
  const handleCreateRefundRequest = useCallback(async (
    record: PaymentReconciliationRecord
  ): Promise<void> => {
    try {
      setCreatingRefundPaymentId(record.payment.paymentId);

      const refundRequest = await refundService.createRefundRequest({
        paymentId: record.payment.paymentId,
        orderId: record.payment.orderId ?? null,
        userId: record.payment.userId,
        userName: record.checkoutSession?.checkoutSnapshot.user.name,
        amount: record.payment.amount,
        refundMode: "ORIGINAL_PAYMENT_MODE",
        reason: record.recommendedAction,
        createdBy: currentUser?.role === "ADMIN" ? "ADMIN" : "SUPPORT",
        assignedTeam: "REFUND_TEAM"
      });

      await paymentTransactionService.markRefundRequired({
        transactionDbId: record.payment.id,
        refundId: refundRequest.refundId,
        issueFlag:
          record.issueType === "DUPLICATE_SUCCESSFUL_PAYMENT"
            ? "DUPLICATE_DEBIT"
            : "ORDER_NOT_CREATED"
      });

      showToast(
        "Refund request created",
        `Refund request ${refundRequest.refundId} has been assigned to Refund Team.`,
        "success"
      );

      await loadReconciliationData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create refund request.";
      showToast("Refund request failed", message, "danger");
    } finally {
      setCreatingRefundPaymentId("");
    }
  }, [currentUser, showToast, loadReconciliationData]);

  const handleClearFilters = (): void => {
    setSearchText("");
    setIssueFilter("ALL");
    setSeverityFilter("ALL");
  };

  const hasActiveFilters =
    searchText.trim().length > 0 ||
    issueFilter !== "ALL" ||
    severityFilter !== "ALL";

  if (isLoading) {
    return (
      <main className="payment-reconciliation-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading payment reconciliation..." />
        </div>
      </main>
    );
  }

  return (
    <main className="payment-reconciliation-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Payment Reconciliation</h1>
              <p className="text-muted mb-0">
                Detect payment mismatches, duplicate debit, missing orders, and refund gaps.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary support-agent-header-btn"
              onClick={() => void loadReconciliationData()}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {!canViewReconciliation ? (
          <div className="alert alert-warning">
            You do not have access to payment reconciliation.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        ) : null}

        {canViewReconciliation ? (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="payment-reconciliation-summary-card">
                  <span>Total</span>
                  <strong>{summary.total}</strong>
                </div>
              </div>

              <div className="col-md-3">
                <div className="payment-reconciliation-summary-card">
                  <span>Critical</span>
                  <strong className="text-danger">{summary.danger}</strong>
                </div>
              </div>

              <div className="col-md-3">
                <div className="payment-reconciliation-summary-card">
                  <span>Warnings</span>
                  <strong className="text-warning">{summary.warning}</strong>
                </div>
              </div>

              <div className="col-md-3">
                <div className="payment-reconciliation-summary-card">
                  <span>Refund Needed</span>
                  <strong>{summary.refundCreatable}</strong>
                </div>
              </div>
            </div>

            <div className="support-ticket-toolbar bg-white border rounded-4 p-3 mb-4">
              <div className="row g-3 align-items-end">
                <div className="col-lg-5">
                  <label className="form-label fw-semibold">Search</label>
                  <input
                    className="form-control"
                    placeholder="Payment, order, checkout, gateway, issue"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </div>

                <div className="col-md-4 col-lg-3">
                  <label className="form-label fw-semibold">Issue</label>
                  <select
                    className="form-select"
                    value={issueFilter}
                    onChange={(event) =>
                      setIssueFilter(event.target.value as ReconciliationIssueFilter)
                    }
                  >
                    <option value="ALL">All</option>
                    <option value="CAPTURED_PAYMENT_WITHOUT_ORDER">Captured Without Order</option>
                    <option value="DUPLICATE_SUCCESSFUL_PAYMENT">Duplicate Successful Payment</option>
                    <option value="REFUND_REQUIRED_MISSING_REQUEST">Refund Missing Request</option>
                    <option value="PENDING_GATEWAY_STALE">Stale Pending Gateway</option>
                    <option value="FAILED_PAYMENT_WITH_ACTIVE_SESSION">Failed Payment Active Session</option>
                    <option value="SESSION_PAYMENT_STATUS_MISMATCH">Session Payment Mismatch</option>
                    <option value="HEALTHY">Healthy</option>
                  </select>
                </div>

                <div className="col-md-4 col-lg-2">
                  <label className="form-label fw-semibold">Severity</label>
                  <select
                    className="form-select"
                    value={severityFilter}
                    onChange={(event) =>
                      setSeverityFilter(event.target.value as ReconciliationSeverityFilter)
                    }
                  >
                    <option value="ALL">All</option>
                    <option value="DANGER">Danger</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                    <option value="OK">OK</option>
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

            {filteredRecords.length === 0 ? (
              <EmptyState
                title="No reconciliation records found"
                message="No payment records match the selected filters."
                iconClassName="bi bi-shield-check text-primary"
              />
            ) : (
              <div className="row g-3">
                {filteredRecords.map((record) => (
                  <div className="col-xl-6" key={record.id}>
                    <PaymentReconciliationCard
                      record={record}
                      isCreatingRefund={creatingRefundPaymentId === record.payment.paymentId}
                      onCreateRefundRequest={handleCreateRefundRequest}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
};

export default PaymentReconciliationPage;