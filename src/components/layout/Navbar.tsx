import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate("/login");
  };

  const userRole = currentUser?.role;

  const isAdmin = userRole === "ADMIN";
  const isCustomer = userRole === "CUSTOMER";
  const isSeller = userRole === "SELLER";
  const isSupport = userRole === "SUPPORT";

  const canUseShoppingFeatures = isCustomer || isAdmin;
  const canSeeWishlist = isCustomer || isAdmin;
  const canSeeCustomerOrders = isCustomer || isAdmin;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white ecommerce-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary" to="/">
          <i className="bi bi-bag-check-fill me-2" />
          ShopEase
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className="nav-link" to="/products">
                Products
              </NavLink>
            </li>

            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle btn btn-link text-decoration-none"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Categories
              </button>

              <ul className="dropdown-menu border-0 shadow-sm rounded-3 category-menu-dropdown">
                <li>
                  <Link className="dropdown-item" to="/categories/Electronics">
                    <i className="bi bi-phone me-2 text-primary" />
                    Electronics
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item" to="/categories/Clothing">
                    <i className="bi bi-bag-heart me-2 text-primary" />
                    Clothing
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item" to="/categories/Books">
                    <i className="bi bi-book me-2 text-primary" />
                    Books
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item" to="/categories/Footwear">
                    <i className="bi bi-bootstrap-reboot me-2 text-primary" />
                    Footwear
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item" to="/categories/Accessories">
                    <i className="bi bi-watch me-2 text-primary" />
                    Accessories
                  </Link>
                </li>
              </ul>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            {isAuthenticated ? (
              <>
                {canUseShoppingFeatures ? (
                  <li className="nav-item">
                    <NavLink className="nav-link position-relative" to="/cart">
                      <i className="bi bi-cart3 me-1" />
                      Cart
                      {cartCount > 0 ? (
                        <span className="cart-count-badge badge rounded-pill bg-danger ms-1">
                          {cartCount}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ) : null}

                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link text-decoration-none user-menu-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span className="user-avatar-mini">
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </span>
                    <span className="user-menu-name">{currentUser?.name}</span>
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3 user-menu-dropdown">
                    <li className="user-dropdown-header">
                      <div className="user-dropdown-avatar">
                        {currentUser?.name?.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-grow-1">
                        <p className="fw-bold mb-0">{currentUser?.name}</p>
                        <p className="small text-muted mb-2">
                          {currentUser?.email}
                        </p>

                        {userRole ? (
                          <span className="role-badge">
                            <i className="bi bi-shield-check me-1" />
                            {userRole}
                          </span>
                        ) : null}
                      </div>
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    {isAdmin ? (
                      <li>
                        <Link className="dropdown-item" to="/admin/dashboard">
                          <i className="bi bi-speedometer2 me-2 text-primary" />
                          Admin Dashboard
                        </Link>
                      </li>
                    ) : null}

                    {isSeller ? (
                      <li>
                        <Link className="dropdown-item" to="/seller/dashboard">
                          <i className="bi bi-shop me-2 text-primary" />
                          Seller Dashboard
                        </Link>
                      </li>
                    ) : null}

                    {isSupport ? (
                      <li>
                        <Link className="dropdown-item" to="/support/dashboard">
                          <i className="bi bi-headset me-2 text-primary" />
                          Support Dashboard
                        </Link>
                      </li>
                    ) : null}

                    {(isAdmin || isSeller || isSupport) ? (
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                    ) : null}

                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person me-2" />
                        My Profile
                      </Link>
                    </li>

                    {canSeeWishlist ? (
                      <li>
                        <Link className="dropdown-item" to="/wishlist">
                          <i className="bi bi-heart me-2" />
                          My Wishlist
                          {wishlistCount > 0 ? (
                            <span className="badge bg-danger rounded-pill ms-2">
                              {wishlistCount}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ) : null}

                    {canSeeCustomerOrders ? (
                      <li>
                        <Link className="dropdown-item" to="/orders">
                          <i className="bi bi-receipt me-2" />
                          My Orders
                        </Link>
                      </li>
                    ) : null}

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    <li>
                      <button
                        className="dropdown-item text-danger"
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
                  <NavLink className="nav-link" to="/login">
                    Login
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink
                    className="btn btn-primary btn-sm px-3"
                    to="/register"
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