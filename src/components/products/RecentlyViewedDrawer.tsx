import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  clearRecentlyViewedProducts,
  getRecentlyViewedProducts,
  type RecentlyViewedProduct,
} from "../../utils/recentlyViewedStorage";
import {
  formatCurrency,
  getDiscountedPrice,
} from "../../utils/currencyFormatter";

const RecentlyViewedDrawer = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recentProducts, setRecentProducts] = useState<RecentlyViewedProduct[]>([]);

  const loadRecentProducts = (): void => {
    setRecentProducts(getRecentlyViewedProducts());
  };

  // Sync state data on mount and manage window-focus polling
  useEffect(() => {
    loadRecentProducts();

    const handleFocus = (): void => {
      loadRecentProducts();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Global keyboard handler to collapse the drawer on Escape press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpen = (): void => {
    loadRecentProducts();
    setIsOpen(true);
  };

  // Reset open state alongside clearing items to stop layout-snapping
  const handleClear = (): void => {
    clearRecentlyViewedProducts();
    setRecentProducts([]);
    setIsOpen(false);
  };

  // Outside click boundary dismissal handler
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  };

  // Floating button hidden completely if there is no session history data
  if (recentProducts.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="recent-drawer-floating-btn btn btn-dark shadow position-fixed bottom-0 end-0 m-4 z-3 d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-semibold"
        onClick={handleOpen}
      >
        <i className="bi bi-clock-history fs-5" />
        Recently Viewed
      </button>

      {isOpen && (
        <div 
          className="recent-drawer-overlay fixed-top w-100 h-100 d-flex justify-content-end"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)", zIndex: 1060 }}
          onClick={handleBackdropClick}
        >
          {/* Main Sidebar Component Sheet */}
          <aside 
            className="recent-drawer bg-white shadow-lg h-100 d-flex flex-column" 
            style={{ width: "100%", maxWidth: "400px" }}
            role="dialog"
            aria-modal="true"
          >
            {/* Locked Non-scrolling Header Tray */}
            <div className="recent-drawer-header border-bottom p-3 d-flex justify-content-between align-items-center flex-shrink-0">
              <div>
                <h5 className="fw-bold mb-1 text-dark">Recently Viewed</h5>
                <p className="small text-muted mb-0">
                  Products viewed during this session.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: "36px", height: "36px" }}
                onClick={() => setIsOpen(false)}
                aria-label="Close recently viewed drawer"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Independent Scrollable Body for Long Item Collections */}
            <div className="recent-drawer-body p-3 flex-grow-1 overflow-auto">
              <div className="d-flex justify-content-end mb-3">
                <button
                  type="button"
                  className="btn btn-link text-danger text-decoration-none p-0 small fw-semibold"
                  onClick={handleClear}
                >
                  <i className="bi bi-trash3 me-1" />
                  Clear History
                </button>
              </div>

              <div className="row g-3">
                {recentProducts.map((product) => (
                  <div className="col-12" key={product.id}>
                    {/* Sleek micro-card wrapper optimized for sidebar layout boundaries */}
                    <div className="d-flex gap-3 p-2 border rounded-3 align-items-center bg-white position-relative shadow-sm">
                      
                      {/* Compact Image Frame */}
                      {product.image && (
                        <div 
                          className="flex-shrink-0 bg-light rounded-2 p-2 border d-flex align-items-center justify-content-center" 
                          style={{ width: "80px", height: "80px" }}
                        >
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="img-fluid object-fit-contain h-100 w-100"
                          />
                        </div>
                      )}
                      
                      {/* Flex Text Content Layout with Truncation Defenses */}
                      <div className="flex-grow-1 min-w-0 pe-2">
                        <div className="d-flex gap-1 mb-1 flex-wrap">
                          {product.discount > 0 && (
                            <span className="badge bg-danger-subtle text-danger fw-bold" style={{ fontSize: "0.65rem" }}>
                              {product.discount}% OFF
                            </span>
                          )}
                          <span 
                            className={`badge ${product.stock <= 0 ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"}`} 
                            style={{ fontSize: "0.65rem" }}
                          >
                            {product.stock <= 0 ? "OOS" : "In Stock"}
                          </span>
                        </div>
                        
                        <h6 className="fw-bold text-dark text-truncate mb-0" style={{ fontSize: "0.875rem" }}>
                          {product.name}
                        </h6>
                        
                        <p className="text-muted small mb-1 text-truncate" style={{ fontSize: "0.75rem" }}>
                          {product.brand} {product.sellerName ? `• Sold by ${product.sellerName}` : ""}
                        </p>

                        <div className="fw-bold text-primary" style={{ fontSize: "0.9rem" }}>
                          {formatCurrency(getDiscountedPrice(product.price, product.discount))}
                        </div>
                      </div>

                      {/* Stretched Action Link Link Masking Layer */}
                      <Link 
                        to={`/products/${product.id}`} 
                        className="stretched-link" 
                        onClick={() => setIsOpen(false)}
                        aria-label={`View full details for ${product.name}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default RecentlyViewedDrawer;