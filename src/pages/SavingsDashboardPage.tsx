import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import SavingsInsightCard from "../components/savings/SavingsInsightCard";
import SavingsSummaryCard from "../components/savings/SavingsSummaryCard";
import { useAuth } from "../context/useAuth";
import { orderService } from "../services/orderService";
import { refundService } from "../services/refundService";
import { rewardService } from "../services/rewardService";
import { walletService } from "../services/walletService";
import type { Order } from "../types/order";
import type { RefundRecord } from "../types/refund";
import type { RewardTransaction } from "../types/rewards";
import type { WalletTransaction } from "../types/wallet";
import { formatCurrency } from "../utils/currencyFormatter";
import { calculateCustomerSavingsSummary } from "../utils/savingsUtils";

interface SavingsActivity {
  id: string;
  title: string;
  description: string;
  amount?: number;
  points?: number;
  createdAt: string;
  type: "coupon" | "wallet" | "reward" | "refund";
}

const getActivityIcon = (type: SavingsActivity["type"]): string => {
  switch (type) {
    case "coupon":
      return "bi bi-ticket-perforated";

    case "wallet":
      return "bi bi-wallet2";

    case "reward":
      return "bi bi-stars";

    case "refund":
      return "bi bi-cash-coin";

    default:
      return "bi bi-piggy-bank";
  }
};

const getActivityBadgeClass = (type: SavingsActivity["type"]): string => {
  switch (type) {
    case "coupon":
      return "primary";

    case "wallet":
      return "success";

    case "reward":
      return "warning";

    case "refund":
      return "info";

    default:
      return "secondary";
  }
};

const SavingsDashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<
    WalletTransaction[]
  >([]);
  const [rewardTransactions, setRewardTransactions] = useState<
    RewardTransaction[]
  >([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadSavingsData = async (): Promise<void> => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [orderList, walletList, rewardList, refundList] =
          await Promise.all([
            orderService.getOrdersByUserId(currentUser.id),
            walletService.getTransactionsByUserId(currentUser.id),
            rewardService.getTransactionsByUserId(currentUser.id),
            refundService.getRefundsByUserId(currentUser.id)
          ]);

        setOrders(orderList);
        setWalletTransactions(walletList);
        setRewardTransactions(rewardList);
        setRefunds(refundList);
      } catch {
        setErrorMessage(
          "Unable to load savings dashboard. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadSavingsData();
  }, [currentUser, navigate]);

  const summary = useMemo(() => {
    return calculateCustomerSavingsSummary({
      orders,
      walletTransactions,
      rewardTransactions,
      refunds
    });
  }, [orders, walletTransactions, rewardTransactions, refunds]);

  const activities = useMemo<SavingsActivity[]>(() => {
    const couponActivities: SavingsActivity[] = orders
      .filter((order) => (order.discountAmount ?? 0) > 0)
      .map((order) => ({
        id: `coupon-${order.orderId}`,
        title: "Coupon saving",
        description: `${order.couponCode ?? "Coupon"} applied on order ${
          order.orderId
        }`,
        amount: order.discountAmount,
        createdAt: order.orderDate,
        type: "coupon"
      }));

    const walletActivities: SavingsActivity[] = walletTransactions
      .filter((transaction) => transaction.type === "CREDIT")
      .map((transaction) => ({
        id: `wallet-${transaction.id}`,
        title: "Wallet credit received",
        description: transaction.description,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
        type: "wallet"
      }));

    const rewardActivities: SavingsActivity[] = rewardTransactions
      .filter((transaction) => transaction.type === "EARNED")
      .map((transaction) => ({
        id: `reward-${transaction.id}`,
        title: "Reward points earned",
        description: transaction.description,
        points: transaction.points,
        createdAt: transaction.createdAt,
        type: "reward"
      }));

    const refundActivities: SavingsActivity[] = refunds
      .filter((refund) => refund.status === "COMPLETED")
      .map((refund) => ({
        id: `refund-${refund.id}`,
        title: "Refund completed",
        description: `Refund ${refund.refundId} completed`,
        amount: refund.amount,
        createdAt: refund.completedAt ?? refund.initiatedAt,
        type: "refund"
      }));

    return [
      ...couponActivities,
      ...walletActivities,
      ...rewardActivities,
      ...refundActivities
    ]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      )
      .slice(0, 20);
  }, [orders, walletTransactions, rewardTransactions, refunds]);

  if (isLoading) {
    return (
      <main className="savings-dashboard-page bg-light shopease-brand-page">
        <div className="container-fluid py-5">
          <Loader message="Loading savings dashboard..." />
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="savings-dashboard-page bg-light shopease-brand-page">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">My Savings</h1>
              <p className="text-muted mb-0">
                Track your total benefits from coupons, wallet, rewards and
                refunds.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <Link to="/wallet" className="btn btn-outline-primary">
                <i className="bi bi-wallet2 me-2" />
                Wallet
              </Link>

              <Link to="/rewards" className="btn btn-outline-primary">
                <i className="bi bi-stars me-2" />
                Rewards
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        {errorMessage ? (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <SavingsSummaryCard summary={summary} />

        <div className="row g-4 mt-1">
          <div className="col-md-6 col-xl-3">
            <SavingsInsightCard
              title="Coupon Savings"
              value={summary.couponSavings}
              iconClassName="bi bi-ticket-perforated"
              variant="primary"
              description="Total discounts received through coupons."
            />
          </div>

          <div className="col-md-6 col-xl-3">
            <SavingsInsightCard
              title="Wallet Credits"
              value={summary.walletCreditsReceived}
              iconClassName="bi bi-wallet2"
              variant="success"
              description="Total wallet credits received."
            />
          </div>

          <div className="col-md-6 col-xl-3">
            <SavingsInsightCard
              title="Reward Savings"
              value={summary.rewardSavings}
              iconClassName="bi bi-stars"
              variant="warning"
              description={`${summary.rewardPointsRedeemed} reward points redeemed.`}
            />
          </div>

          <div className="col-md-6 col-xl-3">
            <SavingsInsightCard
              title="Completed Refunds"
              value={summary.refundAmount}
              iconClassName="bi bi-cash-coin"
              variant="info"
              description="Total completed refund benefits."
            />
          </div>
        </div>

        <div className="card border shadow-sm rounded-4 mt-4">
          <div className="card-header bg-white">
            <h5 className="fw-bold mb-1">Recent Benefit Activity</h5>
            <p className="text-muted small mb-0">
              Latest savings and benefits from your ShopEase account.
            </p>
          </div>

          {activities.length === 0 ? (
            <EmptyState
              title="No savings activity yet"
              message="Your coupon savings, wallet credits, reward points and refunds will appear here."
              iconClassName="bi bi-piggy-bank"
            />
          ) : (
            <div className="list-group list-group-flush">
              {activities.map((activity) => (
                <div
                  className="list-group-item d-flex flex-column flex-md-row justify-content-between gap-3"
                  key={activity.id}
                >
                  <div className="d-flex align-items-start gap-3">
                    <span
                      className={`savings-activity-icon bg-${getActivityBadgeClass(
                        activity.type
                      )}-subtle text-${getActivityBadgeClass(activity.type)}`}
                    >
                      <i className={getActivityIcon(activity.type)} />
                    </span>

                    <div>
                      <strong>{activity.title}</strong>

                      <p className="text-muted small mb-0">
                        {activity.description}
                      </p>

                      <p className="text-muted small mb-0">
                        {new Date(activity.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="text-md-end">
                    <span
                      className={`badge bg-${getActivityBadgeClass(
                        activity.type
                      )}`}
                    >
                      {activity.type.toUpperCase()}
                    </span>

                    <h6 className="fw-bold mt-2 mb-0">
                      {activity.amount !== undefined
                        ? formatCurrency(activity.amount)
                        : `${activity.points ?? 0} pts`}
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

export default SavingsDashboardPage;