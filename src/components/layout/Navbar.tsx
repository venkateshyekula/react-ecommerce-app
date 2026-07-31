import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import HeaderSearchBar from "./HeaderSearchBar";
import NotificationCenter from "./NotificationCenter";

import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";
import { useWishlist } from "../../context/useWishlist";

import ShopEaseLogo from "../../assets/shopease.svg";

interface CategoryLink {
  label: string;
  path: string;
}

interface CategoryColumn {
  title: string;
  links: CategoryLink[];
}

interface CategoryMenu {
  label: string;
  path: string;
  accentClass: string;
  badge?: string;
  columns: CategoryColumn[];
}

const categoryMenus: CategoryMenu[] = [
  {
    label: "Men",
    path: "/products?gender=men",
    accentClass: "mega-accent-men",
    columns: [
      {
        title: "Topwear & Bottomwear",
        links: [
          { label: "T-Shirts", path: "/products?category=T-Shirts&gender=men" },
          {
            label: "Casual Shirts",
            path: "/products?category=Casual Shirts&gender=men",
          },
          {
            label: "Formal Shirts",
            path: "/products?category=Formal Shirts&gender=men",
          },
          { label: "Jeans", path: "/products?category=Jeans&gender=men" },
          {
            label: "Casual Trousers",
            path: "/products?category=Casual Trousers&gender=men",
          },
          {
            label: "Shorts & Track Pants",
            path: "/products?category=Shorts&gender=men",
          },
        ],
      },
      {
        title: "Footwear",
        links: [
          {
            label: "Casual Shoes",
            path: "/products?category=Casual Shoes&gender=men",
          },
          {
            label: "Sports Shoes",
            path: "/products?category=Sports Shoes&gender=men",
          },
          { label: "Sneakers", path: "/products?category=Sneakers&gender=men" },
          {
            label: "Formal Shoes",
            path: "/products?category=Formal Shoes&gender=men",
          },
          { label: "Sandals", path: "/products?category=Sandals&gender=men" },
        ],
      },
      {
        title: "Men's Accessories",
        links: [
          { label: "Watches", path: "/products?category=Watches&gender=men" },
          {
            label: "Sunglasses",
            path: "/products?category=Sunglasses&gender=men",
          },
          {
            label: "Belts & Wallets",
            path: "/products?category=Belts&gender=men",
          },
          {
            label: "Bags & Backpacks",
            path: "/products?category=Bags&gender=men",
          },
          { label: "Caps & Hats", path: "/products?category=Caps&gender=men" },
        ],
      },
      {
        title: "Men's Offers",
        links: [
          {
            label: "All Men's Offers",
            path: "/products?gender=men&discount=true",
          },
          {
            label: "Topwear Deals",
            path: "/products?category=T-Shirts&gender=men&discount=true",
          },
          {
            label: "Footwear Flash Sale",
            path: "/products?category=Casual+Shoes&gender=men&discount=true",
          },
          { label: "Under ₹499", path: "/products?gender=men&priceMax=499" },
        ],
      },
    ],
  },
  {
    label: "Women",
    path: "/products?gender=women",
    accentClass: "mega-accent-women",
    columns: [
      {
        title: "Ethnic & Western Wear",
        links: [
          {
            label: "Kurtas & Suits",
            path: "/products?category=Kurtas and Suits&gender=women",
          },
          {
            label: "Sarees & Lehengas",
            path: "/products?category=Sarees&gender=women",
          },
          {
            label: "Dresses & Jumpsuits",
            path: "/products?category=Dresses&gender=women",
          },
          {
            label: "Tops & Shirts",
            path: "/products?category=Tops&gender=women",
          },
          {
            label: "Jeans & Skirts",
            path: "/products?category=Jeans&gender=women",
          },
        ],
      },
      {
        title: "Footwear",
        links: [
          {
            label: "Flats & Sandals",
            path: "/products?category=Flats&gender=women",
          },
          { label: "Heels", path: "/products?category=Heels&gender=women" },
          {
            label: "Sneakers",
            path: "/products?category=Sneakers&gender=women",
          },
          { label: "Boots", path: "/products?category=Boots&gender=women" },
        ],
      },
      {
        title: "Women's Accessories",
        links: [
          {
            label: "Handbags & Clutches",
            path: "/products?category=Handbags&gender=women",
          },
          {
            label: "Jewellery",
            path: "/products?category=Jewellery&gender=women",
          },
          { label: "Watches", path: "/products?category=Watches&gender=women" },
          {
            label: "Sunglasses",
            path: "/products?category=Sunglasses&gender=women",
          },
          {
            label: "Hair Accessories",
            path: "/products?category=Hair Accessories&gender=women",
          },
        ],
      },
      {
        title: "Women's Offers",
        links: [
          {
            label: "All Women's Offers",
            path: "/products?gender=women&discount=true",
          },
          {
            label: "Ethnic Wear Deals",
            path: "/products?category=Sarees&gender=women&discount=true",
          },
          {
            label: "Footwear & Bags Sale",
            path: "/products?category=Handbags&gender=women&discount=true",
          },
          { label: "Under ₹799", path: "/products?gender=women&priceMax=799" },
        ],
      },
    ],
  },
  {
    label: "Kids",
    path: "/products?gender=kids",
    accentClass: "mega-accent-kids",
    columns: [
      {
        title: "Boys Clothing",
        links: [
          {
            label: "T-Shirts",
            path: "/products?category=T-Shirts&gender=kids",
          },
          { label: "Shirts", path: "/products?category=Shirts&gender=kids" },
          { label: "Jeans", path: "/products?category=Jeans&gender=kids" },
          { label: "Shorts", path: "/products?category=Shorts&gender=kids" },
        ],
      },
      {
        title: "Girls Clothing",
        links: [
          { label: "Dresses", path: "/products?category=Dresses&gender=kids" },
          { label: "Tops", path: "/products?category=Tops&gender=kids" },
          { label: "Skirts", path: "/products?category=Skirts&gender=kids" },
          {
            label: "Leggings",
            path: "/products?category=Leggings&gender=kids",
          },
        ],
      },
      {
        title: "Baby Care & Footwear",
        links: [
          { label: "Baby Clothing", path: "/products?category=Baby Clothing" },
          {
            label: "Diapers & Baby Toys",
            path: "/products?category=Baby Toys",
          },
          {
            label: "Casual & School Shoes",
            path: "/products?category=School Shoes&gender=kids",
          },
        ],
      },
      {
        title: "Kids Offers",
        links: [
          {
            label: "All Kids Deals",
            path: "/products?gender=kids&discount=true",
          },
          {
            label: "Baby Care Offers",
            path: "/products?category=Baby+Clothing&discount=true",
          },
          { label: "Under ₹399", path: "/products?gender=kids&priceMax=399" },
        ],
      },
    ],
  },
  {
    label: "Home",
    path: "/products?category=Home",
    accentClass: "mega-accent-home",
    columns: [
      {
        title: "Home Decor & Living",
        links: [
          { label: "Bedsheets & Covers", path: "/products?category=Bedsheets" },
          {
            label: "Blankets & Comforters",
            path: "/products?category=Blankets",
          },
          {
            label: "Wall Decor & Clocks",
            path: "/products?category=Wall Decor",
          },
          { label: "Lamps & Lighting", path: "/products?category=Lamps" },
          { label: "Cookware & Dining", path: "/products?category=Cookware" },
          { label: "Towels & Bath", path: "/products?category=Towels" },
        ],
      },
      {
        title: "Electronics & Gadgets",
        links: [
          {
            label: "Smartphones & Mobiles",
            path: "/products?category=Smartphones",
          },
          { label: "Laptops & Computers", path: "/products?category=Laptops" },
          {
            label: "Headphones & Audio",
            path: "/products?category=Headphones",
          },
          {
            label: "Smart TVs & Speakers",
            path: "/products?category=Smart TVs",
          },
          {
            label: "Mobile Accessories",
            path: "/products?category=Mobile Covers",
          },
          {
            label: "Home Appliances",
            path: "/products?category=Refrigerators",
          },
        ],
      },
      {
        title: "Grocery & Household",
        links: [
          { label: "Rice & Atta", path: "/products?category=Rice" },
          { label: "Dals & Pulses", path: "/products?category=Dals" },
          { label: "Oils & Ghee", path: "/products?category=Oil and Ghee" },
          {
            label: "Snacks, Tea & Coffee",
            path: "/products?category=Biscuits",
          },
          {
            label: "Cleaning & Detergents",
            path: "/products?category=Detergents",
          },
        ],
      },
      {
        title: "Home & Electronics Offers",
        links: [
          {
            label: "Home & Appliance Deals",
            path: "/products?category=Home&discount=true",
          },
          {
            label: "Electronics Discounts",
            path: "/products?category=Smartphones&discount=true",
          },
          {
            label: "Grocery Bundles",
            path: "/products?category=Rice&discount=true",
          },
        ],
      },
    ],
  },
  {
    label: "Beauty",
    path: "/products?category=Beauty",
    accentClass: "mega-accent-beauty",
    columns: [
      {
        title: "Makeup",
        links: [
          { label: "Lipstick", path: "/products?category=Lipstick" },
          { label: "Foundation", path: "/products?category=Foundation" },
          { label: "Mascara & Eyeliner", path: "/products?category=Mascara" },
          { label: "Compact Powder", path: "/products?category=Compact" },
        ],
      },
      {
        title: "Skincare",
        links: [
          { label: "Face Wash", path: "/products?category=Face Wash" },
          { label: "Moisturizers", path: "/products?category=Moisturizers" },
          { label: "Sunscreen", path: "/products?category=Sunscreen" },
          { label: "Serums & Masks", path: "/products?category=Serums" },
        ],
      },
      {
        title: "Haircare & Fragrance",
        links: [
          {
            label: "Shampoo & Conditioner",
            path: "/products?category=Shampoo",
          },
          { label: "Hair Oil & Serum", path: "/products?category=Hair Oil" },
          { label: "Perfume & Body Mist", path: "/products?category=Perfume" },
          { label: "Deodorants", path: "/products?category=Deodorants" },
        ],
      },
      {
        title: "Beauty Offers",
        links: [
          {
            label: "Skincare Combos",
            path: "/products?category=Beauty&discount=true",
          },
          {
            label: "Fragrance Sale",
            path: "/products?category=Perfume&discount=true",
          },
          {
            label: "Buy 1 Get 1 Deals",
            path: "/products?category=Beauty&offer=bogo",
          },
        ],
      },
    ],
  },
  {
    label: "GenZ",
    path: "/products?collection=genz",
    accentClass: "mega-accent-genz",
    badge: "New",
    columns: [
      {
        title: "Trending Fits",
        links: [
          { label: "Crop Tops", path: "/products?category=Crop Tops" },
          { label: "Graphic Tees", path: "/products?category=Graphic Tees" },
          { label: "Corset Tops", path: "/products?category=Corset Tops" },
          { label: "Co-ord Sets", path: "/products?category=Co-ord Sets" },
        ],
      },
      {
        title: "Streetwear",
        links: [
          { label: "Cargo Pants", path: "/products?category=Cargo Pants" },
          {
            label: "Oversized Hoodies",
            path: "/products?category=Oversized Hoodies",
          },
          {
            label: "Parachute Pants",
            path: "/products?category=Parachute Pants",
          },
          {
            label: "Varsity Jackets",
            path: "/products?category=Varsity Jackets",
          },
        ],
      },
      {
        title: "GenZ Accessories",
        links: [
          {
            label: "Chunky Sneakers",
            path: "/products?category=Chunky Sneakers",
          },
          { label: "Tote Bags", path: "/products?category=Tote Bags" },
          { label: "Bucket Hats", path: "/products?category=Bucket Hats" },
          { label: "Phone Charms", path: "/products?category=Phone Charms" },
        ],
      },
      {
        title: "GenZ Offers",
        links: [
          {
            label: "College Edit Discounts",
            path: "/products?collection=college-edit&discount=true",
          },
          {
            label: "Trending Fits Sale",
            path: "/products?collection=genz&discount=true",
          },
          {
            label: "Clearance Drops",
            path: "/products?collection=genz&deal=clearance",
          },
        ],
      },
    ],
  },
];

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
  const isPickupAgent = userRole === "PICKUP_AGENT";
  const isDeliveryAgent = userRole === "DELIVERY_AGENT";
  const isLogisticsAgent = userRole === "LOGISTICS_AGENT";
  const isWarehouseAgent = userRole === "WAREHOUSE_AGENT";

  const canUseShoppingFeatures = !isAuthenticated || isCustomer || isAdmin;
  const canSeeWishlist = !isAuthenticated || isCustomer || isAdmin;
  const canSeeCustomerOrders = isCustomer || isAdmin;
  const canSeeAddressBook = isCustomer || isAdmin;

  const hasOperationalRole =
    isAdmin ||
    isSeller ||
    isSupport ||
    isPickupAgent ||
    isDeliveryAgent ||
    isLogisticsAgent ||
    isWarehouseAgent;

  const currentFullPath = location.pathname + location.search;

  return (
    <nav className="navbar navbar-expand-lg navbar-light sticky-top shopease-navbar py-2">
      <div className="container-fluid">
        <Link
          className="navbar-brand shopease-brand d-flex align-items-center"
          to="/home"
          onClick={closeMenu}
          aria-label="Go to ShopEase home"
        >
          <img src={ShopEaseLogo} alt="ShopEase Logo" height="36" />
        </Link>

        <button
          className="navbar-toggler shopease-toggler border-0"
          type="button"
          aria-controls="mainNavbar"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsMenuOpen((previousValue) => !previousValue)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className={`collapse navbar-collapse shopease-navbar-collapse ${
            isMenuOpen ? "show" : ""
          }`}
          id="mainNavbar"
        >
          <ul className="navbar-nav shopease-category-nav align-items-lg-center">
            {categoryMenus.map((menu) => {
              const isActive = currentFullPath === menu.path;

              return (
                <li
                  className={`nav-item shopease-mega-item ${menu.accentClass}`}
                  key={menu.label}
                >
                  <Link
                    className={`nav-link shopease-category-link ${
                      isActive ? "active" : ""
                    }`}
                    to={menu.path}
                    onClick={closeMenu}
                  >
                    <span>{menu.label}</span>
                    {menu.badge ? (
                      <span className="shopease-menu-badge">{menu.badge}</span>
                    ) : null}
                  </Link>

                  <div className={`shopease-mega-menu ${menu.accentClass}`}>
                    <div className="shopease-mega-content">
                      {menu.columns.map((column) => (
                        <div className="shopease-mega-column" key={column.title}>
                          <h6>{column.title}</h6>

                          {column.links.map((link) => (
                            <Link
                              key={link.path}
                              to={link.path}
                              onClick={closeMenu}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="shopease-search-wrapper">
            <HeaderSearchBar />
          </div>
          {isAuthenticated ? <NotificationCenter /> : null}

          <ul className="navbar-nav shopease-action-nav align-items-lg-center">
            {/* PROFILE DROPDOWN (AUTHENTICATED & GUEST) */}
            <li className="nav-item dropdown shopease-profile-dropdown">
              <button
                className="nav-link dropdown-toggle shopease-action-link shopease-profile-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label="Profile"
              >
                <i className="bi bi-person" />
                <span>Profile</span>
              </button>

              <ul className="dropdown-menu dropdown-menu-end shopease-user-menu">
                {isAuthenticated ? (
                  <>
                    <li className="shopease-user-header">
                      <div className="shopease-user-avatar">
                        <i className="bi bi-person-fill" />
                      </div>

                      <div className="min-w-0">
                        <p className="shopease-user-name">
                          {currentUser?.name}
                        </p>
                        <p className="shopease-user-email">
                          {currentUser?.email}
                        </p>

                        {userRole ? (
                          <span className="shopease-role-badge">
                            <i className="bi bi-shield-check me-1" />
                            {userRole}
                          </span>
                        ) : null}
                      </div>
                    </li>

                    {isAdmin ? (
                      <li>
                        <Link
                          className="dropdown-item shopease-dropdown-item"
                          to="/admin/dashboard"
                          data-bs-dismiss="dropdown"
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
                          className="dropdown-item shopease-dropdown-item"
                          to="/seller/dashboard"
                          data-bs-dismiss="dropdown"
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
                          className="dropdown-item shopease-dropdown-item"
                          to="/support/dashboard"
                          data-bs-dismiss="dropdown"
                          onClick={closeMenu}
                        >
                          <i className="bi bi-headset me-2 text-primary" />
                          Support Dashboard
                        </Link>
                      </li>
                    ) : null}

                    {isPickupAgent ? (
                      <>
                        <li>
                          <Link
                            className="dropdown-item shopease-dropdown-item"
                            to="/pickup-agent/dashboard"
                            data-bs-dismiss="dropdown"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-truck me-2 text-primary" />
                            Pickup Agent Dashboard
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item shopease-dropdown-item"
                            to="/pickup-agent/returns"
                            data-bs-dismiss="dropdown"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-box-arrow-in-left me-2 text-primary" />
                            My Return Pickups
                          </Link>
                        </li>
                      </>
                    ) : null}

                    {isDeliveryAgent || isLogisticsAgent ? (
                      <li>
                        <Link
                          className="dropdown-item shopease-dropdown-item"
                          to="/agent/dashboard"
                          data-bs-dismiss="dropdown"
                          onClick={closeMenu}
                        >
                          <i className="bi bi-geo-alt me-2 text-primary" />
                          Agent Dashboard
                        </Link>
                      </li>
                    ) : null}

                    {isWarehouseAgent ? (
                      <li>
                        <Link
                          className="dropdown-item shopease-dropdown-item"
                          to="/warehouse/qc-dashboard"
                          data-bs-dismiss="dropdown"
                          onClick={closeMenu}
                        >
                          <i className="bi bi-box-seam me-2 text-primary" />
                          Warehouse QC Dashboard
                        </Link>
                      </li>
                    ) : null}

                    {hasOperationalRole ? (
                      <li>
                        <hr className="dropdown-divider my-2" />
                      </li>
                    ) : null}

                    <li>
                      <Link
                        className="dropdown-item shopease-dropdown-item"
                        to="/profile"
                        data-bs-dismiss="dropdown"
                        onClick={closeMenu}
                      >
                        <i className="bi bi-person me-2 text-muted" />
                        My Profile
                      </Link>
                    </li>

                    {canSeeAddressBook ? (
                      <li>
                        <Link
                          className="dropdown-item shopease-dropdown-item"
                          to="/addresses"
                          data-bs-dismiss="dropdown"
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
                            className="dropdown-item shopease-dropdown-item"
                            to="/orders"
                            data-bs-dismiss="dropdown"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-receipt me-2 text-muted" />
                            My Orders
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item shopease-dropdown-item"
                            to="/support-tickets"
                            data-bs-dismiss="dropdown"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-ticket-detailed me-2 text-muted" />
                            My Tickets
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item shopease-dropdown-item"
                            to="/returns"
                            data-bs-dismiss="dropdown"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-arrow-return-left me-2 text-muted" />
                            My Returns
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item shopease-dropdown-item"
                            to="/wallet"
                            data-bs-dismiss="dropdown"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-wallet2 me-2 text-muted" />
                            My Wallet
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item shopease-dropdown-item"
                            to="/rewards"
                            data-bs-dismiss="dropdown"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-stars me-2 text-muted" />
                            Rewards
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item shopease-dropdown-item"
                            to="/savings"
                            data-bs-dismiss="dropdown"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-piggy-bank me-2 text-muted" />
                            Savings
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item shopease-dropdown-item"
                            to="/coupon-history"
                            data-bs-dismiss="dropdown"
                            onClick={closeMenu}
                          >
                            <i className="bi bi-ticket-perforated me-2 text-muted" />
                            Coupons
                          </Link>
                        </li>

                        <li>
                          <Link
                            className="dropdown-item shopease-dropdown-item"
                            to="/recommended"
                            data-bs-dismiss="dropdown"
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
                        className="dropdown-item shopease-dropdown-item shopease-logout-item"
                        type="button"
                        data-bs-dismiss="dropdown"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2" />
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    {/* GUEST / UNAUTHENTICATED PROFILE MENU */}
                    <li className="p-3 bg-light rounded-3 mb-2">
                      <p className="fw-bold mb-1 text-dark">Welcome</p>
                      <p className="small text-muted mb-3">
                        To access account and manage orders
                      </p>
                      <Link
                        to="/login"
                        className="btn btn-outline-danger btn-sm w-100 fw-bold rounded-1"
                        data-bs-dismiss="dropdown"
                        onClick={closeMenu}
                      >
                        LOGIN / SIGNUP
                      </Link>
                    </li>

                    <li>
                      <hr className="dropdown-divider my-2" />
                    </li>

                    <li>
                      <Link
                        className="dropdown-item shopease-dropdown-item rounded-2 py-2"
                        to="/orders"
                        data-bs-dismiss="dropdown"
                        onClick={closeMenu}
                      >
                        <i className="bi bi-receipt me-2 text-muted" />
                        Orders
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item shopease-dropdown-item rounded-2 py-2"
                        to="/wishlist"
                        data-bs-dismiss="dropdown"
                        onClick={closeMenu}
                      >
                        <i className="bi bi-heart me-2 text-muted" />
                        Wishlist
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item shopease-dropdown-item rounded-2 py-2"
                        to="/giftcard"
                        data-bs-dismiss="dropdown"
                        onClick={closeMenu}
                      >
                        <i className="bi bi-gift me-2 text-muted" />
                        Gift Cards
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item shopease-dropdown-item rounded-2 py-2"
                        to="/contactus"
                        data-bs-dismiss="dropdown"
                        onClick={closeMenu}
                      >
                        <i className="bi bi-headset me-2 text-muted" />
                        Contact Us
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </li>

            {canSeeWishlist ? (
              <li className="nav-item">
                <NavLink
                  className="nav-link shopease-action-link position-relative"
                  to="/wishlist"
                  onClick={closeMenu}
                  aria-label="Wishlist"
                >
                  <i className="bi bi-heart" />
                  <span>Wishlist</span>

                  {wishlistCount > 0 ? (
                    <span className="shopease-count-badge">
                      {wishlistCount}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ) : null}

            {canUseShoppingFeatures ? (
              <li className="nav-item">
                <NavLink
                  className="nav-link shopease-action-link position-relative"
                  to="/cart"
                  onClick={closeMenu}
                  aria-label="Shopping bag"
                >
                  <i className="bi bi-bag" />
                  <span>Bag</span>

                  {cartCount > 0 ? (
                    <span className="shopease-count-badge">{cartCount}</span>
                  ) : null}
                </NavLink>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;