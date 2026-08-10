import { Link } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

/* ==========================================================================
   Types
   ========================================================================== */

interface FooterLink {
  label: string;
  path: string;
}

interface RoleBasedFooterLinks {
  heading: string;
  links: FooterLink[];
}

/* ==========================================================================
   Footer Data
   ========================================================================== */

const popularSearches: string[] = [
  "Smartphones",
  "Laptops",
  "Running Shoes",
  "T-Shirts",
  "Headphones",
  "Backpacks",
  "Watches",
  "Books",
  "Bluetooth Speakers",
  "Formal Shoes",
  "Casual Shirts",
  "Jeans",
  "Fitness Bands",
  "Gaming Accessories",
  "Travel Bags",
  "Kitchen Essentials",
  "Office Chairs",
  "Wireless Earbuds",
  "Power Banks",
  "Sunglasses",
  "Ethnic Wear",
  "Sneakers",
  "Home Decor",
  "Stationery",
  "Smart Watches",
];

const guestOnlineShoppingLinks: FooterLink[] = [
  { label: "All Products", path: "/products" },
  { label: "Electronics", path: "/categories/Electronics" },
  { label: "Clothing", path: "/categories/Clothing" },
  { label: "Footwear", path: "/categories/Footwear" },
  { label: "Books", path: "/categories/Books" },
  { label: "Accessories", path: "/categories/Accessories" },
  { label: "Beauty", path: "/categories/Beauty" },
  { label: "Grocery", path: "/categories/Grocery" },
];

const guestUsefulLinks: FooterLink[] = [
  { label: "Explore Products", path: "/products" },
  { label: "Compare Products", path: "/compare" },
  { label: "Login", path: "/login" },
  { label: "Register", path: "/register" },
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
  { label: "Recommended", path: "/recommended" },
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
  { label: "Analytics", path: "/admin/analytics" },
];

const sellerLinks: FooterLink[] = [
  { label: "Seller Dashboard", path: "/seller/dashboard" },
  { label: "My Products", path: "/seller/products" },
  { label: "Seller Orders", path: "/seller/orders" },
  { label: "Product Questions", path: "/seller/questions" },
];

const supportLinks: FooterLink[] = [
  { label: "Support Dashboard", path: "/support/dashboard" },
  { label: "Support Orders", path: "/support/orders" },
  { label: "Support Tickets", path: "/support/tickets" },
  { label: "Help Center", path: "/help-center" },
  { label: "Customer Contact", path: "/contact-support" },
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
  { label: "Account Security", path: "/profile" },
];

const guestPolicyLinks: FooterLink[] = [
  { label: "Help Center", path: "/help-center" },
  { label: "FAQ", path: "/faqs" },
  { label: "Contact Support", path: "/contact-support" },
  { label: "Terms of Use", path: "/terms-and-conditions" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Login Help", path: "/help-center" },
  { label: "Create Account", path: "/register" },
];

/* ==========================================================================
   Helpers
   ========================================================================== */

const getRoleBasedPrimaryLinks = (role?: string): RoleBasedFooterLinks => {
  switch (role) {
    case "ADMIN":
      return {
        heading: "Admin Workspace",
        links: adminLinks,
      };

    case "SELLER":
      return {
        heading: "Seller Workspace",
        links: sellerLinks,
      };

    case "SUPPORT":
      return {
        heading: "Support Workspace",
        links: supportLinks,
      };

    case "CUSTOMER":
    default:
      return {
        heading: "My Account",
        links: customerLinks,
      };
  }
};

const renderFooterLinks = (links: FooterLink[]) => {
  return links.map((link) => (
    <Link to={link.path} key={`${link.label}-${link.path}`}>
      {link.label}
    </Link>
  ));
};

/* ==========================================================================
   Footer
   ========================================================================== */

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const { isAuthenticated, currentUser } = useAuth();

  const roleBasedLinks = getRoleBasedPrimaryLinks(currentUser?.role);

  const isAdmin = currentUser?.role === "ADMIN";
  const isCustomer = currentUser?.role === "CUSTOMER";

  const shouldShowCustomerShoppingLinks =
    !isAuthenticated || isCustomer || isAdmin;

  return (
    <footer className="footer shopease-footer border-top mt-auto">
      <div className="container py-5">
        {/* Main Footer Links */}
        <div className="row g-4">
          <div className="col-6 col-md-3 col-xl-2">
            <h2 className="footer-heading">Online Shopping</h2>

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
            <h2 className="footer-heading">
              {isAuthenticated ? roleBasedLinks.heading : "Useful Links"}
            </h2>

            <div className="footer-link-list">
              {isAuthenticated
                ? renderFooterLinks(roleBasedLinks.links)
                : renderFooterLinks(guestUsefulLinks)}
            </div>
          </div>

          <div className="col-6 col-md-3 col-xl-2">
            <h2 className="footer-heading">Customer Policies</h2>

            <div className="footer-link-list">
              {renderFooterLinks(
                isAuthenticated ? policyLinks : guestPolicyLinks,
              )}
            </div>
          </div>

          <div className="col-6 col-md-3 col-xl-2">
            <h2 className="footer-heading">Experience ShopEase</h2>

            <p className="footer-muted experience-shopease-text">
              Shop faster, track orders, manage your wishlist, payments, wallet,
              rewards, and personalized product recommendations.
            </p>

            <div className="footer-app-buttons">
              <button
                type="button"
                className="footer-store-btn"
                aria-label="Get ShopEase on Google Play"
              >
                <svg
                  className="play-icon"
                  aria-hidden="true"
                  viewBox="0 0 40 40"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" d="M0,0h40v40H0V0z" />
                  <g>
                    <path
                      d="M19.7,19.2L4.3,35.3c0,0,0,0,0,0c0.5,1.7,2.1,3,4,3c0.8,0,1.5-0.2,2.1-0.6l0,0l17.4-9.9L19.7,19.2z"
                      fill="#EA4335"
                    />
                    <path
                      d="M35.3,16.4L35.3,16.4l-7.5-4.3l-8.4,7.4l8.5,8.3l7.5-4.2c1.3-0.7,2.2-2.1,2.2-3.6C37.5,18.5,36.6,17.1,35.3,16.4z"
                      fill="#FBBC04"
                    />
                    <path
                      d="M4.3,4.7C4.2,5,4.2,5.4,4.2,5.8v28.5c0,0.4,0,0.7,0.1,1.1l16-15.7L4.3,4.7z"
                      fill="#4285F4"
                    />
                    <path
                      d="M19.8,20l8-7.9L10.5,2.3C9.9,1.9,9.1,1.7,8.3,1.7c-1.9,0-3.6,1.3-4,3c0,0,0,0,0,0L19.8,20z"
                      fill="#34A853"
                    />
                  </g>
                </svg>

                <span>
                  <small>GET IT ON</small>
                  Google Play
                </span>
              </button>

              <button
                type="button"
                className="footer-store-btn"
                aria-label="Download ShopEase on the App Store"
              >
                <i className="bi bi-apple" aria-hidden="true" />

                <span>
                  <small>Download on the</small>
                  App Store
                </span>
              </button>
            </div>
          </div>

          <div className="col-md-6 col-xl-4">
            <h2 className="footer-heading">Keep In Touch</h2>

            <div className="footer-social-links mb-4">
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit ShopEase on Facebook"
                title="Facebook"
              >
                <i className="bi bi-facebook" aria-hidden="true" />
              </a>

              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit ShopEase on X"
                title="X"
              >
                <i className="bi bi-twitter-x" aria-hidden="true" />
              </a>

              <a
                href="https://youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit ShopEase on YouTube"
                title="YouTube"
              >
                <i className="bi bi-youtube" aria-hidden="true" />
              </a>

              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit ShopEase on Instagram"
                title="Instagram"
              >
                <i className="bi bi-instagram" aria-hidden="true" />
              </a>
            </div>

            <div className="footer-trust-list">
              <div className="footer-trust-item">
                <i className="bi bi-patch-check" aria-hidden="true" />
                <div>
                  <strong>QUALITY-VERIFIED PRODUCTS</strong>
                  <span>
                    Products sourced from trusted marketplace sellers.
                  </span>
                </div>
              </div>

              <div className="footer-trust-item">
                <i className="bi bi-arrow-repeat" aria-hidden="true" />
                <div>
                  <strong>EASY RETURNS</strong>
                  <span>
                    Return eligibility depends on the product category and
                    applicable policy.
                  </span>
                </div>
              </div>

              <div className="footer-trust-item">
                <i className="bi bi-truck" aria-hidden="true" />
                <div>
                  <strong>DELIVERY TRACKING</strong>
                  <span>Follow eligible orders from dispatch to delivery.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Searches */}
        {shouldShowCustomerShoppingLinks ? (
          <section className="footer-popular-searches mt-5 pt-4 border-top">
            <h2 className="footer-heading">Popular Searches</h2>

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
          </section>
        ) : null}

        {/* Support and Copyright */}
        <div className="footer-support-row mt-4 pt-4 border-top">
          <p className="mb-0 footer-muted">
            In case of any concern,{" "}
            <Link to="/contact-support" className="footer-contact">
              Contact Us
            </Link>
            .
          </p>

          <p className="mb-0 footer-muted">
            © {currentYear} ShopEase. All rights reserved.
          </p>

          <p className="mb-0 footer-muted">A ShopEase Commerce Platform</p>
        </div>

        {/* Registered Office Address */}
        <section
          className="footer-registered-office mt-4 pt-4 border-top"
          aria-labelledby="footer-registered-office-title"
        >
          <div className="footer-registered-office-content">
            <h2 id="footer-registered-office-title" className="footer-heading">
              Registered Office Address
            </h2>

            <address className="footer-office-address mb-0">
              <span>ShopEase Commerce Private Limited</span>
              <span>Digital Commerce Park,</span>
              <span>Financial District,</span>
              <span>Nanakramguda, Serilingampally,</span>
              <span>Hyderabad, Telangana 500032,</span>
              <span>India</span>
            </address>
          </div>

          <dl className="footer-office-legal-details mb-0">
            <div className="footer-office-legal-row">
              <dt>CIN</dt>
              <dd>U47912TG2026PTC000001</dd>
            </div>

            <div className="footer-office-legal-row">
              <dt>Telephone</dt>
              <dd>
                <a href="tel:+914040011450">+91 40 4001 1450</a>
              </dd>
            </div>

            <div className="footer-office-legal-row">
              <dt>Email</dt>
              <dd>
                <a href="mailto:support@shopease.com">support@shopease.com</a>
              </dd>
            </div>

            <div className="footer-office-legal-row">
              <dt>Support</dt>
              <dd>
                <Link to="/contact-support">Contact ShopEase Support</Link>
              </dd>
            </div>
          </dl>
        </section>

        {/* Detailed ShopEase Platform Information */}
        <section
          className="footer-content-section mt-4 pt-4 border-top"
          aria-labelledby="footer-shopping-made-easy-title"
        >
          {/* Online Shopping Made Easy */}
          <div className="footer-content-block">
            <h2
              id="footer-shopping-made-easy-title"
              className="footer-content-title"
            >
              Online Shopping Made Easy At ShopEase
            </h2>

            <p>
              ShopEase brings products from multiple categories together in one
              convenient online marketplace. Customers can discover electronics,
              clothing, footwear, books, accessories, beauty products,
              groceries, home essentials, and everyday necessities without
              moving between different shopping platforms.
            </p>

            <p>
              Product search, category browsing, advanced filters, price
              sorting, ratings, availability, comparisons, and personalized
              recommendations help customers find suitable products efficiently.
              Detailed product pages provide descriptions, specifications,
              seller information, size options, delivery checks, available
              offers, customer reviews, and product questions.
            </p>
          </div>

          {/* Shopping Categories */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              A Complete Marketplace For Everyday Shopping
            </h3>

            <p>
              ShopEase supports a broad marketplace experience designed for
              different shopping requirements, budgets, and product preferences.
            </p>

            <ul className="footer-content-list">
              <li>
                <strong>Electronics and technology:</strong> Discover
                smartphones, laptops, audio devices, computer accessories, smart
                wearables, power banks, speakers, and other technology products
                from marketplace sellers.
              </li>

              <li>
                <strong>Clothing and fashion:</strong> Browse casual clothing,
                formal wear, seasonal collections, ethnic styles, everyday
                basics, and apparel for different age groups.
              </li>

              <li>
                <strong>Footwear:</strong> Explore running shoes, sports
                footwear, formal shoes, casual shoes, sandals, slippers, and
                other category-specific options.
              </li>

              <li>
                <strong>Accessories:</strong> Find watches, bags, backpacks,
                wallets, sunglasses, belts, fashion accessories, and useful
                travel products.
              </li>

              <li>
                <strong>Books and learning:</strong> Shop for textbooks,
                reference materials, fiction, educational books, stationery, and
                learning resources.
              </li>

              <li>
                <strong>Home and living:</strong> Discover home decoration,
                kitchen essentials, furniture, storage products, office
                equipment, furnishing items, and household requirements.
              </li>

              <li>
                <strong>Beauty and personal care:</strong> Browse skin care,
                hair care, grooming, personal-care essentials, and beauty
                products from supported sellers.
              </li>

              <li>
                <strong>Grocery and daily essentials:</strong> Find packaged
                food, household supplies, personal necessities, and frequently
                purchased everyday products.
              </li>
            </ul>
          </div>

          {/* Affordable Shopping */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              Affordable Shopping For Different Budgets
            </h3>

            <p>
              ShopEase allows customers to compare listed prices, product
              discounts, seller options, and eligible coupon benefits before
              placing an order. Price filters and sorting tools make it easier
              to browse products within a preferred spending range.
            </p>

            <p>
              Active coupon eligibility, minimum cart value, maximum discount
              limits, product-level discounts, wallet balances, and reward
              benefits are calculated using the applicable checkout rules. Final
              pricing and eligibility are confirmed before payment.
            </p>
          </div>

          {/* Rewards and Savings */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              ShopEase Rewards, Wallet, And Savings
            </h3>

            <p>
              Eligible registered customers can use ShopEase rewards, wallet
              balances, available coupons, and shopping benefits through their
              account. Reward points may be earned or redeemed according to the
              active reward rules, transaction limits, and expiry conditions.
            </p>

            <ul className="footer-content-list">
              <li>
                Earn reward points from eligible purchases and promotional
                activities.
              </li>

              <li>
                Redeem available points according to the minimum and maximum
                redemption rules.
              </li>

              <li>
                Review wallet transactions, promotional credits, expiry dates,
                and order adjustments.
              </li>

              <li>
                Track coupon history, discount usage, and applicable savings
                from the customer account.
              </li>

              <li>
                View consolidated savings from product discounts, coupons,
                rewards, and wallet usage.
              </li>
            </ul>
          </div>

          {/* Personalized Discovery */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              Personalized Product Discovery
            </h3>

            <p>
              ShopEase uses browsing activity, recently viewed products,
              categories, wishlist selections, and shopping interactions to
              present relevant product suggestions. The goal is to reduce
              unnecessary searching and help customers rediscover products that
              may match their current interests.
            </p>

            <p>
              Customers can review similar products, compare selected items,
              open Quick View, save products to a wishlist, and view
              recommendations without interrupting the main shopping workflow.
              Recommendation availability depends on the products and data
              currently available in the marketplace.
            </p>
          </div>

          {/* Product Information */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              Product Information For Better Decisions
            </h3>

            <p>
              ShopEase product pages are designed to present useful purchasing
              information in a structured format. Depending on available product
              data, customers can review:
            </p>

            <ul className="footer-content-list">
              <li>
                Product images, media previews, and available color variants.
              </li>

              <li>
                Product descriptions, specifications, material information, and
                care instructions.
              </li>

              <li>
                Available sizes, size charts, and measurement recommendations.
              </li>

              <li>
                Product ratings, published reviews, and customer questions.
              </li>

              <li>
                Seller name, seller details, tax information, and marketplace
                verification indicators.
              </li>

              <li>
                Product stock, available offers, pincode-based delivery checks,
                and applicable return rules.
              </li>
            </ul>
          </div>

          {/* Order Experience */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              Order Tracking, Delivery, And Support
            </h3>

            <p>
              Registered customers can follow orders through the available
              fulfillment and delivery stages. Delivery estimates, warehouse
              assignments, service zones, payment availability, and shipping
              charges may depend on the delivery location, seller, product
              category, and current inventory.
            </p>

            <p>
              Customers can raise support tickets for order, delivery, payment,
              coupon, wallet, reward, return, and refund concerns. Support
              activities, replies, escalation status, and resolution history are
              maintained through the ShopEase support workflow.
            </p>
          </div>

          {/* Returns and Refunds */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              Returns, Replacements, And Refunds
            </h3>

            <p>
              Return eligibility is determined by the applicable
              product-category policy. Return windows, replacement options,
              pickup availability, quality checks, refund methods, and
              settlement timelines can vary between products and orders.
            </p>

            <p>
              Eligible return requests may include pickup scheduling, proof
              collection, warehouse quality checks, item-condition assessment,
              seller review, refund processing, wallet adjustment, or
              replacement handling. Customers should review the applicable
              policy displayed for the product and order before submitting a
              request.
            </p>
          </div>

          {/* Seller Marketplace */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              ShopEase Marketplace For Sellers
            </h3>

            <p>
              ShopEase provides seller workflows for product management, order
              fulfillment, inventory coordination, customer questions, returns,
              disputes, restocking, settlement adjustments, and operational
              reporting.
            </p>

            <p>
              Product availability, seller information, warehouse mapping, tax
              details, fulfillment capacity, and return processing depend on the
              information maintained by the seller and the ShopEase marketplace
              operations team.
            </p>
          </div>

          {/* Secure Shopping */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              Secure And Transparent Shopping
            </h3>

            <p>
              ShopEase organizes product, pricing, payment, delivery, return,
              and support information to make each shopping step easier to
              understand. Customers can review cart totals, discounts, delivery
              charges, wallet usage, reward redemptions, payment status, and
              order details before completing a transaction.
            </p>

            <p>
              Account access and administrative features are controlled through
              role-based permissions. Customers, sellers, support users,
              administrators, pickup agents, delivery agents, warehouse users,
              and logistics users receive access only to the workflows relevant
              to their assigned role.
            </p>
          </div>

          {/* ShopEase Application */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              ShopEase Mobile Shopping Experience
            </h3>

            <p>
              The ShopEase responsive experience is designed to support product
              browsing, wishlist management, cart updates, checkout, order
              tracking, returns, rewards, wallet activity, and support workflows
              across desktop, tablet, and mobile screens.
            </p>

            <p>
              Agent-focused mobile workflows can also support assigned delivery
              and pickup tasks, geolocation coordinates, proof uploads, task
              status updates, and operational notifications where those features
              are enabled.
            </p>
          </div>

          {/* ShopEase Background */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              About The ShopEase Platform
            </h3>

            <p>
              ShopEase is a marketplace project developed to demonstrate a
              scalable Indian ecommerce experience with multiple users, sellers,
              warehouses, support operations, delivery agents, pickup agents,
              return processing, inventory workflows, and administrative
              controls.
            </p>

            <p>
              The platform continues to evolve through modular enhancements
              covering product discovery, checkout, delivery, customer support,
              returns, refunds, seller operations, audit records, compliance
              exports, automation rules, service monitoring, escalation
              management, and mobile agent experiences.
            </p>
          </div>

          {/* Shopping Convenience */}
          <div className="footer-content-block">
            <h3 className="footer-content-subtitle">
              Shop Online With Greater Convenience
            </h3>

            <p>
              ShopEase combines product discovery, detailed catalog information,
              responsive design, secure shopping workflows, and post-order
              support in one application. Customers can browse products, compare
              choices, select sizes, check delivery, apply eligible benefits,
              complete checkout, and manage orders from one account.
            </p>

            <p>
              Product availability, pricing, offers, delivery estimates, payment
              methods, tax values, return eligibility, and refund options may
              change based on seller information, inventory, location, category
              rules, promotional validity, and order status. Customers should
              review final information during checkout and on the relevant
              product or order page.
            </p>
          </div>
        </section>

        {/* Bottom Links */}
        <nav
          className="footer-bottom-links mt-4 pt-4 border-top"
          aria-label="Footer legal and support links"
        >
          <Link to="/help-center">Help Center</Link>
          <Link to="/faqs">FAQ</Link>
          <Link to="/contact-support">Contact Support</Link>
          <Link to="/terms-and-conditions">Terms of Use</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span>ShopEase Commerce Private Limited</span>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
