import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import HeaderSearchBar from "./HeaderSearchBar";
import NotificationCenter from "./NotificationCenter";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = (): void => {
    logout();
    setIsMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = (): void => {
    setIsMenuOpen(false);
  };

  const userRole = currentUser?.role;

  const isAdmin = userRole === "ADMIN";
  const isCustomer = userRole === "CUSTOMER";
  const isSeller = userRole === "SELLER";
  const isSupport = userRole === "SUPPORT";

  const canUseShoppingFeatures = isCustomer || isAdmin;
  const canSeeWishlist = isCustomer || isAdmin;
  const canSeeCustomerOrders = isCustomer || isAdmin;
  const canSeeAddressBook = isCustomer || isAdmin;

  const userInitial = currentUser?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <nav className="navbar navbar-expand-lg navbar-light sticky-top ecommerce-navbar py-2">
      <div className="container-fluid">
        <Link
          className="navbar-brand fw-bold text-primary d-flex align-items-center"
          to="/home"
          onClick={closeMenu}
        >
          <i className="bi bi-bag-check-fill me-2 fs-4" />
          ShopEase
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          aria-controls="mainNavbar"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsMenuOpen((previousValue) => !previousValue)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className={`collapse navbar-collapse align-items-center ${
            isMenuOpen ? "show" : ""
          }`}
          id="mainNavbar"
        >
          <div
            className="navbar-search-wrapper flex-grow-1 mx-lg-4 my-2 my-lg-0"
            style={{ maxWidth: "600px" }}
          >
            <HeaderSearchBar />
          </div>

          <ul className="navbar-nav ms-auto align-items-lg-center gap-2 gap-lg-3">
            {isAuthenticated ? (
              <>
                {canSeeWishlist ? (
                  <li className="nav-item">
                    <NavLink
                      className="nav-link position-relative d-flex align-items-center gap-1"
                      to="/wishlist"
                      onClick={closeMenu}
                    >
                      <i className="bi bi-heart fs-5" />
                      <span className="d-lg-none">Wishlist</span>

                      {wishlistCount > 0 ? (
                        <span
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {wishlistCount}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ) : null}

                <NotificationCenter />

                {canUseShoppingFeatures ? (
                  <li className="nav-item me-lg-2">
                    <NavLink
                      className="nav-link position-relative d-flex align-items-center gap-1"
                      to="/cart"
                      onClick={closeMenu}
                    >
                      <i className="bi bi-cart3 fs-5" />
                      <span className="d-lg-none">Cart</span>

                      {cartCount > 0 ? (
                        <span
                          className="position-absolute cart-badge translate-middle badge rounded-pill bg-danger"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {cartCount}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ) : null}

                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle user-menu-toggle d-flex align-items-center gap-2 p-0 bg-transparent border-0"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span
                      className="user-avatar-mini bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: "32px",
                        height: "32px",
                        fontSize: "0.85rem"
                      }}
                    >
                      {userInitial}
                    </span>

                    <span className="user-menu-name text-dark fw-medium d-none d-sm-inline">
                      {currentUser?.name}
                    </span>
                  </button>

                  <ul
                    className="dropdown-menu dropdown-menu-end border-0 shadow rounded-3 p-2 mt-2 user-menu-dropdown"
                    style={{ minWidth: "300px" }}
                  >
                    <li className="user-dropdown-header p-3 bg-light rounded-3 d-flex gap-3 align-items-center mb-2">
                      <div
                        className="user-dropdown-avatar bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-5"
                        style={{ width: "60px", height: "60px" }}
                      >
                        {userInitial}
                      </div>

                      <div className="flex-grow-1 min-w-0">
                        <p className="fw-bold mb-0 text-truncate text-dark">
                          {currentUser?.name}
                        </p>

                        <p className="small text-muted text-truncate mb-2">
                          {currentUser?.email}
                        </p>

                        {userRole ? (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small px-2 py-1">
                            <i className="bi bi-shield-check me-1" />
                            {userRole}
                          </span>
                        ) : null}
                      </div>
                    </li>

                    {isAdmin ? (
                      <li>
                        <Link
                          className="dropdown-item rounded-2 py-2"
                          to="/admin/dashboard"
                          onClick={closeMenu}
                        >
                          <i className="bi bi-speedometer2 me-2 text-primary" />
                          Admin Dashboard
                        </Link>
                      </li>
                    ) : null}

                    {isSeller ? (
                      <li>
                        <Link
                          className="dropdown-item rounded-2 py-2"
                          to="/seller/dashboard"
                          onClick={closeMenu}
                        >
                          <i className="bi bi-shop me-2 text-primary" />
                          Seller Dashboard
                        </Link>
                      </li>
                    ) : null}

                    {isSupport ? (
                      <li>
                        <Link
                          className="dropdown-item rounded-2 py-2"
                          to="/support/dashboard"
                          onClick={closeMenu}
                        >
                          <i className="bi bi-headset me-2 text-primary" />
                          Support Dashboard
                        </Link>
                      </li>
                    ) : null}

                    {isAdmin || isSeller || isSupport ? (
                      <li>
                        <hr className="dropdown-divider my-2" />
                      </li>
                    ) : null}

                    <li>
                      <Link
                        className="dropdown-item rounded-2 py-2"
                        to="/profile"
                        onClick={closeMenu}
                      >
                        <i className="bi bi-person me-2 text-muted" />
                        My Profile
                      </Link>
                    </li>

                    {canSeeAddressBook ? (
                      <li>
                        <Link
                          className="dropdown-item rounded-2 py-2"
                          to="/addresses"
                          onClick={closeMenu}
                        >
                          <i className="bi bi-geo-alt me-2 text-muted" />
                          Address Book
                        </Link>
                      </li>
                    ) : null}

                    {canSeeCustomerOrders ? (
                      <>
                        <li>
                          <Link
                            className="dropdown-item rounded-2 py-2"
                            to="/orders"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-receipt me-2 text-muted" />
                            My Orders
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item rounded-2 py-2"
                            to="/support-tickets"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-ticket-detailed me-2 text-muted" />
                            My Tickets
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item rounded-2 py-2"
                            to="/wallet"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-wallet2 me-2 text-muted" />
                            My Wallet
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item rounded-2 py-2"
                            to="/rewards"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-stars me-2 text-muted" />
                            Rewards
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item rounded-2 py-2"
                            to="/savings"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-piggy-bank me-2 text-muted" />
                            Savings
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item rounded-2 py-2"
                            to="/coupon-history"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-ticket-perforated me-2 text-muted" />
                            Coupons
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item rounded-2 py-2"
                            to="/recommended"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-stars me-2 text-muted" />
                            Recommended
                          </Link>
                        </li>
                      </>
                    ) : null}

                    <li>
                      <hr className="dropdown-divider my-2" />
                    </li>

                    <li>
                      <button
                        className="dropdown-item text-danger rounded-2 py-2 fw-medium"
                        type="button"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2" />
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink
                    className="btn btn-success btn-sm px-3 rounded-pill fw-semibold shadow-sm"
                    to="/login"
                    onClick={closeMenu}
                  >
                    Login
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink
                    className="btn btn-primary btn-sm px-3 rounded-pill fw-semibold shadow-sm"
                    to="/register"
                    onClick={closeMenu}
                  >
                    Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;