import { Link, Navigate } from "react-router-dom";
import Button from "../components/common/Button";
import { useAuth } from "../context/useAuth";

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userInitial = currentUser.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <main className="account-page bg-light">
      <section className="container-fluid py-4 py-lg-5">
        <div className="row g-4">
          <aside className="col-lg-3">
            <div className="account-sidebar bg-white overflow-hidden">
              <div className="account-sidebar-user p-4 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <div className="account-avatar-neutral">{userInitial}</div>

                  <div className="min-w-0">
                    <h6 className="fw-bold mb-1 text-truncate">
                      {currentUser.name}
                    </h6>
                    <p className="text-muted small mb-0 text-truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="list-group list-group-flush account-nav-list">
                <Link
                  to="/profile"
                  className="list-group-item list-group-item-action active"
                >
                  <i className="bi bi-person me-2" />
                  Profile Overview
                </Link>

                <Link
                  to="/orders"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-box-seam me-2" />
                  Orders & Returns
                </Link>

                <Link
                  to="/addresses"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-geo-alt me-2" />
                  Addresses
                </Link>

                <Link
                  to="/wallet"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-wallet2 me-2" />
                  Wallet
                </Link>

                <Link
                  to="/rewards"
                  className="list-group-item list-group-item-action"
                >
                  <i className="bi bi-stars me-2" />
                  Rewards
                </Link>
              </div>
            </div>
          </aside>

          <section className="col-lg-9">
            <div className="account-section-card bg-white">
              <div className="account-section-header border-bottom p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    <h1 className="h4 fw-bold mb-1">Profile Details</h1>
                    <p className="text-muted mb-0">
                      Manage your account and contact information.
                    </p>
                  </div>

                  <Button variant="outline-danger" className="account-header-action-btn" onClick={logout}>
                    <i className="bi bi-box-arrow-right me-2" />
                    Logout
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <div className="profile-summary-panel rounded-4 p-4 mb-4">
                  <div className="d-flex flex-column flex-md-row align-items-md-center gap-4">
                    <div className="profile-avatar-large">{userInitial}</div>

                    <div className="flex-grow-1">
                      <h2 className="h4 fw-bold mb-1">{currentUser.name}</h2>
                      <p className="text-muted mb-2">{currentUser.email}</p>

                      <div className="d-flex flex-wrap gap-2">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small px-2 py-1">
                          <i className="bi bi-shield-check me-1" />
                          {currentUser.role}
                        </span>

                        <span className="badge text-bg-success">
                          Active Account
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="account-info-tile">
                      <span>Full Name</span>
                      <strong>{currentUser.name}</strong>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="account-info-tile">
                      <span>Email Address</span>
                      <strong>{currentUser.email}</strong>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="account-info-tile">
                      <span>Mobile Number</span>
                      <strong>{currentUser.mobile || "Not added"}</strong>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="account-info-tile">
                      <span>Role</span>
                      <strong>{currentUser.role}</strong>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="account-info-tile">
                      <span>Default Address</span>
                      <strong>{currentUser.address || "Not added"}</strong>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mt-4">
                  <div className="col-md-4">
                    <Link
                      to="/products"
                      className="account-action-tile text-decoration-none bg-primary-subtle text-primary p-3 d-block h-100"
                    >
                      <i className="bi bi-bag fs-3 mb-2 d-block" />
                      <strong className="fw-bold mb-1">Shop Products</strong>
                      <p className="small mb-0">Browse latest products</p>
                    </Link>
                  </div>

                  <div className="col-md-4">
                    <Link
                      to="/cart"
                      className="account-action-tile text-decoration-none bg-success-subtle text-success p-3 d-block h-100"
                    >
                      <i className="bi bi-cart3 fs-3 mb-2 d-block" />
                      <strong className="fw-bold mb-1">My Cart</strong>
                      <p className="small mb-0">Review cart items</p>
                    </Link>
                  </div>

                  <div className="col-md-4">
                    <Link
                      to="/orders"
                      className="account-action-tile text-decoration-none bg-warning-subtle text-warning p-3 d-block h-100"
                    >
                      <i className="bi bi-receipt fs-3 mb-2 d-block" />
                      <strong className="fw-bold mb-1">My Orders</strong>
                      <p className="small mb-0">Track orders and returns</p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default ProfilePage;