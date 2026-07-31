import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import ReturnRefundSettlementPanel from "../../components/returns/ReturnRefundSettlementPanel";
import ReturnStatusBadge from "../../components/returns/ReturnStatusBadge";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { returnRefundSettlementService } from "../../services/returnRefundSettlementService";
import { returnRequestService } from "../../services/returnRequestService";
import type { ReturnRequest } from "../../types/returnRequest";
import type { ReturnRefundSettlement } from "../../types/returnRefundSettlement";
import { formatCurrency } from "../../utils/currencyFormatter";
import {
  formatSettlementLabel,
  getReturnRefundAmount,
  getSettlementStatusBadgeClass,
  isReturnEligibleForRefundSettlement,
} from "../../utils/returnRefundSettlementUtils";

type SettlementFilter =
  | "ALL"
  | "NOT_STARTED"
  | "QUEUED"
  | "PROCESSING"
  | "SETTLED"
  | "FAILED"
  | "MANUAL_REVIEW";

const getReturnDisplayId = (request: ReturnRequest): string => {
  return request.returnRequestId ?? request.requestId;
};

const ReturnRefundSettlementPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const canManageSettlement =
    currentUser?.role === "ADMIN" ||
    currentUser?.supportTeamCode === "REFUND_TEAM" ||
    currentUser?.supportTeamCode === "PAYMENT_FINANCE";

  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [settlementsByReturnId, setSettlementsByReturnId] = useState<
    Record<string, ReturnRefundSettlement>
  >({});
  const [selectedReturnId, setSelectedReturnId] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [filter, setFilter] = useState<SettlementFilter>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSettlementDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const [returnRequests, settlements] = await Promise.all([
        returnRequestService.getReturnRequests(),
        returnRefundSettlementService.getSettlements(),
      ]);

      const eligibleRequests = returnRequests.filter(
        isReturnEligibleForRefundSettlement,
      );

      const groupedSettlements = settlements.reduce<
        Record<string, ReturnRefundSettlement>
      >((accumulator, settlement) => {
        accumulator[settlement.returnRequestId] = settlement;
        return accumulator;
      }, {});

      setRequests(eligibleRequests);
      setSettlementsByReturnId(groupedSettlements);

      setSelectedReturnId((previousSelectedReturnId) => {
        const stillExists = eligibleRequests.some(
          (req) => getReturnDisplayId(req) === previousSelectedReturnId,
        );

        if (stillExists) {
          return previousSelectedReturnId;
        }

        return eligibleRequests.length > 0
          ? getReturnDisplayId(eligibleRequests[0])
          : "";
      });
    } catch {
      showToast(
        "Settlement load failed",
        "Unable to load return refund settlement dashboard.",
        "danger",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadSettlementDashboard();
  }, [loadSettlementDashboard]);

  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return requests.filter((request) => {
      const returnId = getReturnDisplayId(request);
      const settlement = settlementsByReturnId[returnId];
      const settlementStatus = settlement?.settlementStatus ?? "NOT_STARTED";

      if (filter !== "ALL" && settlementStatus !== filter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        returnId,
        request.orderId,
        request.userName ?? "",
        request.userEmail ?? "",
        request.refundStatus ?? "",
        request.qualityCheckStatus ?? "",
        settlementStatus,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [filter, requests, searchText, settlementsByReturnId]);

  const selectedRequest = useMemo(() => {
    if (filteredRequests.length === 0) {
      return null;
    }

    if (!selectedReturnId) {
      return filteredRequests[0];
    }

    return (
      filteredRequests.find(
        (request) => getReturnDisplayId(request) === selectedReturnId,
      ) ?? filteredRequests[0]
    );
  }, [filteredRequests, selectedReturnId]);

  const selectedReturnDisplayId = selectedRequest
    ? getReturnDisplayId(selectedRequest)
    : "";

  const selectedSettlement = selectedReturnDisplayId
    ? settlementsByReturnId[selectedReturnDisplayId] ?? null
    : null;

  // Scoped strictly to the active eligible requests
  const summary = useMemo(() => {
    let notStarted = 0;
    let queued = 0;
    let processing = 0;
    let settled = 0;
    let failed = 0;

    requests.forEach((request) => {
      const returnId = getReturnDisplayId(request);
      const status = settlementsByReturnId[returnId]?.settlementStatus;

      switch (status) {
        case "QUEUED":
          queued++;
          break;
        case "PROCESSING":
          processing++;
          break;
        case "SETTLED":
          settled++;
          break;
        case "FAILED":
          failed++;
          break;
        default:
          notStarted++;
          break;
      }
    });

    return {
      total: requests.length,
      notStarted,
      queued,
      processing,
      settled,
      failed,
    };
  }, [requests, settlementsByReturnId]);

  const handleClearFilters = (): void => {
    setSearchText("");
    setFilter("ALL");
  };

  if (isLoading) {
    return (
      <main className="return-refund-settlement-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading return refund settlements..." />
        </div>
      </main>
    );
  }

  return (
    <main className="return-refund-settlement-page bg-light min-vh-100 pb-5">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Return Refund Settlement</h1>
              <p className="text-muted mb-0">
                Automate return refund settlement through original payment,
                wallet credit, or coupon compensation.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => void loadSettlementDashboard()}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <div className="row g-3 mb-4">
          <div className="col-6 col-md">
            <div className="return-refund-summary-card bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small d-block">Total</span>
              <strong className="fs-4">{summary.total}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="return-refund-summary-card bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small d-block">Not Started</span>
              <strong className="fs-4">{summary.notStarted}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="return-refund-summary-card bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small d-block">Queued</span>
              <strong className="fs-4 text-primary">{summary.queued}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="return-refund-summary-card bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small d-block">Processing</span>
              <strong className="fs-4 text-info">{summary.processing}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="return-refund-summary-card bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small d-block">Settled</span>
              <strong className="fs-4 text-success">{summary.settled}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="return-refund-summary-card bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small d-block">Failed</span>
              <strong className="fs-4 text-danger">{summary.failed}</strong>
            </div>
          </div>
        </div>

        <div className="support-ticket-toolbar bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-6">
              <label className="form-label small fw-semibold">
                Search Refunds
              </label>

              <input
                className="form-control"
                placeholder="Search return ID, order ID, customer, refund status..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-lg-3">
              <label className="form-label small fw-semibold">
                Settlement Status
              </label>

              <select
                className="form-select"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as SettlementFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="QUEUED">Queued</option>
                <option value="PROCESSING">Processing</option>
                <option value="SETTLED">Settled</option>
                <option value="FAILED">Failed</option>
                <option value="MANUAL_REVIEW">Manual Review</option>
              </select>
            </div>

            <div className="col-lg-3">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!searchText.trim() && filter === "ALL"}
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <EmptyState
            title="No refund settlements found"
            message="No QC-passed return refunds match the selected filters."
            iconClassName="bi bi-cash-coin text-primary"
          />
        ) : (
          <div className="row g-3 align-items-start">
            <div className="col-xl-5">
              <div className="d-flex flex-column gap-3">
                {filteredRequests.map((request) => {
                  const returnId = getReturnDisplayId(request);
                  const settlement = settlementsByReturnId[returnId];
                  const refundAmount = getReturnRefundAmount(request);
                  const isSelected = selectedReturnDisplayId === returnId;

                  return (
                    <div
                      className={`return-refund-request-card p-3 bg-white border rounded-4 shadow-sm cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary border-2 bg-primary-subtle"
                          : ""
                      }`}
                      style={{ cursor: "pointer" }}
                      key={request.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedReturnId(returnId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedReturnId(returnId);
                        }
                      }}
                    >
                      <div className="d-flex justify-content-between gap-2 mb-2">
                        <span className="badge text-bg-light border">
                          {returnId}
                        </span>

                        <span
                          className={`badge ${getSettlementStatusBadgeClass(
                            settlement?.settlementStatus ?? "NOT_STARTED",
                          )}`}
                        >
                          {formatSettlementLabel(
                            settlement?.settlementStatus ?? "NOT_STARTED",
                          )}
                        </span>
                      </div>

                      <h6 className="fw-bold mb-1">
                        Refund for order {request.orderId}
                      </h6>

                      <p className="small text-muted mb-1">
                        Customer:{" "}
                        <strong>{request.userName ?? request.userId}</strong>
                      </p>

                      <p className="small text-muted mb-2">
                        Refund Amount:{" "}
                        <strong>{formatCurrency(refundAmount)}</strong>
                      </p>

                      <div className="d-flex flex-wrap gap-2">
                        <ReturnStatusBadge
                          type="QC"
                          status={request.qualityCheckStatus ?? "PASSED"}
                        />

                        <ReturnStatusBadge
                          type="REFUND"
                          status={request.refundStatus ?? "PENDING"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-xl-7">
              {selectedRequest ? (
                <ReturnRefundSettlementPanel
                  request={selectedRequest}
                  settlement={selectedSettlement}
                  currentUser={
                    currentUser
                      ? {
                          id: currentUser.id,
                          name: currentUser.name,
                        }
                      : null
                  }
                  canManageSettlement={canManageSettlement}
                  onSettlementChanged={loadSettlementDashboard}
                />
              ) : (
                <div className="bg-white border rounded-4 p-4 text-muted">
                  Select a return refund to open settlement controls.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default ReturnRefundSettlementPage;