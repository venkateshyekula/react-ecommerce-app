import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import WalletExpiryAlertCard from "../components/wallet/WalletExpiryAlertCard";
import WalletSummaryCard from "../components/wallet/WalletSummaryCard";
import { useAuth } from "../context/useAuth";
import { notificationService } from "../services/notificationService";
import { walletService } from "../services/walletService";
import type { WalletTransaction } from "../types/wallet";
import { formatCurrency } from "../utils/currencyFormatter";
import { getExpiringWalletCredits } from "../utils/walletExpiryUtils";

const getTransactionBadgeClass = (type: WalletTransaction["type"]): string => {
  return type === "CREDIT" ? "success" : "danger";
};

const getSourceLabel = (source: WalletTransaction["source"]): string => {
  switch (source) {
    case "REFUND":
      return "Refund";

    case "ORDER_PAYMENT":
      return "Order Payment";

    case "ADMIN_ADJUSTMENT":
      return "Admin Adjustment";

    case "PROMOTION":
      return "Promotion";

    case "STORE_CREDIT":
      return "Store Credit";

    default:
      return source;
  }
};

const WalletPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadWallet = async (): Promise<void> => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await walletService.getTransactionsByUserId(
          currentUser.id
        );

        setTransactions(
          data.sort(
            (first, second) =>
              new Date(second.createdAt).getTime() -
              new Date(first.createdAt).getTime()
          )
        );
      } catch {
        setErrorMessage(
          "Unable to load wallet transactions. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadWallet();
  }, [currentUser, navigate]);

  const expiringCredits = useMemo(() => {
    return getExpiringWalletCredits(transactions, 7);
  }, [transactions]);

  useEffect(() => {
    const createWalletExpiryNotifications = async (): Promise<void> => {
      if (!currentUser || expiringCredits.length === 0) {
        return;
      }

      try {
        await Promise.all(
          expiringCredits.map(async ({ transaction, daysLeft }) => {
            const referenceId = `wallet-expiry-${transaction.id}`;

            const existingNotifications =
              await notificationService.getNotificationsByUserIdAndReferenceId(
                currentUser.id,
                referenceId
              );

            if (existingNotifications.length > 0) {
              return;
            }

            await notificationService.createNotification({
              userId: currentUser.id,
              title: "Wallet credit expiring soon",
              message:
                daysLeft === 0
                  ? `${formatCurrency(
                      transaction.amount
                    )} wallet credit expires today.`
                  : `${formatCurrency(
                      transaction.amount
                    )} wallet credit expires in ${daysLeft} day${
                      daysLeft > 1 ? "s" : ""
                    }.`,
              type: "WARNING",
              referenceId
            });
          })
        );
      } catch {
        // Do not block wallet page if notification creation fails.
      }
    };

    void createWalletExpiryNotifications();
  }, [currentUser, expiringCredits]);

  const latestTransactions = useMemo(() => {
    return transactions.slice(0, 50);
  }, [transactions]);

  if (isLoading) {
    return (
      <main className="wallet-page bg-light shopease-brand-page">
        <div className="container-fluid py-5">
          <Loader message="Loading wallet..." />
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="wallet-page bg-light shopease-brand-page">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">My Wallet</h1>
              <p className="text-muted mb-0">
                Track refunds, store credits and wallet transactions.
              </p>
            </div>

            <Link to="/orders" className="btn btn-outline-primary">
              <i className="bi bi-receipt me-2" />
              View Orders
            </Link>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {errorMessage ? (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <div className="mb-4">
          <WalletSummaryCard transactions={transactions} />
        </div>

        <div className="mb-4">
          <WalletExpiryAlertCard expiringCredits={expiringCredits} />
        </div>

        <div className="wallet-ledger-card bg-white mt-4">
          <div className="wallet-ledger-header">
            <div>
              <h5 className="fw-bold mb-1">Wallet Ledger</h5>
              <p className="text-muted small mb-0">
                All wallet credits and debits linked to your account.
              </p>
            </div>
          </div>

          {latestTransactions.length === 0 ? (
            <EmptyState
              title="No wallet transactions"
              message="Wallet credits and store credits will appear here."
              iconClassName="bi bi-wallet2"
            />
          ) : (
            <div className="wallet-transaction-list">
              {latestTransactions.map((transaction) => (
                <div className="wallet-transaction-row" key={transaction.id}>
                  <div className="wallet-transaction-icon">
                    <i
                      className={
                        transaction.type === "CREDIT"
                          ? "bi bi-arrow-down-left"
                          : "bi bi-arrow-up-right"
                      }
                    />
                  </div>

                  <div className="wallet-transaction-content">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
                      <div>
                        <strong>{transaction.description}</strong>

                        <p className="text-muted small mb-0">
                          {getSourceLabel(transaction.source)} •{" "}
                          {new Date(transaction.createdAt).toLocaleString(
                            "en-IN"
                          )}
                        </p>

                        {transaction.orderId ? (
                          <p className="text-muted small mb-0">
                            Order: {transaction.orderId}
                          </p>
                        ) : null}

                        {transaction.refundId ? (
                          <p className="text-muted small mb-0">
                            Refund: {transaction.refundId}
                          </p>
                        ) : null}

                        {transaction.expiresAt ? (
                          <p className="text-muted small mb-0">
                            Expires:{" "}
                            {new Date(transaction.expiresAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              }
                            )}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-md-end">
                        <span
                          className={`wallet-transaction-pill ${getTransactionBadgeClass(
                            transaction.type
                          )}`}
                        >
                          {transaction.type}
                        </span>

                        <h6 className="fw-bold mt-2 mb-0">
                          {transaction.type === "CREDIT" ? "+" : "-"}{" "}
                          {formatCurrency(transaction.amount)}
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default WalletPage;