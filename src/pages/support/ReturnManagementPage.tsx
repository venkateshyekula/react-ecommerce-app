import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import Pagination from "../../components/common/Pagination";
import ReturnPickupAssignmentPanel from "../../components/returns/ReturnPickupAssignmentPanel";
import ReturnRequestCard from "../../components/returns/ReturnRequestCard";
import { useToast } from "../../context/useToast";
import { returnPickupService } from "../../services/returnPickupService";
import { returnRequestService } from "../../services/returnRequestService";
import type {
  ReturnRequest,
  ReturnRequestStatus,
} from "../../types/returnRequest";
import type {
  ReturnPickupAttempt,
  ReturnPickupPartner,
} from "../../types/returnPickup";
import { returnStatusOptions } from "../../utils/returnWorkflowUtils";

type ReturnStatusFilter = "ALL" | ReturnRequestStatus;

const ITEMS_PER_PAGE = 6;

const ReturnManagementPage = () => {
  const { showToast } = useToast();

  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [partners, setPartners] = useState<ReturnPickupPartner[]>([]);
  const [attemptsByReturnId, setAttemptsByReturnId] = useState<
    Record<string, ReturnPickupAttempt[]>
  >({});

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedReturnId, setSelectedReturnId] = useState<string>("");

  const isMounted = useRef<boolean>(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadReturns = useCallback(async (): Promise<void> => {
    try {
      if (isMounted.current) {
        setIsLoading(true);
      }

      const [returnData, partnerData] = await Promise.all([
        returnRequestService.getReturnRequests(),
        returnPickupService.getPickupPartners(),
      ]);

      const attemptEntries = await Promise.all(
        returnData.map(async (request) => {
          const returnId = request.returnRequestId ?? request.requestId;
          const attempts = await returnPickupService.getAttemptsByReturnRequestId(returnId);
          return [returnId, attempts] as const;
        }),
      );

      if (isMounted.current) {
        setRequests(returnData);
        setPartners(partnerData);
        setAttemptsByReturnId(Object.fromEntries(attemptEntries));
      }
    } catch {
      if (isMounted.current) {
        showToast(
          "Returns load failed",
          "Unable to load return requests.",
          "danger",
        );
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [showToast]);

  useEffect(() => {
    void loadReturns();
  }, [loadReturns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return requests.filter((request) => {
      if (statusFilter !== "ALL" && request.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const requestDisplayId = request.returnRequestId ?? request.requestId ?? "";

      const searchableText = [
        requestDisplayId,
        request.orderId,
        request.orderDbId,
        request.userId,
        request.userName ?? "",
        request.userEmail ?? "",
        request.returnReason ?? request.reason,
        request.comments ?? "",
        request.customerComment ?? "",
        request.status,
        request.pickupStatus ?? "",
        request.pickupPartnerName ?? "",
        request.qualityCheckStatus ?? "",
        request.refundStatus ?? "",
        request.refundId ?? "",
        request.adminRemarks ?? "",
        request.qualityCheckRemarks ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [requests, searchText, statusFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  }, [filteredRequests.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, currentPage]);

  const selectedReturnRequest = useMemo(() => {
    if (filteredRequests.length === 0) {
      return null;
    }
    if (!selectedReturnId) {
      return filteredRequests[0];
    }
    return (
      filteredRequests.find((request) => request.id === selectedReturnId) ??
      filteredRequests[0]
    );
  }, [filteredRequests, selectedReturnId]);

  // FIXED: Added check to prevent resetting selection during mid-action async states
  useEffect(() => {
    if (filteredRequests.length === 0) {
      setSelectedReturnId("");
      return;
    }

    const selectedRequestStillExists = filteredRequests.some(
      (request) => request.id === selectedReturnId,
    );

    if (!selectedReturnId || (!selectedRequestStillExists && selectedReturnId !== updatingId)) {
      setSelectedReturnId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedReturnId, updatingId]);

  const updateRequestInState = useCallback((updated: ReturnRequest): void => {
    setRequests((previousRequests) =>
      previousRequests.map((request) =>
        request.id === updated.id ? updated : request,
      ),
    );
  }, []);

  // FIXED: Corrected key-mapping implementation using computed properties
  const updateAttemptsInState = useCallback(
    (returnRequestId: string, attempts: ReturnPickupAttempt[]): void => {
      setAttemptsByReturnId((previousState) => ({
        ...previousState,
        [returnRequestId]: attempts,
      }));
    },
    [],
  );

  const runAction = async (
    request: ReturnRequest,
    action: () => Promise<ReturnRequest>,
    successMessage: string,
  ): Promise<void> => {
    try {
      setUpdatingId(request.id);
      const updated = await action();

      if (isMounted.current) {
        updateRequestInState(updated);
        showToast("Return updated", successMessage, "success");
      }
    } catch (error) {
      if (isMounted.current) {
        const message = error instanceof Error ? error.message : "Unable to update return.";
        showToast("Return update failed", message, "danger");
      }
    } finally {
      if (isMounted.current) {
        setUpdatingId("");
      }
    }
  };

  const runPickupAction = async (
    request: ReturnRequest,
    action: () => Promise<{
      request: ReturnRequest;
      attempt: ReturnPickupAttempt;
    }>,
    successMessage: string,
  ): Promise<void> => {
    try {
      setUpdatingId(request.id);
      const result = await action();
      const returnId = result.request.returnRequestId ?? result.request.requestId;
      const latestAttempts = await returnPickupService.getAttemptsByReturnRequestId(returnId);

      if (isMounted.current) {
        updateRequestInState(result.request);
        updateAttemptsInState(returnId, latestAttempts);
        setSelectedReturnId(result.request.id);
        showToast("Pickup updated", successMessage, "success");
      }
    } catch (error) {
      if (isMounted.current) {
        const message = error instanceof Error ? error.message : "Unable to update pickup.";
        showToast("Pickup update failed", message, "danger");
      }
    } finally {
      if (isMounted.current) {
        setUpdatingId("");
      }
    }
  };

  const handleClearFilters = (): void => {
    setSearchText("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchText.trim().length > 0 || statusFilter !== "ALL";
  const resultStart = filteredRequests.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const resultEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length);

  if (isLoading) {
    return (
      <main className="return-management-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading return management..." />
        </div>
      </main>
    );
  }

  return (
    <main className="return-management-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Return Management</h1>
              <p className="text-muted mb-0">
                Manage return pickup, partner attempts, warehouse receipt, quality check, and refund initiation.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => void loadReturns()}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <div className="support-ticket-toolbar bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-6">
              <label className="form-label fw-semibold small">Search Returns</label>
              <input
                className="form-control"
                placeholder="Search by return ID, order, user, partner, refund, status..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-lg-3">
              <label className="form-label fw-semibold small">Workflow Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ReturnStatusFilter)}
              >
                <option value="ALL">All Statuses</option>
                {returnStatusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-3">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!hasActiveFilters}
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <p className="text-muted small mb-0">
            Showing <strong>{resultStart}</strong> to <strong>{resultEnd}</strong> of <strong>{filteredRequests.length}</strong> return requests
          </p>
          {totalPages > 1 ? (
            <p className="text-muted small mb-0">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </p>
          ) : null}
        </div>

        {filteredRequests.length === 0 ? (
          <EmptyState
            title="No return requests found"
            message="No active records match the selected filters."
            iconClassName="bi bi-arrow-return-left text-primary"
          />
        ) : (
          <>
            <div className="row g-3 align-items-start">
              <div className="col-xl-7">
                <div className="d-flex flex-column gap-3">
                  {paginatedRequests.map((request) => (
                    <div
                      className={`return-management-select-card ${
                        selectedReturnRequest?.id === request.id ? "active" : ""
                      }`}
                      key={request.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedReturnId(request.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          setSelectedReturnId(request.id);
                        }
                      }}
                    >
                      <ReturnRequestCard
                        request={request}
                        mode="SUPPORT"
                        isUpdating={updatingId === request.id}
                        onApprove={(currentRequest, remarks) =>
                          runAction(
                            currentRequest,
                            () => returnRequestService.approveReturn({ request: currentRequest, adminRemarks: remarks }),
                            "Return request approved successfully.",
                          )
                        }
                        onReject={(currentRequest, remarks) =>
                          runAction(
                            currentRequest,
                            () => returnRequestService.rejectReturn({ request: currentRequest, adminRemarks: remarks }),
                            "Return request rejected successfully.",
                          )
                        }
                        onReceivedAtWarehouse={(currentRequest, remarks) =>
                          runAction(
                            currentRequest,
                            () => returnRequestService.markReceivedAtWarehouse({ request: currentRequest, adminRemarks: remarks }),
                            "Return status shifted to received at warehouse.",
                          )
                        }
                        onStartQualityCheck={(currentRequest, remarks) =>
                          runAction(
                            currentRequest,
                            () => returnRequestService.startQualityCheck({ request: currentRequest, qualityCheckRemarks: remarks }),
                            "Quality check started successfully.",
                          )
                        }
                        onQualityCheckPassed={(currentRequest, remarks) =>
                          runAction(
                            currentRequest,
                            () => returnRequestService.passQualityCheckAndCreateRefund({ request: currentRequest, qualityCheckRemarks: remarks }),
                            "Quality inspection passed and refund request created.",
                          )
                        }
                        onQualityCheckFailed={(currentRequest, remarks) =>
                          runAction(
                            currentRequest,
                            () => returnRequestService.failQualityCheck({ request: currentRequest, qualityCheckRemarks: remarks }),
                            "Quality check failure confirmed.",
                          )
                        }
                        onRefundCompleted={(currentRequest, remarks) =>
                          runAction(
                            currentRequest,
                            () => returnRequestService.markRefundCompleted({ request: currentRequest, adminRemarks: remarks }),
                            "Refund marked completed successfully.",
                          )
                        }
                        onClose={(currentRequest, remarks) =>
                          runAction(
                            currentRequest,
                            () => returnRequestService.closeReturn({ request: currentRequest, adminRemarks: remarks }),
                            "Return request closed successfully.",
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-xl-5">
                <div className="return-pickup-side-panel">
                  {selectedReturnRequest ? (
                    <ReturnPickupAssignmentPanel
                      request={selectedReturnRequest}
                      partners={partners}
                      attempts={
                        attemptsByReturnId[
                          selectedReturnRequest.returnRequestId ?? selectedReturnRequest.requestId
                        ] ?? []
                      }
                      isUpdating={updatingId === selectedReturnRequest.id}
                      onAssignPartner={({ request: currentRequest, partner, pickupDate, pickupSlot, remarks }) =>
                        runPickupAction(
                          currentRequest,
                          () => returnPickupService.assignPickupPartner({ request: currentRequest, partner, pickupDate, pickupSlot, remarks }),
                          "Pickup partner assigned successfully.",
                        )
                      }
                      onMarkOutForPickup={({ request: currentRequest, attempt, remarks }) =>
                        runPickupAction(
                          currentRequest,
                          () => returnPickupService.markOutForPickup({ request: currentRequest, attempt, remarks }),
                          "Pickup marked out for pickup.",
                        )
                      }
                      onMarkPickedUp={({ request: currentRequest, attempt, partner, remarks }) =>
                        runPickupAction(
                          currentRequest,
                          () => returnPickupService.markPickedUp({ request: currentRequest, attempt, partner, remarks }),
                          "Pickup completed successfully.",
                        )
                      }
                      onMarkFailedAttempt={({ request: currentRequest, attempt, failureReason }) =>
                        runPickupAction(
                          currentRequest,
                          () => returnPickupService.markFailedAttempt({ request: currentRequest, attempt, failureReason }),
                          "Pickup failed attempt recorded.",
                        )
                      }
                      onReschedulePickup={({ request: currentRequest, previousAttempt, partner, pickupDate, pickupSlot, remarks }) =>
                        runPickupAction(
                          currentRequest,
                          () => returnPickupService.reschedulePickupAttempt({ request: currentRequest, previousAttempt, partner, pickupDate, pickupSlot, remarks }),
                          "Pickup rescheduled successfully.",
                        )
                      }
                    />
                  ) : (
                    <div className="bg-white border rounded-4 p-4 text-muted">
                      Select a return request to manage pickup assignment.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {totalPages > 1 ? (
              <div className="d-flex justify-content-center mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredRequests.length}
                  startItem={resultStart}
                  endItem={resultEnd}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(size) => console.log(`Change page size to: ${size}`)}
                />
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
};

export default ReturnManagementPage;