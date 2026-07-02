import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate("/login");
  };

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

              <ul className="dropdown-menu border-0 shadow-sm rounded-3">
                <li>
                  <Link className="dropdown-item" to="/categories/Electronics">
                    Electronics
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/categories/Clothing">
                    Clothing
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/categories/Books">
                    Books
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/categories/Footwear">
                    Footwear
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/categories/Accessories">
                    Accessories
                  </Link>
                </li>
              </ul>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/profile">
                    <i className="bi bi-person-circle me-1" />
                    Profile
                  </NavLink>
                </li>

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

                <li className="nav-item">
                  <NavLink className="nav-link" to="/orders">
                    <i className="bi bi-receipt me-1" />
                    Orders
                  </NavLink>
                </li>

                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link text-decoration-none"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {currentUser?.name}
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3">
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        My Profile
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/orders">
                        My Orders
                      </Link>
                    </li>
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
                  <NavLink className="btn btn-primary btn-sm px-3" to="/register">
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