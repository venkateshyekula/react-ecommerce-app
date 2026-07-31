import { useRef, type KeyboardEvent } from "react";

/* ==========================================================================
   Types
   ========================================================================== */

export type ProductDetailsTab =
  | "description"
  | "specifications"
  | "reviews"
  | "questions";

interface ProductDetailsTabsProps {
  activeTab: ProductDetailsTab;
  onTabChange: (tabId: ProductDetailsTab) => void;
}

interface ProductDetailsTabItem {
  id: ProductDetailsTab;
  label: string;
  shortLabel: string;
  icon: string;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const productDetailsTabs: ProductDetailsTabItem[] = [
  {
    id: "description",
    label: "Product Details",
    shortLabel: "Details",
    icon: "bi bi-card-text"
  },
  {
    id: "specifications",
    label: "Specifications",
    shortLabel: "Specifications",
    icon: "bi bi-list-ul"
  },
  {
    id: "reviews",
    label: "Ratings & Reviews",
    shortLabel: "Reviews",
    icon: "bi bi-star"
  },
  {
    id: "questions",
    label: "Questions & Answers",
    shortLabel: "Questions",
    icon: "bi bi-question-circle"
  }
];

/* ==========================================================================
   Product Details Tabs Component
   ========================================================================== */

const ProductDetailsTabs = ({
  activeTab,
  onTabChange
}: ProductDetailsTabsProps) => {
  const tabListRef = useRef<HTMLDivElement | null>(null);

  /* ==========================================================================
     Helpers
     ========================================================================== */

  const focusTabAtIndex = (index: number): void => {
    const tabButtons =
      tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    tabButtons?.[index]?.focus();
  };

  const activateTabAtIndex = (index: number): void => {
    const nextTab = productDetailsTabs[index];

    if (!nextTab) {
      return;
    }

    onTabChange(nextTab.id);

    window.requestAnimationFrame(() => {
      focusTabAtIndex(index);
    });
  };

  /* ==========================================================================
     Keyboard Navigation (WAI-ARIA Pattern)
     ========================================================================== */

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ): void => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        nextIndex =
          currentIndex === productDetailsTabs.length - 1
            ? 0
            : currentIndex + 1;
        break;

      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        nextIndex =
          currentIndex === 0
            ? productDetailsTabs.length - 1
            : currentIndex - 1;
        break;

      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;

      case "End":
        event.preventDefault();
        nextIndex = productDetailsTabs.length - 1;
        break;

      default:
        // Let natural button click behavior handle Space/Enter
        return;
    }

    activateTabAtIndex(nextIndex);
  };

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <nav
      className="product-details-tabs-wrapper"
      aria-label="Product information sections"
    >
      <div
        ref={tabListRef}
        className="product-details-tabs"
        role="tablist"
        aria-orientation="horizontal"
      >
        {productDetailsTabs.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`product-${tab.id}-tab`}
              type="button"
              role="tab"
              className={`product-details-tab ${isActive ? "active" : ""}`}
              aria-selected={isActive}
              aria-controls={`product-${tab.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <i
                className={`${tab.icon} product-details-tab-icon`}
                aria-hidden="true"
              />

              <span className="product-details-tab-label">{tab.label}</span>

              <span
                className="product-details-tab-short-label"
                aria-hidden="true"
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default ProductDetailsTabs;