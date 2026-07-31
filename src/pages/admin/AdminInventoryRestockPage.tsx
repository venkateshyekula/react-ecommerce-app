import { useCallback, useEffect, useMemo, useState } from "react";
import AdminInventoryRestockDecisionCard from "../../components/admin/AdminInventoryRestockDecisionCard";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { useToast } from "../../context/useToast";
import { inventoryRestockService } from "../../services/inventoryRestockService";
import { sellerReturnDisputeService } from "../../services/sellerReturnDisputeService";
import type { ReturnRequest } from "../../types/returnRequest";
import type {
  InventoryRestockLog,
  ReturnItemConditionGrade
} from "../../types/inventoryRestock";
import type { SellerReturnDispute } from "../../types/sellerReturnDispute";
import type {
  InventoryRestockDecisionType,
  ReturnRestockItem
} from "../../utils/inventoryRestockWorkflowUtils";
import {
  getReturnItemsForRestock,
  normalizeRestockStatus
} from "../../utils/inventoryRestockWorkflowUtils";

type RestockStatusFilter =
  | "ALL"
  | "READY"
  | "DISPUTE_PENDING"
  | "LOGGED"
  | "QC_FAILED";

const AdminInventoryRestockPage = () => {
  const { showToast } = useToast();

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [disputes, setDisputes] = useState<SellerReturnDispute[]>([]);
  const [restockLogs, setRestockLogs] = useState<InventoryRestockLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingKey, setSavingKey] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<RestockStatusFilter>("ALL");
  const [searchText, setSearchText] = useState<string>("");

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const [returnData, disputeData, logData] = await Promise.all([
        inventoryRestockService.getReturnRequests(),
        sellerReturnDisputeService.getDisputes(),
        inventoryRestockService.getRestockLogs()
      ]);

      setReturns(returnData);
      setDisputes(disputeData);
      setRestockLogs(logData);
    } catch {
      showToast(
        "Restock workflow load failed",
        "Unable to load inventory restock workflow data.",
        "danger"
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const restockCandidates = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return returns.flatMap((request) => {
      const items = getReturnItemsForRestock(request);
      const qcStatus = normalizeRestockStatus(request.qualityCheckStatus);

      return items.map((item) => {
        const existingLog = restockLogs.find((log) => {
          return (
            log.returnRequestDbId === request.id &&
            log.productId === item.productId &&
            log.orderId === request.orderId
          );
        });

        const hasPendingDispute = disputes.some((dispute) => {
          return (
            dispute.returnRequestDbId === request.id &&
            dispute.productId === item.productId &&
            !["APPROVED", "REJECTED", "CANCELLED"].includes(dispute.status)
          );
        });

        const searchableText = [
          request.id,
          request.returnRequestId ?? "",
          request.requestId ?? "",
          request.orderId,
          request.status,
          request.qualityCheckStatus ?? "",
          request.refundStatus ?? "",
          item.productId,
          item.name,
          item.sellerId ?? "",
          item.sellerName ?? ""
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedSearch || searchableText.includes(normalizedSearch);

        const matchesFilter =
          statusFilter === "ALL" ||
          (statusFilter === "LOGGED" && Boolean(existingLog)) ||
          (statusFilter === "DISPUTE_PENDING" && hasPendingDispute) ||
          (statusFilter === "QC_FAILED" &&
            ["FAILED", "REJECTED", "QUALITY_CHECK_FAILED", "QC_REJECTED"].includes(
              qcStatus
            )) ||
          (statusFilter === "READY" &&
            !existingLog &&
            !hasPendingDispute &&
            ["PASSED", "APPROVED", "COMPLETED"].includes(qcStatus));

        return {
          request,
          item,
          existingLog,
          hasPendingDispute,
          matchesSearch,
          matchesFilter
        };
      });
    });
  }, [returns, restockLogs, disputes, searchText, statusFilter]);

  const visibleCandidates = useMemo(() => {
    return restockCandidates.filter(
      (candidate) => candidate.matchesSearch && candidate.matchesFilter
    );
  }, [restockCandidates]);

  const summary = useMemo(() => {
    let logged = 0;
    let disputePending = 0;
    let ready = 0;
    let qcFailed = 0;

    for (const candidate of restockCandidates) {
      if (candidate.existingLog) {
        logged++;
      }
      if (candidate.hasPendingDispute) {
        disputePending++;
      }

      const qcStatus = normalizeRestockStatus(
        candidate.request.qualityCheckStatus
      );

      if (
        !candidate.existingLog &&
        !candidate.hasPendingDispute &&
        ["PASSED", "APPROVED", "COMPLETED"].includes(qcStatus)
      ) {
        ready++;
      }

      if (
        ["FAILED", "REJECTED", "QUALITY_CHECK_FAILED", "QC_REJECTED"].includes(
          qcStatus
        )
      ) {
        qcFailed++;
      }
    }

    return {
      totalItems: restockCandidates.length,
      logged,
      disputePending,
      ready,
      qcFailed
    };
  }, [restockCandidates]);

  const handleCreateDecision = useCallback(
    async ({
      request,
      item,
      decisionType,
      conditionGrade,
      remarks
    }: {
      request: ReturnRequest;
      item: ReturnRestockItem;
      decisionType: InventoryRestockDecisionType;
      conditionGrade: ReturnItemConditionGrade;
      remarks: string;
    }): Promise<void> => {
      const saveKey = `${request.id}-${item.productId}`;

      try {
        setSavingKey(saveKey);

        const createdLog =
          await inventoryRestockService.createRestockDecision({
            request,
            productId: item.productId,
            productName: item.name,
            sellerId: item.sellerId ?? "unknown-seller",
            sellerName: item.sellerName ?? "Unknown Seller",
            quantity: item.quantity,
            price: item.price,
            decisionType,
            conditionGrade,
            remarks: remarks || undefined
          });

        setRestockLogs((previousLogs) => [createdLog, ...previousLogs]);

        showToast(
          "Restock decision saved",
          `Inventory restock decision ${createdLog.restockId} has been saved.`,
          "success"
        );
      } catch {
        showToast(
          "Restock decision failed",
          "Unable to save inventory restock decision.",
          "danger"
        );
      } finally {
        setSavingKey("");
      }
    },
    [showToast]
  );

  if (isLoading) {
    return (
      <main className="admin-inventory-restock-page bg-light min-vh-100">
        <div className="container-fluid py-5">
          <Loader message="Loading inventory restock workflow..." />
        </div>
      </main>
    );
  }

  return (
    <main className="admin-inventory-restock-page bg-light min-vh-100">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Inventory Restock Workflow</h1>

              <p className="text-muted mb-0">
                Decide whether returned products go back to sellable stock,
                open-box inventory, damaged hold, or blocked restock.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary align-self-lg-start support-agent-header-btn"
              onClick={() => void loadData()}
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
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">Return Items</span>
              <strong className="d-block fs-5">{summary.totalItems}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">Ready</span>
              <strong className="d-block fs-5">{summary.ready}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">Dispute Pending</span>
              <strong className="d-block fs-5">
                {summary.disputePending}
              </strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">QC Failed</span>
              <strong className="d-block fs-5">{summary.qcFailed}</strong>
            </div>
          </div>

          <div className="col-6 col-md">
            <div className="bg-white border rounded-4 p-3 shadow-sm">
              <span className="text-muted small">Logged</span>
              <strong className="d-block fs-5">{summary.logged}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-6">
              <label className="form-label fw-semibold">Search</label>
              <input
                className="form-control"
                value={searchText}
                placeholder="Search return, order, product, seller..."
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-lg-3">
              <label className="form-label fw-semibold">Status Filter</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as RestockStatusFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="READY">Ready</option>
                <option value="DISPUTE_PENDING">Dispute Pending</option>
                <option value="QC_FAILED">QC Failed</option>
                <option value="LOGGED">Logged</option>
              </select>
            </div>

            <div className="col-lg-3 d-flex justify-content-lg-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 w-lg-auto"
                disabled={!searchText && statusFilter === "ALL"}
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("ALL");
                }}
              >
                <i className="bi bi-x-circle me-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {visibleCandidates.length === 0 ? (
          <EmptyState
            title="No restock candidates found"
            message="No returned products match the selected restock filters."
            iconClassName="bi bi-box-arrow-in-down text-primary"
          />
        ) : (
          <div className="row g-3">
            {visibleCandidates.map((candidate) => (
              <div
                className="col-12 col-xl-6"
                key={`${candidate.request.id}-${candidate.item.productId}`}
              >
                <AdminInventoryRestockDecisionCard
                  request={candidate.request}
                  item={candidate.item}
                  disputes={disputes}
                  restockLogs={restockLogs}
                  isSaving={
                    savingKey ===
                    `${candidate.request.id}-${candidate.item.productId}`
                  }
                  onCreateDecision={handleCreateDecision}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminInventoryRestockPage;