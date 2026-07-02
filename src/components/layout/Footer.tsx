import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-dark text-white mt-auto">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-bag-check-fill me-2" />
              ShopEase
            </h5>
            <p className="text-white-50 mb-0">
              A clean React TypeScript e-commerce application with JSON Server,
              cart management, checkout, and order tracking.
            </p>
          </div>

          <div className="col-md-2">
            <h6 className="fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/products">Products</Link>
              </li>
              <li>
                <Link to="/cart">Cart</Link>
              </li>
              <li>
                <Link to="/orders">Orders</Link>
              </li>
            </ul>
          </div>

          <div className="col-md-3">
            <h6 className="fw-bold mb-3">Categories</h6>
            <ul className="list-unstyled footer-links">
              <li>
                <Link to="/categories/Electronics">Electronics</Link>
              </li>
              <li>
                <Link to="/categories/Clothing">Clothing</Link>
              </li>
              <li>
                <Link to="/categories/Books">Books</Link>
              </li>
              <li>
                <Link to="/categories/Footwear">Footwear</Link>
              </li>
            </ul>
          </div>

          <div className="col-md-3">
            <h6 className="fw-bold mb-3">Contact</h6>
            <p className="text-white-50 mb-2">
              <i className="bi bi-envelope me-2" />
              support@shopease.com
            </p>
            <p className="text-white-50 mb-0">
              <i className="bi bi-geo-alt me-2" />
              India
            </p>
          </div>
        </div>

        <hr className="border-secondary my-4" />

        <div className="text-center text-white-50 small">
          © {currentYear} ShopEase. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;