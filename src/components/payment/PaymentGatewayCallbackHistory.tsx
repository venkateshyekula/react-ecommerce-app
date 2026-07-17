import type { PaymentGatewayCallback } from "../../types/paymentGateway";

interface PaymentGatewayCallbackHistoryProps {
  callbacks: PaymentGatewayCallback[];
}

// Helper to style statuses beautifully
const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "CAPTURED":
      return "text-bg-success-subtle text-success border border-success-subtle";
    case "PENDING_GATEWAY_CONFIRMATION":
      return "text-bg-warning-subtle text-warning-emphasis border border-warning-subtle";
    case "FAILED":
    case "TIMEOUT":
      return "text-bg-danger-subtle text-danger border border-danger-subtle";
    case "REFUND_REQUESTED":
    case "REFUND_PROCESSED":
      return "text-bg-info-subtle text-info-emphasis border border-info-subtle";
    default:
      return "text-bg-light border";
  }
};

const PaymentGatewayCallbackHistory = ({
  callbacks
}: PaymentGatewayCallbackHistoryProps) => {
  return (
    <div className="payment-gateway-callback-history bg-white border rounded-4 p-4 mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h5 className="fw-bold mb-1">Gateway Callback History</h5>
          <p className="text-muted small mb-0">
            Real-time callback events received from the mock gateway.
          </p>
        </div>

        <span className="badge text-bg-light border px-3 py-2 fs-7">
          {callbacks.length} {callbacks.length === 1 ? "event" : "events"}
        </span>
      </div>

      {callbacks.length === 0 ? (
        <div className="text-center py-4 text-muted border rounded-4 bg-light bg-opacity-50">
          <i className="bi bi-activity fs-3 d-block mb-2 text-muted-em" />
          <span className="small">No gateway callbacks received yet.</span>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {callbacks.map((callback) => (
            <div 
              className="payment-gateway-callback-row p-3 border rounded-3 bg-light bg-opacity-25 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3" 
              key={callback.id}
            >
              {/* Event details */}
              <div className="flex-grow-1">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <span className={`badge px-2.5 py-1 ${getStatusBadgeClass(callback.gatewayStatus)}`}>
                    {callback.gatewayStatus}
                  </span>
                  
                  {callback.forceOrderFailure ? (
                    <span className="badge text-bg-danger border border-danger-subtle">
                      <i className="bi bi-exclamation-triangle-fill me-1" />
                      Simulated Order Failure
                    </span>
                  ) : null}

                  <span className="text-muted small font-monospace">
                    ID: {callback.callbackId}
                  </span>
                </div>

                <p className="small fw-semibold text-dark mb-1">
                  {callback.gatewayMessage}
                </p>

                {callback.failureReason ? (
                  <div className="text-danger small d-flex align-items-center gap-1">
                    <i className="bi bi-x-circle-fill" />
                    <span>{callback.failureReason}</span>
                  </div>
                ) : null}
              </div>

              {/* Status and Timestamp */}
              <div className="text-start text-md-end flex-shrink-0 d-flex flex-row flex-md-column align-items-center align-items-md-end justify-content-between w-100 w-md-auto gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className={`badge px-2 py-1 ${
                      callback.processed 
                        ? "text-bg-success border border-success-subtle" 
                        : "text-bg-warning border border-warning-subtle"
                    }`}
                  >
                    <i className={`bi ${callback.processed ? "bi-check-circle" : "bi-hourglass-split"} me-1`} />
                    {callback.processed ? "Processed" : "Pending"}
                  </span>
                </div>

                <p className="small text-muted mb-0 font-monospace" style={{ fontSize: "0.8rem" }}>
                  {new Date(callback.receivedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentGatewayCallbackHistory;