import type { WalletTransaction } from "../../types/wallet";
import { formatCurrency } from "../../utils/currencyFormatter";

interface WalletSummaryCardProps {
  transactions: WalletTransaction[];
}

const WalletSummaryCard = ({ transactions }: WalletSummaryCardProps) => {
  const walletBalance = transactions.reduce((balance, transaction) => {
    if (transaction.type === "CREDIT") {
      return balance + transaction.amount;
    }

    return balance - transaction.amount;
  }, 0);

  const totalCredits = transactions
    .filter((transaction) => transaction.type === "CREDIT")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalDebits = transactions
    .filter((transaction) => transaction.type === "DEBIT")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="wallet-summary-card">
      <div className="wallet-summary-main">
        <div>
          <p className="text-muted mb-1">Available Wallet Balance</p>
          <h2 className="fw-bold mb-0">{formatCurrency(walletBalance)}</h2>
        </div>

        <div className="wallet-summary-icon">
          <i className="bi bi-wallet2" />
        </div>
      </div>

      <div className="wallet-summary-stats">
        <div>
          <span>Total Credits</span>
          <strong className="text-success">{formatCurrency(totalCredits)}</strong>
        </div>

        <div>
          <span>Total Debits</span>
          <strong className="text-danger">{formatCurrency(totalDebits)}</strong>
        </div>

        <div>
          <span>Transactions</span>
          <strong>{transactions.length}</strong>
        </div>
      </div>
    </div>
  );
};

export default WalletSummaryCard;