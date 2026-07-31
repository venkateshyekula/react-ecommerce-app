import { useCallback, useEffect, useRef, useState } from "react";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import CustomerCompensationPanel from "../components/returns/CustomerCompensationPanel";
import CustomerRefundStatusCard from "../components/returns/CustomerRefundStatusCard";
import CustomerReturnExperienceTimeline from "../components/returns/CustomerReturnExperienceTimeline";
import CustomerReturnHelpPanel from "../components/returns/CustomerReturnHelpPanel";
import CustomerReturnQcSummaryCard from "../components/returns/CustomerReturnQcSummaryCard";
import ReturnRequestCard from "../components/returns/ReturnRequestCard";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { returnRequestService } from "../services/returnRequestService";
import type { ReturnRequest } from "../types/returnRequest";

const getStringValue = (
  request: ReturnRequest,
  keys: string[],
  fallback = "Not available"
): string => {
  const source = request as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
};

const formatStatusText = (status: string): string => {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getReturnCustomerStatusClassName = (request: ReturnRequest): string => {
  const status = getStringValue(
    request,
    ["status", "returnStatus", "requestStatus"],
    "Pending"
  ).toUpperCase();

  if (["COMPLETED", "REFUND_COMPLETED", "CLOSED"].includes(status)) {
    return "text-bg-success";
  }

  if (["REJECTED", "CANCELLED", "QC_REJECTED"].includes(status)) {
    return "text-bg-danger";
  }

  if (["REFUND_INITIATED", "QC_COMPLETED", "PROCESSING"].includes(status)) {
    return "text-bg-info";
  }

  if (["PICKUP_ASSIGNED", "OUT_FOR_PICKUP", "PICKED_UP"].includes(status)) {
    return "text-bg-primary";
  }

  return "text-bg-warning";
};

const MyReturnsPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string>("");
  const [expandedReturnId, setExpandedReturnId] = useState<string>("");

  const isMounted = useRef<boolean>(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadReturns = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      if (isMounted.current) {
        setReturns([]);
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);

      const data = await returnRequestService.getReturnRequestsByUserId(
        currentUser.id
      );

      if (isMounted.current) {
        setReturns(data);

        if (data.length > 0) {
          setExpandedReturnId((prev) =>
            data.some((item) => item.id === prev) ? prev : data[0].id
          );
        }
      }
    } catch {
      showToast(
        "Returns load failed",
        "Unable to load your return requests.",
        "warning"
      );
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    void loadReturns();
  }, [loadReturns]);

  const handleCancel = useCallback(
    async (request: ReturnRequest, remarks?: string): Promise<void> => {
      try {
        setUpdatingId(request.id);

        const updated = await returnRequestService.cancelReturn({
          request,
          adminRemarks: remarks,
        });

        if (isMounted.current) {
          setReturns((previousReturns) =>
            previousReturns.map((item) =>
              item.id === updated.id ? updated : item
            )
          );

          showToast(
            "Return cancelled",
            "Return request has been cancelled.",
            "success"
          );
        }
      } catch {
        showToast(
          "Cancel failed",
          "Unable to cancel return request.",
          "danger"
        );
      } finally {
        if (isMounted.current) {
          setUpdatingId("");
        }
      }
    },
    [showToast]
  );

  const handleToggleExpandedReturn = useCallback((returnId: string): void => {
    setExpandedReturnId((previousValue) =>
      previousValue === returnId ? "" : returnId
    );
  }, []);

  const handleContactSupport = useCallback(
    (request: ReturnRequest): void => {
      showToast(
        "Support options",
        `Connecting to support for Return #${request.id}...`,
        "info"
      );
    },
    [showToast]
  );

  const handleRaiseIssue = useCallback(
    (request: ReturnRequest): void => {
      showToast(
        "Issue ticket",
        `Opening ticket creation for Return #${request.id}...`,
        "warning"
      );
    },
    [showToast]
  );

  if (isLoading) {
    return (
      <main className="my-returns-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading returns..." />
        </div>
      </main>
    );
  }

  return (
    <main className="my-returns-page customer-return-experience-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">My Returns</h1>
              <p className="text-muted mb-0">
                Track return pickup, warehouse quality check, refund settlement,
                and compensation status.
              </p>
            </div>

            <div className="customer-return-header-card p-3 bg-light border rounded">
              <span className="text-muted small d-block">Total returns</span>
              <strong className="fs-4">{returns.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {returns.length === 0 ? (
          <EmptyState
            title="No return requests"
            message="You have not raised any return requests yet."
            iconClassName="bi bi-arrow-return-left text-primary"
          />
        ) : (
          <div className="row g-4">
            {returns.map((request) => {
              const isExpanded = expandedReturnId === request.id;
              const rawStatus = getStringValue(
                request,
                ["status", "returnStatus", "requestStatus"],
                "Pending"
              );
              const displayStatus = formatStatusText(rawStatus);

              return (
                <div className="col-xl-12" key={request.id}>
                  <div className="customer-return-shell bg-white border rounded shadow-sm overflow-hidden">
                    <div className="customer-return-shell-header p-3 border-bottom d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 bg-light-subtle">
                      <div>
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                          <h2 className="h5 fw-bold mb-0">
                            Return #{request.id}
                          </h2>
                          <span
                            className={`badge rounded-pill ${getReturnCustomerStatusClassName(
                              request
                            )}`}
                          >
                            {displayStatus}
                          </span>
                        </div>

                        <p className="text-muted small mb-0">
                          Order ID:{" "}
                          <span className="fw-semibold text-dark">
                            {getStringValue(request, ["orderId", "orderNumber"])}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => handleToggleExpandedReturn(request.id)}
                        aria-expanded={isExpanded}
                      >
                        <i
                          className={`bi ${
                            isExpanded ? "bi-chevron-up" : "bi-chevron-down"
                          } me-2`}
                        />
                        {isExpanded ? "Hide details" : "View full details"}
                      </button>
                    </div>

                    <div className="customer-return-card-wrapper p-3">
                      <ReturnRequestCard
                        request={request}
                        mode="CUSTOMER"
                        isUpdating={updatingId === request.id}
                        onCancel={handleCancel}
                      />
                    </div>

                    {isExpanded && (
                      <div className="customer-return-expanded-area p-3 border-top bg-light-subtle">
                        <div className="row g-3">
                          <div className="col-12">
                            <CustomerReturnExperienceTimeline request={request} />
                          </div>

                          <div className="col-xl-4 col-lg-6">
                            <CustomerReturnQcSummaryCard request={request} />
                          </div>

                          <div className="col-xl-4 col-lg-6">
                            <CustomerRefundStatusCard request={request} />
                          </div>

                          <div className="col-xl-4">
                            <CustomerCompensationPanel request={request} />
                          </div>

                          <div className="col-12">
                            <CustomerReturnHelpPanel
                              request={request}
                              onContactSupport={() => handleContactSupport(request)}
                              onRaiseIssue={() => handleRaiseIssue(request)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default MyReturnsPage;