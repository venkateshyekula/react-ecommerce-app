import type { ReturnRequest } from "../../types/returnRequest";
import type { ReturnQcInspection } from "../../types/returnQc";
import { formatCurrency } from "../../utils/currencyFormatter";
import {
  formatReturnQcLabel,
  getConditionGradeBadgeClass,
  getReturnQcStatusBadgeClass,
} from "../../utils/returnQcUtils";

type ReturnRequestItem = ReturnRequest["items"][number];

interface ReturnQcItemCardProps {
  item: ReturnRequestItem;
  inspection?: ReturnQcInspection | null;
  isSelected?: boolean;
  onSelect: () => void;
}

const ReturnQcItemCard = ({
  item,
  inspection = null,
  isSelected = false,
  onSelect,
}: ReturnQcItemCardProps) => {
  return (
    <div
      className={`return-qc-item-card ${
        isSelected ? "return-qc-item-card--selected" : ""
      }`}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Select item ${item.name}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="d-flex gap-3 align-items-start">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="return-qc-item-image rounded"
          />
        ) : (
          <div className="return-qc-item-image-placeholder">
            <i className="bi bi-box" />
          </div>
        )}

        <div className="flex-grow-1 min-w-0">
          <h6 className="fw-bold mb-1 text-truncate">{item.name}</h6>

          <p className="small text-muted mb-1">
            Qty {item.quantity}
            {item.selectedSize ? ` · Size ${item.selectedSize}` : ""}
            {item.category ? ` · ${item.category}` : ""}
          </p>

          <p className="small mb-2">
            <strong>{formatCurrency(item.price * item.quantity)}</strong>
          </p>

          <div className="d-flex flex-wrap gap-2">
            {inspection ? (
              <>
                <span
                  className={`badge ${getReturnQcStatusBadgeClass(
                    inspection.qcStatus,
                  )}`}
                >
                  {formatReturnQcLabel(inspection.qcStatus)}
                </span>

                <span
                  className={`badge ${getConditionGradeBadgeClass(
                    inspection.conditionGrade,
                  )}`}
                >
                  {formatReturnQcLabel(inspection.conditionGrade)}
                </span>
              </>
            ) : (
              <span className="badge text-bg-light border">QC Not Started</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnQcItemCard;