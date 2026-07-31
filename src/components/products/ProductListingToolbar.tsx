import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent
} from "react";

import type {
  ProductFilters,
  ProductSortOption,
  ProductViewMode
} from "../../types/product";

/* ==========================================================================
   Types
   ========================================================================== */

interface ProductListingToolbarProps {
  title: string;
  totalCount: number;
  filteredCount: number;
  sortBy: ProductFilters["sortBy"];
  viewMode: ProductViewMode;
  onSortChange: (sortBy: ProductFilters["sortBy"]) => void;
  onViewModeChange: (viewMode: ProductViewMode) => void;
  onOpenMobileFilters: () => void;
}

interface SortOption {
  value: ProductSortOption;
  label: string;
  description: string;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const sortOptions: SortOption[] = [
  {
    value: "RELEVANCE",
    label: "Recommended",
    description: "Show the most relevant products first."
  },
  {
    value: "PRICE_LOW_TO_HIGH",
    label: "Price: Low to High",
    description: "Show lower-priced products first."
  },
  {
    value: "PRICE_HIGH_TO_LOW",
    label: "Price: High to Low",
    description: "Show higher-priced products first."
  },
  {
    value: "RATING_HIGH_TO_LOW",
    label: "Customer Rating",
    description: "Show higher-rated products first."
  },
  {
    value: "DISCOUNT_HIGH_TO_LOW",
    label: "Better Discount",
    description: "Show products with higher discounts first."
  },
  {
    value: "STOCK_HIGH_TO_LOW",
    label: "Availability",
    description: "Show products with higher stock availability first."
  }
];

/* ==========================================================================
   Helpers
   ========================================================================== */

const getSortLabel = (sortValue: ProductFilters["sortBy"]): string => {
  return (
    sortOptions.find((option) => option.value === sortValue)?.label ??
    "Recommended"
  );
};

const formatProductCount = (count: number): string => {
  return new Intl.NumberFormat("en-IN").format(Math.max(0, count));
};

/* ==========================================================================
   Product Listing Toolbar Component
   ========================================================================== */

const ProductListingToolbar = ({
  title,
  totalCount,
  filteredCount,
  sortBy,
  viewMode,
  onSortChange,
  onViewModeChange,
  onOpenMobileFilters
}: ProductListingToolbarProps) => {
  const sortDropdownRef = useRef<HTMLDivElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const sortToggleRef = useRef<HTMLButtonElement | null>(null);

  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);

  const normalizedTotalCount = Math.max(0, totalCount);

  const normalizedFilteredCount = Math.max(
    0,
    Math.min(filteredCount, normalizedTotalCount)
  );

  const activeSortLabel = getSortLabel(sortBy);

  /* ==========================================================================
     Close Dropdown on Outside Click and Escape
     ========================================================================== */

  useEffect(() => {
    if (!isSortMenuOpen) {
      return;
    }

    const handleDocumentMouseDown = (event: globalThis.MouseEvent): void => {
      const clickedNode = event.target as Node;

      if (!sortDropdownRef.current?.contains(clickedNode)) {
        setIsSortMenuOpen(false);
      }
    };

    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setIsSortMenuOpen(false);

      window.requestAnimationFrame(() => {
        sortToggleRef.current?.focus();
      });
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isSortMenuOpen]);

  /* ==========================================================================
     Dropdown Helpers
     ========================================================================== */

  const focusSortOptionAtIndex = (index: number): void => {
    const sortButtons =
      sortMenuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"]'
      );

    sortButtons?.[index]?.focus();
  };

  const openSortMenu = (focusOption: boolean): void => {
    setIsSortMenuOpen(true);

    if (!focusOption) {
      return;
    }

    const activeIndex = Math.max(
      0,
      sortOptions.findIndex((option) => option.value === sortBy)
    );

    window.requestAnimationFrame(() => {
      focusSortOptionAtIndex(activeIndex);
    });
  };

  const closeSortMenu = (restoreFocus = false): void => {
    setIsSortMenuOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        sortToggleRef.current?.focus();
      });
    }
  };

  /* ==========================================================================
     Sort Handlers
     ========================================================================== */

  const handleSortToggleClick = (): void => {
    if (isSortMenuOpen) {
      closeSortMenu();
      return;
    }

    openSortMenu(false);
  };

  const handleSortToggleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>
  ): void => {
    switch (event.key) {
      case "ArrowDown":
      case "Enter":
      case " ":
        event.preventDefault();
        openSortMenu(true);
        break;

      case "ArrowUp":
        event.preventDefault();
        setIsSortMenuOpen(true);

        window.requestAnimationFrame(() => {
          focusSortOptionAtIndex(sortOptions.length - 1);
        });
        break;

      default:
        break;
    }
  };

  const handleSortSelection = (
    sortValue: ProductFilters["sortBy"]
  ): void => {
    onSortChange(sortValue);
    closeSortMenu(true);
  };

  const handleSortOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ): void => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        nextIndex =
          currentIndex === sortOptions.length - 1 ? 0 : currentIndex + 1;
        break;

      case "ArrowUp":
        event.preventDefault();
        nextIndex =
          currentIndex === 0 ? sortOptions.length - 1 : currentIndex - 1;
        break;

      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;

      case "End":
        event.preventDefault();
        nextIndex = sortOptions.length - 1;
        break;

      case "Tab":
        closeSortMenu();
        return;

      default:
        // Native button click handles Enter / Space automatically
        return;
    }

    focusSortOptionAtIndex(nextIndex);
  };

  const handleSortMenuClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  /* ==========================================================================
     View Mode Handlers
     ========================================================================== */

  const handleViewModeChange = (nextViewMode: ProductViewMode): void => {
    if (nextViewMode === viewMode) {
      return;
    }

    onViewModeChange(nextViewMode);
  };

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <section
      className="product-listing-toolbar"
      aria-labelledby="product-listing-toolbar-title"
    >
      {/* Title and Count */}
      <div className="product-listing-toolbar-heading">
        <div>
          <h1
            id="product-listing-toolbar-title"
            className="product-listing-toolbar-title"
          >
            {title}
          </h1>

          <p className="product-listing-toolbar-count" aria-live="polite">
            Showing{" "}
            <strong>{formatProductCount(normalizedFilteredCount)}</strong> of{" "}
            <strong>{formatProductCount(normalizedTotalCount)}</strong>{" "}
            {normalizedTotalCount === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="product-listing-toolbar-controls">
        {/* Mobile Filters Button */}
        <button
          type="button"
          className="btn btn-outline-primary product-listing-mobile-filter-button"
          onClick={onOpenMobileFilters}
          aria-label="Open product filters"
        >
          <i className="bi bi-funnel" aria-hidden="true" />
          <span>Filters</span>
        </button>

        {/* Sort Dropdown */}
        <div
          ref={sortDropdownRef}
          className={`dropdown product-listing-sort-dropdown ${
            isSortMenuOpen ? "show" : ""
          }`.trim()}
        >
          <button
            ref={sortToggleRef}
            type="button"
            id="product-listing-sort-toggle"
            className="btn btn-outline-secondary dropdown-toggle product-listing-sort-toggle"
            aria-haspopup="menu"
            aria-expanded={isSortMenuOpen}
            aria-controls="product-listing-sort-menu"
            onClick={handleSortToggleClick}
            onKeyDown={handleSortToggleKeyDown}
          >
            <span className="product-listing-sort-prefix">Sort by:</span>
            <strong>{activeSortLabel}</strong>
          </button>

          <div
            ref={sortMenuRef}
            id="product-listing-sort-menu"
            className={`dropdown-menu dropdown-menu-end product-listing-sort-menu ${
              isSortMenuOpen ? "show" : ""
            }`.trim()}
            role="menu"
            aria-labelledby="product-listing-sort-toggle"
            onClick={handleSortMenuClick}
          >
            <div className="product-listing-sort-menu-header">
              <strong>Sort Products</strong>
              <span>Choose the display order</span>
            </div>

            {sortOptions.map((option, index) => {
              const isSelected = option.value === sortBy;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  className={`dropdown-item product-listing-sort-option ${
                    isSelected ? "active" : ""
                  }`.trim()}
                  aria-checked={isSelected}
                  tabIndex={isSortMenuOpen && isSelected ? 0 : -1}
                  onClick={() => handleSortSelection(option.value)}
                  onKeyDown={(event) =>
                    handleSortOptionKeyDown(event, index)
                  }
                >
                  <span className="product-listing-sort-option-content">
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>

                  {isSelected ? (
                    <i
                      className="bi bi-check-lg product-listing-sort-check"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div
          className="btn-group product-listing-view-toggle"
          role="group"
          aria-label="Product display mode"
        >
          <button
            type="button"
            className={`btn ${
              viewMode === "grid"
                ? "btn-primary active"
                : "btn-outline-secondary"
            }`}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            title="Grid view"
            onClick={() => handleViewModeChange("grid")}
          >
            <i className="bi bi-grid-3x3-gap" aria-hidden="true" />
            <span className="visually-hidden">Grid view</span>
          </button>

          <button
            type="button"
            className={`btn ${
              viewMode === "list"
                ? "btn-primary active"
                : "btn-outline-secondary"
            }`}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            title="List view"
            onClick={() => handleViewModeChange("list")}
          >
            <i className="bi bi-list-ul" aria-hidden="true" />
            <span className="visually-hidden">List view</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductListingToolbar;