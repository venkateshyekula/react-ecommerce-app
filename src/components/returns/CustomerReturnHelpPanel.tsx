import { Link } from "react-router-dom";
import type { ReturnRequest } from "../../types/returnRequest";

type CustomerReturnHelpPanelProps = {
  request: ReturnRequest;
  onContactSupport?: () => void;
  onRaiseIssue?: () => void;
};

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

const buildSupportQuery = ({
  orderId,
  returnId,
  issueType
}: {
  orderId: string;
  returnId: string;
  issueType?: string;
}): string => {
  const params = new URLSearchParams();

  params.set("category", "RETURN_REFUND");

  const hasOrderId = orderId && orderId !== "Not available";
  const hasReturnId = returnId && returnId !== "Not available";

  if (hasOrderId) {
    params.set("orderId", orderId);
  }

  if (hasReturnId) {
    params.set("returnRequestId", returnId);
  }

  const subjectText = hasOrderId
    ? `Return / Refund issue for order ${orderId}`
    : `Return / Refund issue for Return ID ${returnId}`;

  params.set("subject", subjectText);

  if (issueType) {
    params.set("issueType", issueType);
  }

  return params.toString();
};

const CustomerReturnHelpPanel = ({ request }: CustomerReturnHelpPanelProps) => {
  const returnId = getStringValue(request, ["returnRequestId", "requestId", "id"]);
  const orderId = getStringValue(request, ["orderId", "orderNumber"]);
  const returnStatus = getStringValue(request, [
    "status",
    "returnStatus",
    "requestStatus"
  ]);
  const rawRefundAmount = getStringValue(request, [
    "refundAmount",
    "settlementAmount",
    "amount"
  ]);

  // Format refund amount nicely if it's numeric
  const refundAmount =
    !isNaN(Number(rawRefundAmount)) && rawRefundAmount !== "Not available"
      ? `₹${Number(rawRefundAmount).toLocaleString("en-IN")}`
      : rawRefundAmount;

  const contactSupportQuery = buildSupportQuery({
    orderId,
    returnId
  });

  const raiseIssueQuery = buildSupportQuery({
    orderId,
    returnId,
    issueType: "RAISE_RETURN_ISSUE"
  });

  const myTicketsQuery = new URLSearchParams();

  if (orderId && orderId !== "Not available") {
    myTicketsQuery.set("orderId", orderId);
  }

  if (returnId && returnId !== "Not available") {
    myTicketsQuery.set("returnRequestId", returnId);
  }

  const handleDownloadSummary = (): void => {
    const fileNameId =
      returnId && returnId !== "Not available"
        ? returnId.replace(/[^a-zA-Z0-9_-]/g, "_")
        : "details";

    const summaryLines = [
      "========================================",
      "         ShopEase Return Summary        ",
      "========================================",
      "",
      `Return ID     : ${returnId}`,
      `Order ID      : ${orderId}`,
      `Status        : ${returnStatus}`,
      `Refund Amount : ${refundAmount}`,
      `Generated At  : ${new Date().toLocaleString()}`,
      "",
      "----------------------------------------",
      "Need help? Contact our support team with",
      "your Return ID for faster resolution.",
      "----------------------------------------"
    ];

    const blob = new Blob([summaryLines.join("\n")], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `return-summary-${fileNameId}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <h5 className="fw-bold mb-1">Need help with this return?</h5>
            <p className="text-muted small mb-0">
              You can contact support, raise an issue, view related tickets, or
              download your return summary.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-3">
            <Link
              to={`/contact-support?${contactSupportQuery}`}
              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
              target="_blank"
            >
              <i className="bi bi-headset me-2" />
              <span>Contact support</span>
            </Link>

            <Link
              to={`/contact-support?${raiseIssueQuery}`}
              className="btn btn-outline-warning btn-sm d-inline-flex align-items-center customer-raise-issue-btn"
              target="_blank"
            >
              <i className="bi bi-exclamation-circle me-2" />
              <span>Raise issue</span>
            </Link>

            <Link
              to={`/support-tickets?${myTicketsQuery.toString()}`}
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center"
            >
              <i className="bi bi-ticket-detailed me-2" />
              <span>View tickets</span>
            </Link>

            <button
              type="button"
              className="btn btn-primary btn-sm d-inline-flex align-items-center"
              onClick={handleDownloadSummary}
            >
              <i className="bi bi-download me-2" />
              <span>Download summary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReturnHelpPanel;