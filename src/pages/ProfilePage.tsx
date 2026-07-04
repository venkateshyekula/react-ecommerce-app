import { Link, Navigate } from "react-router-dom";
import Button from "../components/common/Button";
import { useAuth } from "../context/useAuth";

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="profile-page bg-light">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="profile-summary-card bg-white rounded-4 shadow-sm p-4 text-center">
              <div className="profile-avatar mx-auto mb-3">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>

              <h3 className="fw-bold mb-1">{currentUser.name}</h3>
              <p className="text-muted mb-3">{currentUser.email}</p>

              <span className="badge bg-success-subtle text-success border border-success-subtle">
                Active Customer
              </span>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                <div>
                  <h2 className="fw-bold mb-1">My Profile</h2>
                  <p className="text-muted mb-0">
                    View your account and contact details.
                  </p>
                </div>

                <Button variant="outline-danger" onClick={logout}>
                  <i className="bi bi-box-arrow-right me-2" />
                  Logout
                </Button>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="profile-info-box bg-light rounded-4 p-3">
                    <p className="small text-muted mb-1">Full Name</p>
                    <h6 className="fw-bold mb-0">{currentUser.name}</h6>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="profile-info-box bg-light rounded-4 p-3">
                    <p className="small text-muted mb-1">Role</p>
                    <h6 className="fw-bold mb-0">{currentUser.role}</h6>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="profile-info-box bg-light rounded-4 p-3">
                    <p className="small text-muted mb-1">Email Address</p>
                    <h6 className="fw-bold mb-0">{currentUser.email}</h6>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="profile-info-box bg-light rounded-4 p-3">
                    <p className="small text-muted mb-1">Mobile Number</p>
                    <h6 className="fw-bold mb-0">{currentUser.mobile}</h6>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="profile-info-box bg-light rounded-4 p-3">
                    <p className="small text-muted mb-1">Account Status</p>
                    <h6 className="fw-bold text-success mb-0">Active</h6>
                  </div>
                </div>

                <div className="col-12">
                  <div className="profile-info-box bg-light rounded-4 p-3">
                    <p className="small text-muted mb-1">Address</p>
                    <h6 className="fw-bold mb-0">{currentUser.address}</h6>
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              <div className="row g-3">
                <div className="col-md-4">
                  <Link
                    to="/products"
                    className="profile-action-card text-decoration-none bg-primary-subtle text-primary rounded-4 p-3 d-block h-100"
                  >
                    <i className="bi bi-bag fs-3 mb-2 d-block" />
                    <h6 className="fw-bold mb-1">Shop Products</h6>
                    <p className="small mb-0">Browse latest products.</p>
                  </Link>
                </div>

                <div className="col-md-4">
                  <Link
                    to="/cart"
                    className="profile-action-card text-decoration-none bg-success-subtle text-success rounded-4 p-3 d-block h-100"
                  >
                    <i className="bi bi-cart3 fs-3 mb-2 d-block" />
                    <h6 className="fw-bold mb-1">My Cart</h6>
                    <p className="small mb-0">Review cart items.</p>
                  </Link>
                </div>

                <div className="col-md-4">
                  <Link
                    to="/orders"
                    className="profile-action-card text-decoration-none bg-warning-subtle text-warning rounded-4 p-3 d-block h-100"
                  >
                    <i className="bi bi-receipt fs-3 mb-2 d-block" />
                    <h6 className="fw-bold mb-1">My Orders</h6>
                    <p className="small mb-0">Track previous orders.</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
