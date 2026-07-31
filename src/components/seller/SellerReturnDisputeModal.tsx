import { useState, type FC, type FormEvent } from "react";
import type { ReturnRequest } from "../../types/returnRequest";
import type {
  CreateSellerReturnDisputePayload,
  SellerReturnDisputePriority,
  SellerReturnDisputeReason
} from "../../types/sellerReturnDispute";
import type { SellerReturnItem } from "../../utils/sellerReturnWorkflowUtils";
import { getReturnDisplayId } from "../../utils/sellerReturnWorkflowUtils";

type SellerReturnDisputeModalProps = {
  request: ReturnRequest;
  item: SellerReturnItem;
  sellerId: string;
  sellerName: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSellerReturnDisputePayload) => Promise<void>;
};

const reasonOptions: Array<{
  label: string;
  value: SellerReturnDisputeReason;
}> = [
  { label: "Wrong item returned", value: "WRONG_ITEM_RETURNED" },
  { label: "Serial number mismatch", value: "SERIAL_NUMBER_MISMATCH" },
  { label: "Product damaged by customer", value: "PRODUCT_DAMAGED_BY_CUSTOMER" },
  { label: "Missing accessory", value: "MISSING_ACCESSORY" },
  { label: "Packaging missing", value: "PACKAGING_MISSING" },
  { label: "Used product returned", value: "USED_PRODUCT_RETURNED" },
  { label: "Fake product returned", value: "FAKE_PRODUCT_RETURNED" },
  { label: "Different variant returned", value: "DIFFERENT_VARIANT_RETURNED" },
  { label: "Other", value: "OTHER" }
];

const priorityOptions: SellerReturnDisputePriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT"
];

const MIN_DESCRIPTION_LENGTH = 10;

const SellerReturnDisputeModal: FC<SellerReturnDisputeModalProps> = ({
  request,
  item,
  sellerId,
  sellerName,
  isSaving,
  onClose,
  onSubmit
}) => {
  const [reason, setReason] = useState<SellerReturnDisputeReason>(
    "PRODUCT_DAMAGED_BY_CUSTOMER"
  );
  const [priority, setPriority] = useState<SellerReturnDisputePriority>("HIGH");
  const [description, setDescription] = useState<string>("");

  const trimmedDescriptionLength = description.trim().length;
  const isFormValid = trimmedDescriptionLength >= MIN_DESCRIPTION_LENGTH;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || isSaving) {
      return;
    }

    await onSubmit({
      returnRequestId: getReturnDisplayId(request),
      returnRequestDbId: request.id,
      orderId: request.orderId,
      sellerId,
      sellerName,
      productId: item.productId,
      productName: item.name,
      disputeReason: reason,
      disputeDescription: description.trim(),
      priority,
      qcStatus: request.qualityCheckStatus,
      qcRemarks: request.qualityCheckRemarks ?? undefined,
      sellerEvidence: []
    });
  };

  return (
    <>
      <div
        className="modal d-block seller-return-dispute-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold">Raise Seller Dispute</h5>
                  <p className="text-muted small mb-0">
                    Return {getReturnDisplayId(request)} · Order {request.orderId}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  disabled={isSaving}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body">
                <div className="alert alert-light border mb-3">
                  <strong className="d-block text-truncate">{item.name}</strong>
                  <div className="small text-muted">
                    Product ID: {item.productId} · Qty: {item.quantity}
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Dispute Reason
                    </label>
                    <select
                      className="form-select"
                      value={reason}
                      disabled={isSaving}
                      onChange={(event) =>
                        setReason(event.target.value as SellerReturnDisputeReason)
                      }
                    >
                      {reasonOptions.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Priority</label>
                    <select
                      className="form-select"
                      value={priority}
                      disabled={isSaving}
                      onChange={(event) =>
                        setPriority(
                          event.target.value as SellerReturnDisputePriority
                        )
                      }
                    >
                      {priorityOptions.map((option) => (
                        <option value={option} key={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Dispute Description
                    </label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={description}
                      disabled={isSaving}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Explain why the seller is disputing this return..."
                    />
                    <div className="d-flex justify-content-between mt-1">
                      <div className="form-text mb-0">
                        Minimum {MIN_DESCRIPTION_LENGTH} characters required.
                      </div>
                      <div
                        className={`form-text mb-0 fw-medium ${
                          isFormValid ? "text-success" : "text-muted"
                        }`}
                      >
                        {trimmedDescriptionLength} / {MIN_DESCRIPTION_LENGTH}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                  disabled={isSaving || !isFormValid}
                >
                  {isSaving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    "Submit Dispute"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop show"
        style={{ zIndex: 1040 }}
        onClick={!isSaving ? onClose : undefined}
      />
    </>
  );
};

export default SellerReturnDisputeModal;