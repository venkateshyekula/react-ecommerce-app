import { useEffect, useState } from "react";
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
  formatInventoryCurrency,
  formatInventoryLabel,
  getReturnDisplayId,
  getSuggestedRestockDecision,
  hasActiveSellerDisputeForItem
} from "../../utils/inventoryRestockWorkflowUtils";

type AdminInventoryRestockDecisionCardProps = {
  request: ReturnRequest;
  item: ReturnRestockItem;
  disputes: SellerReturnDispute[];
  restockLogs: InventoryRestockLog[];
  isSaving: boolean;
  onCreateDecision: ({
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
  }) => Promise<void>;
};

const decisionOptions: Array<{
  label: string;
  value: InventoryRestockDecisionType;
}> = [
  { label: "Restock as Sellable", value: "SELLABLE" },
  { label: "Move to Open Box", value: "OPEN_BOX" },
  { label: "Move to Damaged Hold", value: "DAMAGED_HOLD" },
  { label: "Block Restock", value: "BLOCKED" }
];

const conditionOptions: ReturnItemConditionGrade[] = ["A", "B", "C", "D"];

const AdminInventoryRestockDecisionCard = ({
  request,
  item,
  disputes,
  restockLogs,
  isSaving,
  onCreateDecision
}: AdminInventoryRestockDecisionCardProps) => {
  const hasActiveDispute = hasActiveSellerDisputeForItem({
    disputes,
    returnRequestDbId: request.id,
    productId: item.productId
  });

  const existingRestockLog = restockLogs.find((log) => {
    return (
      log.returnRequestDbId === request.id &&
      log.productId === item.productId &&
      log.orderId === request.orderId
    );
  });

  const suggestedDecision = getSuggestedRestockDecision({
    request,
    hasActiveDispute
  });

  const [decisionType, setDecisionType] =
    useState<InventoryRestockDecisionType>(suggestedDecision.decisionType);
  const [conditionGrade, setConditionGrade] =
    useState<ReturnItemConditionGrade>(suggestedDecision.conditionGrade);
  const [remarks, setRemarks] = useState<string>(
    suggestedDecision.description
  );

  // Keep form state in sync when props or calculated suggestions change
  useEffect(() => {
    setDecisionType(suggestedDecision.decisionType);
    setConditionGrade(suggestedDecision.conditionGrade);
    setRemarks(suggestedDecision.description);
  }, [
    request.id,
    item.productId,
    suggestedDecision.decisionType,
    suggestedDecision.conditionGrade,
    suggestedDecision.description
  ]);

  const isDecisionDisabled = isSaving || Boolean(existingRestockLog);

  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
          <div className="d-flex gap-3">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="rounded border object-fit-cover flex-shrink-0"
                style={{
                  width: 72,
                  height: 72
                }}
              />
            ) : (
              <div
                className="rounded border bg-light text-muted d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 72,
                  height: 72
                }}
              >
                <i className="bi bi-box-seam fs-4" />
              </div>
            )}

            <div>
              <span className="badge text-bg-light border mb-2">
                {getReturnDisplayId(request)}
              </span>
              <h5 className="fw-bold mb-1">{item.name}</h5>
              <p className="text-muted small mb-1">
                Order {request.orderId} · Product {item.productId}
              </p>
              <p className="small mb-0">
                Qty: <strong>{item.quantity}</strong> · Value:{" "}
                <strong>
                  {formatInventoryCurrency(item.price * item.quantity)}
                </strong>
              </p>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-start">
            <span className="badge text-bg-info">
              QC: {formatInventoryLabel(request.qualityCheckStatus)}
            </span>
            <span className="badge text-bg-secondary">
              Refund: {formatInventoryLabel(request.refundStatus)}
            </span>
            {hasActiveDispute ? (
              <span className="badge text-bg-warning text-dark">
                Dispute Pending
              </span>
            ) : null}
            {existingRestockLog ? (
              <span className="badge text-bg-success">Logged</span>
            ) : null}
          </div>
        </div>

        {request.qualityCheckRemarks ? (
          <div className="alert alert-light border small mb-3">
            <strong>QC Remarks:</strong> {request.qualityCheckRemarks}
          </div>
        ) : null}

        {existingRestockLog ? (
          <div className="alert alert-success small mb-0">
            <strong>Restock decision already logged:</strong>{" "}
            {formatInventoryLabel(existingRestockLog.restockStatus)} ·{" "}
            {formatInventoryLabel(existingRestockLog.restockType)}
            {existingRestockLog.remarks ? (
              <div className="mt-1">{existingRestockLog.remarks}</div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="alert alert-primary small mb-3">
              <strong>Suggested Decision:</strong> {suggestedDecision.label}
              <div>{suggestedDecision.description}</div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Restock Decision
                </label>
                <select
                  className="form-select"
                  value={decisionType}
                  disabled={isDecisionDisabled}
                  onChange={(event) =>
                    setDecisionType(
                      event.target.value as InventoryRestockDecisionType
                    )
                  }
                >
                  {decisionOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Condition Grade
                </label>
                <select
                  className="form-select"
                  value={conditionGrade}
                  disabled={isDecisionDisabled}
                  onChange={(event) =>
                    setConditionGrade(
                      event.target.value as ReturnItemConditionGrade
                    )
                  }
                >
                  {conditionOptions.map((grade) => (
                    <option value={grade} key={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Remarks</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={remarks}
                  disabled={isDecisionDisabled}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Add inventory/restock remarks..."
                />
              </div>
            </div>

            <div className="d-flex justify-content-end mt-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={isDecisionDisabled || !remarks.trim()}
                onClick={() =>
                  void onCreateDecision({
                    request,
                    item,
                    decisionType,
                    conditionGrade,
                    remarks: remarks.trim()
                  })
                }
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2" />
                    Save Restock Decision
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminInventoryRestockDecisionCard;