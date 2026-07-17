import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import RewardSummaryCard from "../components/rewards/RewardSummaryCard";
import { useAuth } from "../context/useAuth";
import { rewardService } from "../services/rewardService";
import type { RewardTransaction } from "../types/rewards";
import RewardExpiryAlertCard from "../components/rewards/RewardExpiryAlertCard";
import { notificationService } from "../services/notificationService";
import {
  getExpiredRewardTransactions,
  getExpiringRewardTransactions,
  getRewardExpiryNotificationReferenceId,
  getRewardExpiryReferenceId
} from "../utils/rewardExpiryUtils";

const getRewardBadgeClass = (type: RewardTransaction["type"]): string => {
  switch (type) {
    case "EARNED":
    case "ADJUSTED":
      return "success";

    case "REDEEMED":
      return "primary";

    case "EXPIRED":
      return "secondary";

    default:
      return "secondary";
  }
};

const getSourceLabel = (source: RewardTransaction["source"]): string => {
  switch (source) {
    case "ORDER":
      return "Order";

    case "WALLET":
      return "Wallet";

    case "PROMOTION":
      return "Promotion";

    case "ADMIN_ADJUSTMENT":
      return "Admin Adjustment";

    case "EXPIRY":
      return "Expiry";

    default:
      return source;
  }
};

const RewardsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadRewards = async (): Promise<void> => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await rewardService.getTransactionsByUserId(
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
          "Unable to load rewards. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadRewards();
  }, [currentUser, navigate]);

  const latestTransactions = useMemo(() => {
    return transactions.slice(0, 50);
  }, [transactions]);

  const expiringRewards = useMemo(() => {
  return getExpiringRewardTransactions(transactions, 7);
}, [transactions]);

const expiredRewards = useMemo(() => {
  return getExpiredRewardTransactions(transactions);
}, [transactions]);

useEffect(() => {
  const createExpiredRewardTransactions = async (): Promise<void> => {
    if (!currentUser || expiredRewards.length === 0) {
      return;
    }

    try {
      await Promise.all(
        expiredRewards.map(async (transaction) => {
          const referenceId = getRewardExpiryReferenceId(transaction);

          const existingExpiryTransactions =
            await rewardService.getTransactionsByUserIdAndReferenceId(
              currentUser.id,
              referenceId
            );

          if (existingExpiryTransactions.length > 0) {
            return;
          }

          const createdTransaction = await rewardService.createTransaction({
            transactionId: `RWD-EXP-${Date.now()}`,
            userId: currentUser.id,
            type: "EXPIRED",
            source: "EXPIRY",
            points: transaction.points,
            description: `Expired reward points from ${transaction.transactionId}`,
            createdAt: new Date().toISOString(),
            referenceId,
            orderId: transaction.orderId
          });

          setTransactions((previousTransactions) => [
            createdTransaction,
            ...previousTransactions
          ]);
        })
      );
    } catch {
      // Do not block rewards page if expiry automation fails.
    }
  };

  void createExpiredRewardTransactions();
}, [currentUser, expiredRewards]);

useEffect(() => {
  const createRewardExpiryNotifications = async (): Promise<void> => {
    if (!currentUser || expiringRewards.length === 0) {
      return;
    }

    try {
      await Promise.all(
        expiringRewards.map(async ({ transaction, daysLeft }) => {
          const referenceId =
            getRewardExpiryNotificationReferenceId(transaction);

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
            title: "Reward points expiring soon",
            message:
              daysLeft === 0
                ? `${transaction.points} reward points expire today.`
                : `${transaction.points} reward points expire in ${daysLeft} day${
                    daysLeft > 1 ? "s" : ""
                  }.`,
            type: "WARNING",
            referenceId
          });
        })
      );
    } catch {
      // Do not block rewards page if notification creation fails.
    }
  };

  void createRewardExpiryNotifications();
}, [currentUser, expiringRewards]);

  if (isLoading) {
    return (
      <main className="rewards-page bg-light shopease-brand-page">
        <div className="container-fluid py-5">
          <Loader message="Loading rewards..." />
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="rewards-page bg-light shopease-brand-page">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">My Rewards</h1>
              <p className="text-muted mb-0">
                Track reward points earned from orders and promotions.
              </p>
            </div>

            <Link to="/wallet" className="btn btn-outline-primary">
              <i className="bi bi-wallet2 me-2" />
              View Wallet
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

        <RewardSummaryCard transactions={transactions} />

        <RewardExpiryAlertCard expiringRewards={expiringRewards} />

        <div className="card border mt-4">
          <div className="card-header bg-white">
            <h5 className="fw-bold mb-1">Reward Ledger</h5>
            <p className="text-muted small mb-0">
              All earned, redeemed and expired reward point transactions.
            </p>
          </div>

          {latestTransactions.length === 0 ? (
            <EmptyState
              title="No reward transactions"
              message="Reward points earned from orders will appear here."
              iconClassName="bi bi-stars"
            />
          ) : (
            <div className="list-group list-group-flush">
              {latestTransactions.map((transaction) => (
                <div
                  className="list-group-item d-flex flex-column flex-md-row justify-content-between gap-3"
                  key={transaction.id}
                >
                  <div>
                    <strong>{transaction.description}</strong>

                    <p className="text-muted small mb-0">
                      {getSourceLabel(transaction.source)} •{" "}
                      {new Date(transaction.createdAt).toLocaleString("en-IN")}
                    </p>

                    {transaction.orderId ? (
                      <p className="text-muted small mb-0">
                        Order: {transaction.orderId}
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
                      className={`badge bg-${getRewardBadgeClass(
                        transaction.type
                      )}`}
                    >
                      {transaction.type}
                    </span>

                    <h6 className="fw-bold mt-2 mb-0">
                      {transaction.type === "EARNED" ||
                      transaction.type === "ADJUSTED"
                        ? "+"
                        : "-"}{" "}
                      {transaction.points} pts
                    </h6>
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

export default RewardsPage;