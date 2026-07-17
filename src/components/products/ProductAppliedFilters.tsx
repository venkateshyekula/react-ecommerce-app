import type { ProductFilters } from "../../types/product";

interface ProductAppliedFiltersProps {
  filters: ProductFilters;
  onFilterChange: <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => void;
  onClearFilters: () => void;
}

interface FilterChip {
  key: keyof ProductFilters;
  label: string;
}

const MAX_PRICE = 100000;

const priceRangeLabels: Record<
  Exclude<ProductFilters["priceRange"], "">,
  string
> = {
  BELOW_1000: "Below ₹1,000",
  BETWEEN_1000_10000: "₹1,000 - ₹10,000",
  BETWEEN_10000_50000: "₹10,000 - ₹50,000",
  ABOVE_50000: "Above ₹50,000"
};

const ratingLabels: Record<Exclude<ProductFilters["rating"], "">, string> = {
  ABOVE_5: "5★ and above",
  ABOVE_4: "4★ and above",
  ABOVE_3: "3★ and above",
  ABOVE_2: "2★ and above"
};

const discountLabels: Record<
  Exclude<ProductFilters["discount"], "">,
  string
> = {
  ABOVE_10: "10% and above",
  ABOVE_20: "20% and above",
  ABOVE_30: "30% and above",
  ABOVE_40: "40% and above",
  ABOVE_50: "50% and above",
  ABOVE_60: "60% and above",
  ABOVE_70: "70% and above",
  ABOVE_80: "80% and above",
  ABOVE_90: "90% and above"
};

const availabilityLabels: Record<
  Exclude<ProductFilters["availability"], "">,
  string
> = {
  IN_STOCK: "In Stock",
  OUT_OF_STOCK: "Out of Stock"
};

const formatPrice = (price: number): string => {
  if (price >= MAX_PRICE) {
    return "₹1,00,000+";
  }

  return `₹${price.toLocaleString("en-IN")}`;
};

const ProductAppliedFilters = ({
  filters,
  onFilterChange,
  onClearFilters
}: ProductAppliedFiltersProps) => {
  const chips: FilterChip[] = [];

  if (filters.searchText) {
    chips.push({
      key: "searchText",
      label: `Search: ${filters.searchText}`
    });
  }

  if (filters.gender) {
    chips.push({
      key: "gender",
      label: filters.gender
    });
  }

  if (filters.category) {
    chips.push({
      key: "category",
      label: filters.category
    });
  }

  if (filters.brand) {
    chips.push({
      key: "brand",
      label: filters.brand
    });
  }

  if (filters.color) {
    chips.push({
      key: "color",
      label: filters.color
    });
  }

  if (filters.priceMin > 0 || filters.priceMax < MAX_PRICE) {
    chips.push({
      key: "priceMin",
      label: `Price: ${formatPrice(filters.priceMin)} - ${formatPrice(
        filters.priceMax
      )}`
    });
  }

  if (filters.priceRange) {
    chips.push({
      key: "priceRange",
      label: priceRangeLabels[filters.priceRange]
    });
  }

  if (filters.rating) {
    chips.push({
      key: "rating",
      label: ratingLabels[filters.rating]
    });
  }

  if (filters.discount) {
    chips.push({
      key: "discount",
      label: discountLabels[filters.discount]
    });
  }

  if (filters.availability) {
    chips.push({
      key: "availability",
      label: availabilityLabels[filters.availability]
    });
  }

  if (chips.length === 0) {
    return null;
  }

  const handleRemoveFilter = (key: keyof ProductFilters): void => {
    if (key === "sortBy") {
      return;
    }

    if (key === "priceMin" || key === "priceMax") {
      onFilterChange("priceMin", 0);
      onFilterChange("priceMax", MAX_PRICE);
      onFilterChange("priceRange", "");
      return;
    }

    if (key === "searchText") {
      onFilterChange("searchText", "");
      return;
    }

    if (key === "gender") {
      onFilterChange("gender", "");
      return;
    }

    if (key === "category") {
      onFilterChange("category", "");
      return;
    }

    if (key === "brand") {
      onFilterChange("brand", "");
      return;
    }

    if (key === "color") {
      onFilterChange("color", "");
      return;
    }

    if (key === "priceRange") {
      onFilterChange("priceRange", "");
      return;
    }

    if (key === "rating") {
      onFilterChange("rating", "");
      return;
    }

    if (key === "discount") {
      onFilterChange("discount", "");
      return;
    }

    if (key === "availability") {
      onFilterChange("availability", "");
    }
  };

  return (
    <div className="product-applied-filters">
      <div className="product-applied-filter-list">
        {chips.map((chip) => (
          <button
            key={`${String(chip.key)}-${chip.label}`}
            type="button"
            className="product-applied-filter-chip"
            onClick={() => handleRemoveFilter(chip.key)}
          >
            <span>{chip.label}</span>
            <i className="bi bi-x-lg" />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="product-applied-filter-clear"
        onClick={onClearFilters}
      >
        Clear All
      </button>
    </div>
  );
};

export default ProductAppliedFilters;