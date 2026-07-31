import { useState } from "react";
import type { ReturnRequest } from "../../types/returnRequest";

type CustomerCompensationPanelProps = {
  request: ReturnRequest;
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

const getNumberValue = (
  request: ReturnRequest,
  keys: string[],
  fallback = 0
): number => {
  const source = request as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr === "Not available") return dateStr;

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsed);
};

const CustomerCompensationPanel = ({
  request
}: CustomerCompensationPanelProps) => {
  const [copied, setCopied] = useState(false);

  const walletCreditAmount = getNumberValue(request, [
    "walletCreditAmount",
    "compensationWalletAmount",
    "walletCompensationAmount"
  ]);

  const couponCode = getStringValue(
    request,
    ["couponCode", "compensationCouponCode"],
    ""
  );

  const rawExpiryDate = getStringValue(request, [
    "couponExpiryDate",
    "compensationCouponExpiryDate"
  ]);

  const couponExpiryDate = formatDate(rawExpiryDate);

  const compensationReason = getStringValue(
    request,
    ["compensationReason", "walletCreditReason", "couponReason"],
    "Compensation may be added for pickup delay, refund delay, or service inconvenience."
  );

  const hasWalletCredit = walletCreditAmount > 0;
  const hasCoupon = couponCode.trim().length > 0;

  const handleCopyCoupon = () => {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">Wallet and coupon compensation</h5>
            <p className="text-muted small mb-0">
              Any goodwill credit or coupon linked to this return appears here.
            </p>
          </div>

          <span className="badge rounded-pill text-bg-light border text-dark">
            Optional
          </span>
        </div>

        {!hasWalletCredit && !hasCoupon ? (
          <div className="alert alert-light border small mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-gift flex-shrink-0 text-primary" />
            <div>
              No wallet or coupon compensation has been added for this return.
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {hasWalletCredit && (
              <div className="col-sm-6">
                <div className="customer-compensation-box wallet p-3 border rounded bg-light">
                  <div className="customer-compensation-icon mb-1 text-primary fs-5">
                    <i className="bi bi-wallet2" />
                  </div>
                  <span className="small text-muted d-block">Wallet credit</span>
                  <strong className="fs-5 d-block">{formatCurrency(walletCreditAmount)}</strong>
                </div>
              </div>
            )}

            {hasCoupon && (
              <div className="col-sm-6">
                <div className="customer-compensation-box coupon p-3 border rounded bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="customer-compensation-icon text-success fs-5">
                      <i className="bi bi-ticket-perforated" />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                      onClick={handleCopyCoupon}
                      title="Copy coupon code"
                    >
                      <i className={`bi ${copied ? "bi-check-lg text-success" : "bi-copy"}`} />
                      <span className="ms-1 small">{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <span className="small text-muted d-block">Coupon code</span>
                  <strong className="text-primary font-monospace fs-6 d-block mb-1">
                    {couponCode}
                  </strong>
                  <span className="small text-muted d-block fs-7">
                    Expires: {couponExpiryDate}
                  </span>
                </div>
              </div>
            )}

            <div className="col-12">
              <div className="alert alert-success border-success-subtle small mb-0 d-flex align-items-start gap-2">
                <i className="bi bi-stars flex-shrink-0 mt-1" />
                <div>{compensationReason}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCompensationPanel;