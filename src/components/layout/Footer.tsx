import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

interface FooterLink {
  label: string;
  path: string;
}

const popularSearches = [
  "Smartphones", "Laptops", "Running Shoes", "T-Shirts", "Headphones",
  "Backpacks", "Watches", "Books", "Bluetooth Speakers", "Formal Shoes",
  "Casual Shirts", "Jeans", "Fitness Bands", "Gaming Accessories", "Travel Bags",
  "Kitchen Essentials", "Office Chairs", "Wireless Earbuds", "Power Banks",
  "Sunglasses", "Ethnic Wear", "Sneakers", "Home Decor", "Stationery", "Smart Watches"
];

const guestOnlineShoppingLinks: FooterLink[] = [
  { label: "All Products", path: "/products" },
  { label: "Electronics", path: "/categories/Electronics" },
  { label: "Clothing", path: "/categories/Clothing" },
  { label: "Footwear", path: "/categories/Footwear" },
  { label: "Books", path: "/categories/Books" },
  { label: "Accessories", path: "/categories/Accessories" }
];

const guestUsefulLinks: FooterLink[] = [
  { label: "Explore Products", path: "/products" },
  { label: "Compare Products", path: "/compare" },
  { label: "Login", path: "/login" },
  { label: "Register", path: "/register" }
];

const customerLinks: FooterLink[] = [
  { label: "My Profile", path: "/profile" },
  { label: "My Orders", path: "/orders" },
  { label: "Support Tickets", path: "/support-tickets" },
  { label: "Address Book", path: "/addresses" },
  { label: "Wishlist", path: "/wishlist" },
  { label: "Cart", path: "/cart" },
  { label: "Wallet", path: "/wallet" },
  { label: "Rewards", path: "/rewards" },
  { label: "Savings", path: "/savings" },
  { label: "Coupon History", path: "/coupon-history" },
  { label: "Recommended", path: "/recommended" }
];

const adminLinks: FooterLink[] = [
  { label: "Admin Dashboard", path: "/admin/dashboard" },
  { label: "Products", path: "/admin/products" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Order Fulfillment", path: "/admin/order-fulfillment" },
  { label: "Coupons", path: "/admin/coupons" },
  { label: "Refunds", path: "/admin/refunds" },
  { label: "Return Requests", path: "/admin/return-requests" },
  { label: "Wallet Credits", path: "/admin/wallet-credits" },
  { label: "Reward Rules", path: "/admin/reward-rules" },
  { label: "Analytics", path: "/admin/analytics" }
];

const sellerLinks: FooterLink[] = [
  { label: "Seller Dashboard", path: "/seller/dashboard" },
  { label: "My Products", path: "/seller/products" },
  { label: "Seller Orders", path: "/seller/orders" },
  { label: "Product Questions", path: "/seller/questions" }
];

const supportLinks: FooterLink[] = [
  { label: "Support Dashboard", path: "/support/dashboard" },
  { label: "Support Orders", path: "/support/orders" },
  { label: "Support Tickets", path: "/support/tickets" },
  { label: "Help Center", path: "/help-center" },
  { label: "Customer Contact", path: "/contact-support" }
];

const policyLinks: FooterLink[] = [
  { label: "Help Center", path: "/help-center" },
  { label: "FAQ", path: "/faqs" },
  { label: "Contact Support", path: "/contact-support" },
  { label: "Terms of Use", path: "/terms-and-conditions" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Track Orders", path: "/orders" },
  { label: "Shipping & Delivery", path: "/help-center" },
  { label: "Returns & Exchanges", path: "/orders" },
  { label: "Account Security", path: "/profile" }
];

const guestPolicyLinks: FooterLink[] = [
  { label: "Help Center", path: "/help-center" },
  { label: "FAQ", path: "/faqs" },
  { label: "Contact Support", path: "/contact-support" },
  { label: "Terms of Use", path: "/terms-and-conditions" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Login Help", path: "/help-center" },
  { label: "Create Account", path: "/register" }
];

const getRoleBasedPrimaryLinks = (role?: string): { heading: string; links: FooterLink[] } => {
  switch (role) {
    case "ADMIN":
      return { heading: "Admin Workspace", links: adminLinks };
    case "SELLER":
      return { heading: "Seller Workspace", links: sellerLinks };
    case "SUPPORT":
      return { heading: "Support Workspace", links: supportLinks };
    case "CUSTOMER":
    default:
      return { heading: "My Account", links: customerLinks };
  }
};

const renderFooterLinks = (links: FooterLink[]) => {
  return links.map((link) => (
    <Link to={link.path} key={`${link.label}-${link.path}`}>
      {link.label}
    </Link>
  ));
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated, currentUser } = useAuth();

  const roleBasedLinks = getRoleBasedPrimaryLinks(currentUser?.role);
  const isAdmin = currentUser?.role === "ADMIN";
  const isCustomer = currentUser?.role === "CUSTOMER";

  const shouldShowCustomerShoppingLinks = !isAuthenticated || isCustomer || isAdmin;

  return (
    <footer className="footer border-top mt-auto">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-6 col-md-3 col-xl-2">
            <h6 className="footer-heading">Online Shopping</h6>
            <div className="footer-link-list">
              {renderFooterLinks(guestOnlineShoppingLinks)}
              {isAuthenticated && shouldShowCustomerShoppingLinks ? (
                <>
                  <Link to="/wishlist">Wishlist</Link>
                  <Link to="/cart">Cart</Link>
                </>
              ) : null}
            </div>
          </div>

          <div className="col-6 col-md-3 col-xl-2">
            <h6 className="footer-heading">
              {isAuthenticated ? roleBasedLinks.heading : "Useful Links"}
            </h6>
            <div className="footer-link-list">
              {isAuthenticated
                ? renderFooterLinks(roleBasedLinks.links)
                : renderFooterLinks(guestUsefulLinks)}
            </div>
          </div>

          <div className="col-6 col-md-3 col-xl-2">
            <h6 className="footer-heading">Customer Policies</h6>
            <div className="footer-link-list">
              {renderFooterLinks(isAuthenticated ? policyLinks : guestPolicyLinks)}
            </div>
          </div>

          <div className="col-6 col-md-3 col-xl-2">
            <h6 className="footer-heading">Experience ShopEase</h6>
            <p className="footer-muted">
              Shop faster, track orders, manage wishlist, payments, wallet,
              rewards and get personalized product suggestions.
            </p>
            <div className="footer-app-buttons">
              <button type="button" className="footer-store-btn">
                <svg className="play-icon" aria-hidden="true" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0,0h40v40H0V0z"></path><g><path d="M19.7,19.2L4.3,35.3c0,0,0,0,0,0c0.5,1.7,2.1,3,4,3c0.8,0,1.5-0.2,2.1-0.6l0,0l17.4-9.9L19.7,19.2z" fill="#EA4335"></path><path d="M35.3,16.4L35.3,16.4l-7.5-4.3l-8.4,7.4l8.5,8.3l7.5-4.2c1.3-0.7,2.2-2.1,2.2-3.6C37.5,18.5,36.6,17.1,35.3,16.4z" fill="#FBBC04"></path><path d="M4.3,4.7C4.2,5,4.2,5.4,4.2,5.8v28.5c0,0.4,0,0.7,0.1,1.1l16-15.7L4.3,4.7z" fill="#4285F4"></path><path d="M19.8,20l8-7.9L10.5,2.3C9.9,1.9,9.1,1.7,8.3,1.7c-1.9,0-3.6,1.3-4,3c0,0,0,0,0,0L19.8,20z" fill="#34A853"></path></g></svg>
                <span>
                  <small>GET IT ON</small>
                  Google Play
                </span>
              </button>
              <button type="button" className="footer-store-btn">
                <i className="play-icon-apple bi bi-apple" />
                <span>
                  <small>Download on the</small>
                  App Store
                </span>
              </button>
            </div>
          </div>

          <div className="col-md-6 col-xl-4">
            <h6 className="footer-heading">Keep In Touch</h6>
            {/* FIX: Fixed layout elements with proper anchors */}
            <div className="footer-social-links mb-4 d-flex gap-3">
              <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-facebook fs-5" />
              </a>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-twitter-x fs-5" />
              </a>
              <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-youtube fs-5" />
              </a>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-instagram fs-5" />
              </a>
            </div>

            <div className="footer-trust-list">
              <div className="footer-trust-item">
                <i className="bi bi-patch-check" />
                <div>
                  <strong>100% GENUINE PRODUCTS</strong>
                  <span>Quality checked products from trusted sellers.</span>
                </div>
              </div>
              <div className="footer-trust-item">
                <i className="bi bi-arrow-repeat" />
                <div>
                  <strong>EASY RETURNS</strong>
                  <span>Simple return and cancellation experience.</span>
                </div>
              </div>
              <div className="footer-trust-item">
                <i className="bi bi-truck" />
                <div>
                  <strong>FAST DELIVERY</strong>
                  <span>Track your order from doorstep to destination.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {shouldShowCustomerShoppingLinks ? (
          <div className="footer-popular-searches mt-5 pt-4 border-top">
            <h6 className="footer-heading">Popular Searches</h6>
            <div className="footer-search-tags">
              {popularSearches.map((searchText) => (
                <Link
                  to={`/products?search=${encodeURIComponent(searchText)}`}
                  key={searchText}
                >
                  {searchText}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="footer-support-row mt-4 pt-4 border-top">
          <p className="mb-0 text-muted">
            In case of any concern,{" "}
            <Link to="/contact-support" className="footer-contact">
              contact our support team
            </Link>
            .
          </p>
          <p className="mb-0 text-muted">
            © {currentYear} ShopEase. All rights reserved.
          </p>
        </div>

        <div className="row g-4 mt-4 pt-4 border-top">
          <div className="col-lg-4">
            <h6 className="footer-heading">Registered Office Address</h6>
            {/* FIX: Formatted address elements with proper standard anchors */}
            <address className="footer-muted mb-0">
              ShopEase Commerce Private Limited,
              <br />
              Digital Commerce Park,
              <br />
              Bengaluru, Karnataka - 560001,
              <br />
              India
              <br />
              Email:{" "}
              <a href="mailto:support@shopease.com">support@shopease.com</a>
              <br />
              Telephone: <a href="tel:08040011450">080-40011450</a>
            </address>
          </div>

          <div className="col-lg-4">
            <h6 className="footer-heading">Online Shopping Made Easy At ShopEase</h6>
            <p className="footer-muted mb-0">
              ShopEase is a modern online shopping platform built to help users
              discover electronics, clothing, footwear, books, accessories and
              everyday essentials in one place.
            </p>
          </div>

          <div className="col-lg-4">
            <h6 className="footer-heading">Why Shop Online With ShopEase?</h6>
            <p className="footer-muted mb-0">
              ShopEase brings together a clean shopping interface, role-based
              seller and admin management, secure checkout flow, and support
              tools for customers. Users can compare products, check size
              guides, ask product questions, track orders, and manage shopping
              preferences from their profile.
            </p>
          </div>

          <div className="col-lg-4">
            <h6 className="footer-heading">Smart Shopping Features</h6>
            <ul className="footer-muted footer-feature-list mb-0">
              <li>Product search, filters and comparison.</li>
              <li>Wishlist, cart, checkout and order tracking.</li>
              <li>Wallet, rewards, coupons and savings dashboard.</li>
              <li>Reviews, product questions and support workflows.</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-links mt-4 pt-4 border-top">
          <Link to="/help-center">Help Center</Link>
          <Link to="/faqs">FAQ</Link>
          <Link to="/contact-support">Contact Support</Link>
          <Link to="/terms-and-conditions">Terms of Use</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span>A ShopEase Commerce Platform</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;