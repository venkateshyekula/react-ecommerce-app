import { useState, type FormEvent } from "react";
import Button from "../common/Button";
import type { Order } from "../../types/order";

interface ReturnRequestModalProps {
  order: Order;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (reason: string, comments: string) => void;
}

const returnReasons = [
  "Product damaged",
  "Wrong product delivered",
  "Size or fit issue",
  "Quality issue",
  "Item not as described",
  "Other"
];

const ReturnRequestModal = ({
  order,
  isSubmitting = false,
  onClose,
  onSubmit
}: ReturnRequestModalProps) => {
  const [reason, setReason] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!reason) {
      setErrorMessage("Please select a return reason.");
      return;
    }

    onSubmit(reason, comments.trim());
  };

  return (
    <div className="return-request-modal-overlay">
      <div className="return-request-modal bg-white">
        <div className="return-request-modal-header">
          <div>
            <h5 className="fw-bold mb-1">Request Return</h5>
            <p className="text-muted small mb-0">
              Order ID: <strong>{order.orderId}</strong>
            </p>
          </div>

          <button
            type="button"
            className="btn btn-light rounded-circle"
            onClick={onClose}
            aria-label="Close return request modal"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="return-request-modal-body">
            {errorMessage ? (
              <div className="alert alert-danger py-2" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <div className="mb-3">
              <label className="form-label fw-semibold">Reason</label>

              <select
                className="form-select"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setErrorMessage("");
                }}
              >
                <option value="">Select reason</option>
                {returnReasons.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Additional Comments
              </label>

              <textarea
                className="form-control"
                rows={4}
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                placeholder="Describe the issue..."
              />
            </div>

            <div className="return-request-items">
              <h6 className="fw-bold mb-3">Items in this return</h6>

              {order.items.map((item) => (
                <div className="return-request-item" key={item.productId}>
                  <img src={item.image} alt={item.name} />

                  <div>
                    <strong>{item.name}</strong>
                    <p className="text-muted small mb-0">
                      {item.brand} • Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="return-request-modal-footer">
            <Button type="button" variant="outline-secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Return Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnRequestModal;