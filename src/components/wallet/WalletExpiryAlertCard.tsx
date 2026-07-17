import type { ExpiringWalletCredit } from "../../utils/walletExpiryUtils";
import { formatCurrency } from "../../utils/currencyFormatter";

interface WalletExpiryAlertCardProps {
  expiringCredits: ExpiringWalletCredit[];
}

const formatExpiryDate = (dateValue: string): string => {
  return new Date(dateValue).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const WalletExpiryAlertCard = ({
  expiringCredits
}: WalletExpiryAlertCardProps) => {
  if (expiringCredits.length === 0) {
    return null;
  }

  const totalExpiringAmount = expiringCredits.reduce(
    (sum, item) => sum + item.transaction.amount,
    0
  );

  return (
    <div className="wallet-expiry-alert-card">
      <div className="wallet-expiry-alert-icon">
        <i className="bi bi-hourglass-split" />
      </div>

      <div className="flex-grow-1">
        <h5 className="fw-bold mb-1">Wallet credit expiring soon</h5>

        <p className="text-muted mb-3">
          {formatCurrency(totalExpiringAmount)} wallet credit is expiring within
          the next {expiringCredits.length === 1 ? "few days" : "7 days"}.
        </p>

        <div className="wallet-expiry-list">
          {expiringCredits.map(({ transaction, daysLeft, expiresAt }) => (
            <div className="wallet-expiry-item" key={transaction.id}>
              <div>
                <strong>{formatCurrency(transaction.amount)}</strong>

                <p className="text-muted small mb-0">
                  {transaction.description}
                </p>
              </div>

              <span className="wallet-expiry-pill">
                {daysLeft === 0
                  ? "Expires today"
                  : `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`}
                <small>{formatExpiryDate(expiresAt)}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletExpiryAlertCard;