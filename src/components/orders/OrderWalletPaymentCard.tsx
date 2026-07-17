import type { WalletRedemptionSnapshot } from "../../types/order";
import { formatCurrency } from "../../utils/currencyFormatter";

interface OrderWalletPaymentCardProps {
  walletRedemption?: WalletRedemptionSnapshot | null;
}

const OrderWalletPaymentCard = ({
  walletRedemption
}: OrderWalletPaymentCardProps) => {
  if (!walletRedemption?.walletApplied) {
    return null;
  }

  return (
    <div className="order-wallet-payment-card">
      <div className="order-wallet-payment-icon">
        <i className="bi bi-wallet2" />
      </div>

      <div className="flex-grow-1">
        <h6 className="fw-bold mb-1">Wallet Payment Applied</h6>

        <p className="text-muted small mb-2">
          Wallet amount used for this order.
        </p>

        <div className="order-wallet-payment-tags">
          <span>
            Wallet Used: {formatCurrency(walletRedemption.walletAmountUsed)}
          </span>

          <span>
            Payable Amount:{" "}
            {walletRedemption.payableAmount === 0
              ? "Paid by Wallet"
              : formatCurrency(walletRedemption.payableAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderWalletPaymentCard;