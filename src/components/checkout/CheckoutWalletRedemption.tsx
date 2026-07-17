import { useMemo, useState } from "react";
import Button from "../common/Button";
import type { WalletTransaction } from "../../types/wallet";
import { formatCurrency } from "../../utils/currencyFormatter";
import { calculateWalletRedemption } from "../../utils/walletRedemption";

interface CheckoutWalletRedemptionProps {
  transactions: WalletTransaction[];
  orderAmount: number;
  appliedWalletAmount: number;
  onApplyWallet: (amount: number) => void;
  onRemoveWallet: () => void;
}

const CheckoutWalletRedemption = ({
  transactions,
  orderAmount,
  appliedWalletAmount,
  onApplyWallet,
  onRemoveWallet
}: CheckoutWalletRedemptionProps) => {
  const [walletAmountInput, setWalletAmountInput] = useState<string>("");

  const walletBalance = useMemo(() => {
    return transactions.reduce((balance, transaction) => {
      return transaction.type === "CREDIT"
        ? balance + transaction.amount
        : balance - transaction.amount;
    }, 0);
  }, [transactions]);

  const maxUsableWalletAmount = Math.min(walletBalance, orderAmount);

  const redemptionPreview = calculateWalletRedemption(
    walletBalance,
    orderAmount,
    Number(walletAmountInput || 0)
  );

  const handleApplyWallet = (): void => {
    if (maxUsableWalletAmount <= 0) {
      return;
    }

    const requestedAmount = Number(walletAmountInput || 0);

    if (requestedAmount <= 0) {
      onApplyWallet(maxUsableWalletAmount);
      setWalletAmountInput(String(maxUsableWalletAmount));
      return;
    }

    onApplyWallet(redemptionPreview.walletAmountUsed);
  };

  const handleUseMaximumWallet = (): void => {
    if (maxUsableWalletAmount <= 0) {
      return;
    }

    setWalletAmountInput(String(maxUsableWalletAmount));
    onApplyWallet(maxUsableWalletAmount);
  };

  const handleRemoveWallet = (): void => {
    setWalletAmountInput("");
    onRemoveWallet();
  };

  if (walletBalance <= 0) {
    return (
      <div className="checkout-wallet-card disabled">
        <div className="checkout-wallet-icon">
          <i className="bi bi-wallet2" />
        </div>

        <div>
          <h6 className="fw-bold mb-1">Wallet Balance</h6>
          <p className="text-muted small mb-0">
            No wallet balance available for this order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-wallet-card">
      <div className="d-flex align-items-start gap-3">
        <div className="checkout-wallet-icon">
          <i className="bi bi-wallet2" />
        </div>

        <div className="flex-grow-1">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
            <div>
              <h6 className="fw-bold mb-1">Use Wallet Balance</h6>
              <p className="text-muted small mb-0">
                Available: <strong>{formatCurrency(walletBalance)}</strong>
              </p>
            </div>
            <div>
              <p className="checkout-wallet-max-pill">
              Max usable: {formatCurrency(maxUsableWalletAmount)}
            </p>
            </div>
          </div>

          {appliedWalletAmount > 0 ? (
            <div className="checkout-wallet-applied">
              <div>
                <strong>{formatCurrency(appliedWalletAmount)} applied</strong>

                <p className="text-muted small mb-0">
                  Remaining payable:{" "}
                  {formatCurrency(Math.max(0, orderAmount - appliedWalletAmount))}
                </p>
              </div>

              <Button
                type="button"
                variant="outline-danger"
                className="btn-sm"
                onClick={handleRemoveWallet}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <div className="input-group">
                <input
                  type="number"
                  min={0}
                  max={maxUsableWalletAmount}
                  className="form-control"
                  placeholder={`Enter amount up to ${maxUsableWalletAmount}`}
                  value={walletAmountInput}
                  onChange={(event) => setWalletAmountInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleApplyWallet();
                    }
                  }}
                />

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleApplyWallet}
                >
                  Apply
                </Button>
              </div>

              <button
                type="button"
                className="checkout-wallet-use-max-btn"
                onClick={handleUseMaximumWallet}
              >
                Use maximum wallet balance
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutWalletRedemption;