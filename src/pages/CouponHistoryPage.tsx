import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import { useAuth } from "../context/useAuth";
import { couponRedemptionService } from "../services/couponRedemptionService";
import type { CouponRedemption } from "../types/couponRedemption";
import { formatCurrency } from "../utils/currencyFormatter";

const CouponHistoryPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const loadCouponHistory = async (): Promise<void> => {
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await couponRedemptionService.getRedemptionsByUserId(
          currentUser.id
        );

        setRedemptions(
          data.sort(
            (first, second) =>
              new Date(second.redeemedAt).getTime() -
              new Date(first.redeemedAt).getTime()
          )
        );
      } catch {
        setErrorMessage(
          "Unable to load coupon history. Please make sure JSON Server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCouponHistory();
  }, [currentUser, navigate]);

  const totalSavings = useMemo(() => {
    return redemptions.reduce(
      (sum, redemption) => sum + redemption.discountAmount,
      0
    );
  }, [redemptions]);

  if (isLoading) {
    return (
      <main className="coupon-history-page bg-light shopease-brand-page">
        <div className="container-fluid py-5">
          <Loader message="Loading coupon history..." />
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="coupon-history-page bg-light shopease-brand-page">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">Coupon History</h1>
              <p className="text-muted mb-0">
                Track coupons used during checkout and your total coupon savings.
              </p>
            </div>

            <Link to="/products" className="btn btn-outline-primary">
              <i className="bi bi-bag me-2" />
              Shop More
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

        <div className="card border shadow-sm rounded-4 mb-4">
          <div className="card-body d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              <p className="text-muted mb-1">Total Coupon Savings</p>
              <h2 className="fw-bold text-primary mb-0">
                {formatCurrency(totalSavings)}
              </h2>
            </div>

            <div className="coupon-history-summary-icon bg-primary-subtle text-primary">
              <i className="bi bi-ticket-perforated" />
            </div>
          </div>
        </div>

        <div className="card border shadow-sm rounded-4">
          <div className="card-header bg-white">
            <h5 className="fw-bold mb-1">Used Coupons</h5>
            <p className="text-muted small mb-0">
              Coupon redemption activity from your orders.
            </p>
          </div>

          {redemptions.length === 0 ? (
            <EmptyState
              title="No coupon history"
              message="Coupons used during checkout will appear here."
              iconClassName="bi bi-ticket-perforated"
            />
          ) : (
            <div className="list-group list-group-flush">
              {redemptions.map((redemption) => (
                <div
                  className="list-group-item d-flex flex-column flex-md-row justify-content-between gap-3"
                  key={redemption.id}
                >
                  <div>
                    <strong>{redemption.couponCode}</strong>

                    <p className="text-muted small mb-0">
                      Order: {redemption.orderId}
                    </p>

                    <p className="text-muted small mb-0">
                      Redeemed on{" "}
                      {new Date(redemption.redeemedAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="text-md-end">
                    <span className="badge bg-success">SAVED</span>

                    <h6 className="fw-bold mt-2 mb-0 text-success">
                      {formatCurrency(redemption.discountAmount)}
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

export default CouponHistoryPage;