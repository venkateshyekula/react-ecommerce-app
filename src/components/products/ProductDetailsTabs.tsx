export type ProductDetailsTab =
  | "description"
  | "specifications"
  | "reviews"
  | "questions";

interface ProductDetailsTabsProps {
  activeTab: ProductDetailsTab;
  onTabChange: (tabId: ProductDetailsTab) => void;
}

const productDetailsTabs: Array<{
  id: ProductDetailsTab;
  label: string;
  icon: string;
}> = [
  {
    id: "description",
    label: "Description",
    icon: "bi bi-card-text"
  },
  {
    id: "specifications",
    label: "Specifications",
    icon: "bi bi-list-ul"
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: "bi bi-star"
  },
  {
    id: "questions",
    label: "Questions & Answers",
    icon: "bi bi-question-circle"
  }
];

const ProductDetailsTabs = ({
  activeTab,
  onTabChange
}: ProductDetailsTabsProps) => {
  return (
    <ul
      className="nav nav-underline product-details-tabs mb-4"
      role="tablist"
    >
      {productDetailsTabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <li className="nav-item" role="presentation" key={tab.id}>
            {/* FIXED: Restored valid opening anchor tag with explicit typing and click handler */}
            <a
              className={`nav-link d-flex align-items-center ${isActive ? "active" : ""}`}
              href={`#${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={(event) => {
                event.preventDefault();
                onTabChange(tab.id);
              }}
            >
              <i className={`${tab.icon} me-2`} />
              {tab.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default ProductDetailsTabs;