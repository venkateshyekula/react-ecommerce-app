import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import SellerReturnCard from "../../components/seller/SellerReturnCard";
import SellerReturnDashboardFilters, {
  type SellerReturnDisputeFilter,
  type SellerReturnPickupFilter,
  type SellerReturnQcFilter,
  type SellerReturnRefundFilter
} from "../../components/seller/SellerReturnDashboardFilters";
import SellerReturnDashboardSummary from "../../components/seller/SellerReturnDashboardSummary";
import SellerReturnDisputeModal from "../../components/seller/SellerReturnDisputeModal";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { sellerReturnDisputeService } from "../../services/sellerReturnDisputeService";
import type { ReturnRequest } from "../../types/returnRequest";
import type {
  CreateSellerReturnDisputePayload,
  SellerReturnDispute
} from "../../types/sellerReturnDispute";
import {
  canSellerRaiseReturnDispute,
  formatReturnCurrency,
  getSellerItemsFromReturn,
  getSellerNameFromReturn
} from "../../utils/sellerReturnWorkflowUtils";

const normalizeStatus = (value?: string | null): string => {
  return value?.trim().toUpperCase() ?? "";
};

const statusMatchesFilter = (status: string, filter: string): boolean => {
  if (filter === "ALL") {
    return true;
  }

  if (filter === status) {
    return true;
  }

  const aliases: Record<string, string[]> = {
    FAILED: ["FAILED", "REJECTED", "QUALITY_CHECK_FAILED", "QC_REJECTED"],
    PASSED: ["PASSED", "APPROVED", "COMPLETED"],
    PENDING: ["PENDING", "QUALITY_CHECK_PENDING", "NOT_STARTED"],
    PROCESSING: ["PROCESSING", "IN_PROGRESS"],
    PICKED_UP: ["PICKED_UP", "COMPLETED"],
    SCHEDULED: ["SCHEDULED", "PICKUP_SCHEDULED"]
  };

  return aliases[filter]?.includes(status) ?? false;
};

const SellerReturnsPage: FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const sellerId =
    (currentUser as { sellerId?: string } | null)?.sellerId ??
    currentUser?.id ??
    "";

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [disputes, setDisputes] = useState<SellerReturnDispute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [searchText, setSearchText] = useState<string>("");
  const [qcFilter, setQcFilter] = useState<SellerReturnQcFilter>("ALL");
  const [refundFilter, setRefundFilter] =
    useState<SellerReturnRefundFilter>("ALL");
  const [pickupFilter, setPickupFilter] =
    useState<SellerReturnPickupFilter>("ALL");
  const [disputeFilter, setDisputeFilter] =
    useState<SellerReturnDisputeFilter>("ALL");

  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(
    null
  );
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const loadData = useCallback(async (): Promise<void> => {
    if (!sellerId) {
      setReturns([]);
      setDisputes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const [sellerReturns, sellerDisputes] = await Promise.all([
        sellerReturnDisputeService.getSellerReturnRequests(sellerId),
        sellerReturnDisputeService.getDisputesBySellerId(sellerId)
      ]);

      setReturns(sellerReturns ?? []);
      setDisputes(sellerDisputes ?? []);
    } catch {
      showToast(
        "Seller returns load failed",
        "Unable to load seller return workflow.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchText.trim().length > 0 ||
      qcFilter !== "ALL" ||
      refundFilter !== "ALL" ||
      pickupFilter !== "ALL" ||
      disputeFilter !== "ALL"
    );
  }, [searchText, qcFilter, refundFilter, pickupFilter, disputeFilter]);

  const filteredReturns = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return returns.filter((request) => {
      const sellerItems = getSellerItemsFromReturn(request, sellerId);

      const searchableText = [
        request.id,
        request.returnRequestId ?? "",
        request.requestId ?? "",
        request.orderId,
        request.status,
        request.pickupStatus ?? "",
        request.qualityCheckStatus ?? "",
        request.refundStatus ?? "",
        request.returnReason ?? "",
        request.reason ?? "",
        ...sellerItems.flatMap((item) => [
          item.productId,
          item.name,
          item.brand ?? "",
          item.category ?? ""
        ])
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesQc = statusMatchesFilter(
        normalizeStatus(request.qualityCheckStatus),
        qcFilter
      );

      const matchesRefund = statusMatchesFilter(
        normalizeStatus(request.refundStatus),
        refundFilter
      );

      const matchesPickup = statusMatchesFilter(
        normalizeStatus(request.pickupStatus),
        pickupFilter
      );

      const hasRaisedDispute = sellerItems.some((item) =>
        disputes.some(
          (dispute) =>
            dispute.returnRequestDbId === request.id &&
            dispute.productId === item.productId &&
            dispute.sellerId === sellerId &&
            !["REJECTED", "CANCELLED"].includes(dispute.status)
        )
      );

      const hasEligibleDispute = sellerItems.some((item) =>
        canSellerRaiseReturnDispute({
          request,
          productId: item.productId,
          sellerId,
          disputes
        })
      );

      const matchesDispute =
        disputeFilter === "ALL" ||
        (disputeFilter === "RAISED" && hasRaisedDispute) ||
        (disputeFilter === "ELIGIBLE" && hasEligibleDispute) ||
        (disputeFilter === "NOT_ELIGIBLE" &&
          !hasRaisedDispute &&
          !hasEligibleDispute);

      return (
        matchesSearch &&
        matchesQc &&
        matchesRefund &&
        matchesPickup &&
        matchesDispute
      );
    });
  }, [
    returns,
    sellerId,
    searchText,
    qcFilter,
    refundFilter,
    pickupFilter,
    disputeFilter,
    disputes
  ]);

  const summary = useMemo(() => {
    let totalItems = 0;
    let totalReturnValue = 0;
    let disputeEligibleCount = 0;
    let disputesRaisedCount = 0;
    let qcPendingCount = 0;
    let qcFailedCount = 0;
    let restockReadyCount = 0;

    returns.forEach((request) => {
      const sellerItems = getSellerItemsFromReturn(request, sellerId);

      totalItems += sellerItems.reduce(
        (total, item) => total + item.quantity,
        0
      );

      totalReturnValue += sellerItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      const normalizedQcStatus = normalizeStatus(request.qualityCheckStatus);

      if (
        ["PENDING", "NOT_STARTED", "IN_PROGRESS", "QUALITY_CHECK_PENDING"].includes(
          normalizedQcStatus
        )
      ) {
        qcPendingCount += 1;
      }

      if (
        ["FAILED", "REJECTED", "QUALITY_CHECK_FAILED", "QC_REJECTED"].includes(
          normalizedQcStatus
        )
      ) {
        qcFailedCount += 1;
      }

      if (["PASSED", "APPROVED", "COMPLETED"].includes(normalizedQcStatus)) {
        restockReadyCount += 1;
      }

      sellerItems.forEach((item) => {
        const activeDispute = disputes.some(
          (dispute) =>
            dispute.returnRequestDbId === request.id &&
            dispute.productId === item.productId &&
            dispute.sellerId === sellerId &&
            !["REJECTED", "CANCELLED"].includes(dispute.status)
        );

        if (activeDispute) {
          disputesRaisedCount += 1;
          return;
        }

        const canDispute = canSellerRaiseReturnDispute({
          request,
          productId: item.productId,
          sellerId,
          disputes
        });

        if (canDispute) {
          disputeEligibleCount += 1;
        }
      });
    });

    return {
      totalReturns: returns.length,
      totalItems,
      totalReturnValue: formatReturnCurrency(totalReturnValue),
      disputeEligibleCount,
      disputesRaisedCount,
      qcPendingCount,
      qcFailedCount,
      restockReadyCount
    };
  }, [returns, sellerId, disputes]);

  const selectedSellerItem = useMemo(() => {
    if (!selectedRequest || !selectedProductId) {
      return null;
    }

    return (
      getSellerItemsFromReturn(selectedRequest, sellerId).find(
        (item) => item.productId === selectedProductId
      ) ?? null
    );
  }, [selectedRequest, selectedProductId, sellerId]);

  const handleRaiseDispute = (request: ReturnRequest, productId: string) => {
    setSelectedRequest(request);
    setSelectedProductId(productId);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setSelectedProductId("");
  };

  const handleClearFilters = () => {
    setSearchText("");
    setQcFilter("ALL");
    setRefundFilter("ALL");
    setPickupFilter("ALL");
    setDisputeFilter("ALL");
  };

  const handleSubmitDispute = async (
    payload: CreateSellerReturnDisputePayload
  ): Promise<void> => {
    try {
      setIsSaving(true);

      const createdDispute =
        await sellerReturnDisputeService.createDispute(payload);

      setDisputes((previousDisputes) => [createdDispute, ...previousDisputes]);

      showToast(
        "Dispute submitted",
        `Seller dispute ${createdDispute.disputeId} has been submitted.`,
        "success"
      );

      handleCloseModal();
    } catch {
      showToast(
        "Dispute submission failed",
        "Unable to submit seller dispute.",
        "danger"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="seller-returns-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading seller returns..." />
        </div>
      </main>
    );
  }

  return (
    <main className="seller-returns-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Seller Returns</h1>
              <p className="text-muted mb-0">
                View returned products, QC outcome, dispute eligibility, restock
                readiness, and seller dispute status.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary align-self-lg-start"
              onClick={() => void loadData()}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <SellerReturnDashboardSummary {...summary} />

        <SellerReturnDashboardFilters
          searchText={searchText}
          qcFilter={qcFilter}
          refundFilter={refundFilter}
          pickupFilter={pickupFilter}
          disputeFilter={disputeFilter}
          hasActiveFilters={hasActiveFilters}
          onSearchTextChange={setSearchText}
          onQcFilterChange={setQcFilter}
          onRefundFilterChange={setRefundFilter}
          onPickupFilterChange={setPickupFilter}
          onDisputeFilterChange={setDisputeFilter}
          onClearFilters={handleClearFilters}
        />

        {filteredReturns.length === 0 ? (
          <EmptyState
            title={
              hasActiveFilters
                ? "No seller returns match your filters"
                : "No seller returns found"
            }
            message={
              hasActiveFilters
                ? "Try clearing filters or searching with another return, order, or product value."
                : "No returned products are currently linked to this seller."
            }
            iconClassName="bi bi-arrow-return-left text-primary"
          />
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredReturns.map((request) => (
              <SellerReturnCard
                request={request}
                sellerId={sellerId}
                disputes={disputes}
                onRaiseDispute={handleRaiseDispute}
                key={request.id}
              />
            ))}
          </div>
        )}
      </section>

      {selectedRequest && selectedSellerItem ? (
        <SellerReturnDisputeModal
          request={selectedRequest}
          item={selectedSellerItem}
          sellerId={sellerId}
          sellerName={getSellerNameFromReturn(selectedRequest, sellerId)}
          isSaving={isSaving}
          onClose={handleCloseModal}
          onSubmit={handleSubmitDispute}
        />
      ) : null}
    </main>
  );
};

export default SellerReturnsPage;