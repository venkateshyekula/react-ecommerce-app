import { useMemo, useState } from "react";
import type {
  PaymentGatewayStatus,
  PaymentTransaction
} from "../../types/payment";
import { formatCurrency } from "../../utils/currencyFormatter";

interface MockPaymentGatewayPanelProps {
  payment: PaymentTransaction;
  isProcessing?: boolean;
  onSubmitGatewayCallback: ({
    gatewayStatus,
    gatewayMessage,
    failureReason,
    forceOrderFailure
  }: {
    gatewayStatus: PaymentGatewayStatus;
    gatewayMessage: string;
    failureReason?: string | null;
    forceOrderFailure?: boolean;
  }) => Promise<void>;
}

const gatewayStatusOptions: Array<{
  value: PaymentGatewayStatus;
  label: string;
  description: string;
}> = [
  {
    value: "CAPTURED",
    label: "Captured",
    description: "Payment successfully captured by gateway."
  },
  {
    value: "PENDING_GATEWAY_CONFIRMATION",
    label: "Pending Gateway Confirmation",
    description: "Gateway has not confirmed final payment state yet."
  },
  {
    value: "FAILED",
    label: "Failed",
    description: "Payment failed at gateway."
  },
  {
    value: "TIMEOUT",
    label: "Timeout",
    description: "Gateway timed out before payment confirmation."
  },
  {
    value: "REFUND_REQUESTED",
    label: "Refund Requested",
    description: "Refund has been requested at gateway."
  },
  {
    value: "REFUND_PROCESSED",
    label: "Refund Processed",
    description: "Refund was completed by gateway."
  }
];

const MockPaymentGatewayPanel = ({
  payment,
  isProcessing = false,
  onSubmitGatewayCallback
}: MockPaymentGatewayPanelProps) => {
  const [gatewayStatus, setGatewayStatus] =
    useState<PaymentGatewayStatus>("CAPTURED");
  const [gatewayMessage, setGatewayMessage] = useState<string>(
    "Payment captured successfully by mock gateway."
  );
  const [failureReason, setFailureReason] = useState<string>("");
  const [forceOrderFailure, setForceOrderFailure] = useState<boolean>(false);

  const selectedStatusDescription = useMemo(() => {
    return (
      gatewayStatusOptions.find((option) => option.value === gatewayStatus)
        ?.description ?? ""
    );
  }, [gatewayStatus]);

  const handleGatewayStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const nextStatus = event.target.value as PaymentGatewayStatus;

    setGatewayStatus(nextStatus);

    if (nextStatus === "CAPTURED") {
      setGatewayMessage("Payment captured successfully by mock gateway.");
      setFailureReason("");
      setForceOrderFailure(false); // Fixed: Reset force flag on re-entry
      return;
    }

    if (nextStatus === "PENDING_GATEWAY_CONFIRMATION") {
      setGatewayMessage("Payment is pending gateway confirmation.");
      setFailureReason("");
      setForceOrderFailure(false);
      return;
    }

    if (nextStatus === "FAILED") {
      setGatewayMessage("Payment failed at mock gateway.");
      setFailureReason("Mock gateway declined the transaction.");
      setForceOrderFailure(false);
      return;
    }

    if (nextStatus === "TIMEOUT") {
      setGatewayMessage("Payment gateway timeout received.");
      setFailureReason("Mock gateway timeout.");
      setForceOrderFailure(false);
      return;
    }

    if (nextStatus === "REFUND_REQUESTED") {
      setGatewayMessage("Refund request accepted by mock gateway.");
      setFailureReason("");
      setForceOrderFailure(false);
      return;
    }

    if (nextStatus === "REFUND_PROCESSED") {
      setGatewayMessage("Refund processed successfully by mock gateway.");
      setFailureReason("");
      setForceOrderFailure(false);
    }
  };

  const isFailureStatus = gatewayStatus === "FAILED" || gatewayStatus === "TIMEOUT";

  return (
    <div className="mock-payment-gateway-panel bg-white border rounded-4 p-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Mock Payment Gateway Callback</h4>
          <p className="text-muted mb-0">
            Select a gateway status and submit a callback event. The callback
            will be stored in JSON Server before payment lifecycle processing.
          </p>
        </div>

        <span className="badge text-bg-light border align-self-start">
          {payment.paymentMethod}
        </span>
      </div>

      <div className="alert alert-light border">
        <div>
          Payment ID: <strong>{payment.paymentId}</strong>
        </div>
        <div>
          Amount: <strong>{formatCurrency(payment.amount)}</strong>
        </div>
        <div>
          Gateway Ref: <strong>{payment.gatewayReferenceId}</strong>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="gatewayStatus" className="form-label fw-semibold">
            Gateway Callback Status
          </label>

          <select
            id="gatewayStatus"
            className="form-select"
            value={gatewayStatus}
            disabled={isProcessing}
            onChange={handleGatewayStatusChange}
          >
            {gatewayStatusOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="form-text">{selectedStatusDescription}</div>
        </div>

        <div className="col-md-6">
          <label htmlFor="gatewayMessage" className="form-label fw-semibold">
            Gateway Message
          </label>

          <input
            id="gatewayMessage"
            className="form-control"
            value={gatewayMessage}
            disabled={isProcessing}
            onChange={(event) => setGatewayMessage(event.target.value)}
          />
        </div>

        {isFailureStatus ? (
          <div className="col-12">
            <label htmlFor="failureReason" className="form-label fw-semibold">
              Failure Reason
            </label>

            <textarea
              id="failureReason"
              className="form-control"
              rows={3}
              value={failureReason}
              disabled={isProcessing}
              onChange={(event) => setFailureReason(event.target.value)}
            />
          </div>
        ) : null}

        {gatewayStatus === "CAPTURED" ? (
          <div className="col-12">
            <div className="form-check border rounded-4 p-3 bg-light">
              <input
                id="forceOrderFailure"
                className="form-check-input ms-0 me-2"
                type="checkbox"
                checked={forceOrderFailure}
                disabled={isProcessing}
                onChange={(event) =>
                  setForceOrderFailure(event.target.checked)
                }
              />

              <label
                htmlFor="forceOrderFailure"
                className="form-check-label fw-semibold"
              >
                Simulate successful payment but order creation failure
              </label>

              <div className="form-text">
                Use this to test auto refund queue creation when payment is
                captured but order creation fails.
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="btn btn-primary mt-4"
        disabled={isProcessing}
        onClick={() =>
          void onSubmitGatewayCallback({
            gatewayStatus,
            gatewayMessage,
            failureReason: isFailureStatus ? (failureReason.trim() || null) : null,
            forceOrderFailure: gatewayStatus === "CAPTURED" ? forceOrderFailure : false
          })
        }
      >
        {isProcessing ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Processing Callback...
          </>
        ) : (
          <>
            <i className="bi bi-send-check me-2" />
            Submit Gateway Callback
          </>
        )}
      </button>
    </div>
  );
};

export default MockPaymentGatewayPanel;