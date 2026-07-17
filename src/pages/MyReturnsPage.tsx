import { useCallback, useEffect, useState, useRef } from "react";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import ReturnRequestCard from "../components/returns/ReturnRequestCard";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import { returnRequestService } from "../services/returnRequestService";
import type { ReturnRequest } from "../types/returnRequest";

const MyReturnsPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string>(``);
  
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

  const handleCancel = useCallback(async (
    request: ReturnRequest,
    remarks?: string
  ): Promise<void> => {
    try {
      setUpdatingId(request.id);

      const updated = await returnRequestService.cancelReturn({
        request,
        adminRemarks: remarks
      });

      if (isMounted.current) {
        setReturns((previousReturns) =>
          previousReturns.map((item) => (item.id === updated.id ? updated : item))
        );
        showToast("Return cancelled", "Return request has been cancelled.", "success");
      }
    } catch {
      showToast("Cancel failed", "Unable to cancel return request.", "danger");
    } finally {
      if (isMounted.current) {
        setUpdatingId("");
      }
    }
  }, [showToast]);

  // Dummy no-op handlers to satisfy strict props typing when in customer mode
  const noOpAsync = useCallback(async () => Promise.resolve(), []);

  if (isLoading) {
    return (
      <main className="my-returns-page bg-light">
        <div className="container py-5">
          <Loader message="Loading returns..." />
        </div>
      </main>
    );
  }

  return (
    <main className="my-returns-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <h1 className="fw-bold mb-1">My Returns</h1>
          <p className="text-muted mb-0">
            Track return pickup, quality check, and refund status.
          </p>
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
          <div className="row g-3">
            {returns.map((request) => (
              <div className="col-xl-6" key={request.id}>
                <ReturnRequestCard
                  request={request}
                  mode="CUSTOMER"
                  isUpdating={updatingId === request.id}
                  onCancel={handleCancel}
                  // Satisfying strict layout constraints for the support paths
                  onApprove={noOpAsync}
                  onReject={noOpAsync}
                  onSchedulePickup={noOpAsync}
                  onPickupCompleted={noOpAsync}
                  onReceivedAtWarehouse={noOpAsync}
                  onStartQualityCheck={noOpAsync}
                  onQualityCheckPassed={noOpAsync}
                  onQualityCheckFailed={noOpAsync}
                  onRefundCompleted={noOpAsync}
                  onClose={noOpAsync}
                  onPickupOutForPickup={noOpAsync}
                  onPickupFailedAttempt={noOpAsync}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MyReturnsPage;