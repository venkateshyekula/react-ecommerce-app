import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom"; 
import type {
  Product,
  ProductCategory,
  ProductColorFilter,
  ProductFilters,
  ProductGenderFilter,
} from "../../types/product";

interface ProductFilterProps {
  filters: ProductFilters;
  categories: ProductCategory[];
  brands: string[];
  products?: Product[];
  showCategoryFilter?: boolean;
  onFilterChange: <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) => void;
  onClearFilters: () => void;
}

interface FilterModalItem {
  label: string;
  value: string;
  count: number;
}

type MoreFilterType = "categories" | "brands";

const MIN_PRICE = 0;
const MAX_PRICE = 100000;
const PRICE_STEP = 500;

const formatPriceRangeLabel = (minPrice: number, maxPrice: number): string => {
  const formattedMin = minPrice.toLocaleString("en-IN");
  const formattedMax =
    maxPrice >= MAX_PRICE ? "1,00,000+" : maxPrice.toLocaleString("en-IN");

  return `₹${formattedMin} - ₹${formattedMax}`;
};

const genderOptions: ProductGenderFilter[] = ["Men", "Women", "Boys", "Girls"];

const alphabetOptions = [
  "#",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const colorOptions: Array<{
  label: ProductColorFilter;
  hex: string;
}> = [
  { label: "Gold", hex: "#FFD700" },
  { label: "Pink", hex: "#FFC0CB" },
  { label: "Green", hex: "#008000" },
  { label: "Blue", hex: "#0000FF" },
  { label: "Black", hex: "#000000" },
  { label: "Red", hex: "#FF0000" },
  { label: "Purple", hex: "#800080" },
  { label: "Silver", hex: "#C0C0C0" },
  { label: "Yellow", hex: "#FFFF00" },
  { label: "White", hex: "#FFFFFF" },
  { label: "Maroon", hex: "#800000" },
  { label: "Multi", hex: "#B565D9" },
  { label: "Navy Blue", hex: "#000080" },
  { label: "Off White", hex: "#FAF9F6" },
  { label: "Teal", hex: "#008080" },
  { label: "Grey", hex: "#808080" },
  { label: "Peach", hex: "#FFE5B4" },
  { label: "Orange", hex: "#FFA500" },
  { label: "Beige", hex: "#F5F5DC" },
  { label: "Brown", hex: "#A52A2A" },
  { label: "Cream", hex: "#FFFDD0" },
  { label: "Mustard", hex: "#FFDB58" },
  { label: "Turquoise Blue", hex: "#40E0D0" },
  { label: "Olive", hex: "#808000" },
  { label: "Lime Green", hex: "#32CD32" },
  { label: "Sea Green", hex: "#2E8B57" },
  { label: "Lavender", hex: "#E6E6FA" },
  { label: "Magenta", hex: "#FF00FF" },
  { label: "Rose Gold", hex: "#B76E79" },
  { label: "Rust", hex: "#B7410E" },
  { label: "Burgundy", hex: "#800020" },
  { label: "Mauve", hex: "#E0B0FF" },
  { label: "Violet", hex: "#8F00FF" },
  { label: "Rose", hex: "#FF007F" },
  { label: "Coral", hex: "#FF7F50" },
  { label: "Coffee Brown", hex: "#6F4E37" },
  { label: "Copper", hex: "#B87333" },
  { label: "Charcoal", hex: "#36454F" },
  { label: "Tan", hex: "#D2B48C" },
  { label: "Fluorescent Green", hex: "#39FF14" },
  { label: "Taupe", hex: "#483C32" },
  { label: "Bronze", hex: "#CD7F32" },
  { label: "Khaki", hex: "#C3B091" },
  { label: "Metallic", hex: "#A8A9AD" },
  { label: "Nude", hex: "#E3BC9A" },
  { label: "Champagne", hex: "#F7E7CE" },
  { label: "Camel Brown", hex: "#C19A6B" },
  { label: "Grey Melange", hex: "#B2B2B2" },
  { label: "Assorted", hex: "#9E9E9E" },
  { label: "Transparent", hex: "#FFFFFF00" },
  { label: "Steel", hex: "#71797E" },
  { label: "Skin", hex: "#F1C27D" },
];

const discountOptions: Array<{
  label: string;
  value: ProductFilters["discount"];
}> = [
  { label: "10% and above", value: "ABOVE_10" },
  { label: "20% and above", value: "ABOVE_20" },
  { label: "30% and above", value: "ABOVE_30" },
  { label: "40% and above", value: "ABOVE_40" },
  { label: "50% and above", value: "ABOVE_50" },
  { label: "60% and above", value: "ABOVE_60" },
  { label: "70% and above", value: "ABOVE_70" },
  { label: "80% and above", value: "ABOVE_80" },
  { label: "90% and above", value: "ABOVE_90" },
];

const getProductGender = (product: Product): ProductGenderFilter | "" => {
  const idealFor = String(product.specifications?.["Ideal For"] ?? "");
  const searchableText =
    `${product.category} ${product.name} ${product.description} ${idealFor}`.toLowerCase();

  if (searchableText.includes("boys")) return "Boys";
  if (searchableText.includes("girls")) return "Girls";
  if (searchableText.includes("women")) return "Women";
  if (searchableText.includes("men")) return "Men";
  return "";
};

const getProductColor = (product: Product): string =>
  String(product.specifications?.Color ?? "").trim();
const getProductSubcategory = (product: Product): string | undefined =>
  (product as Product & { subcategory?: string }).subcategory;
const getCategoryLabel = (product: Product): string =>
  getProductSubcategory(product) ?? product.category;
const getCountByPredicate = (
  products: Product[] | undefined,
  predicate: (product: Product) => boolean,
): number => products?.filter(predicate).length ?? 0;

const getAlphabetForLabel = (label: string): string => {
  const firstCharacter = label.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(firstCharacter) ? firstCharacter : "#";
};

const groupItemsByAlphabet = (
  items: FilterModalItem[],
): Array<{ alphabet: string; items: FilterModalItem[] }> => {
  return alphabetOptions
    .map((alphabet) => ({
      alphabet,
      items: items.filter(
        (item) => getAlphabetForLabel(item.label) === alphabet,
      ),
    }))
    .filter((group) => group.items.length > 0);
};

const ProductFilter = ({
  filters,
  categories,
  brands,
  products,
  showCategoryFilter = true,
  onFilterChange,
  onClearFilters,
}: ProductFilterProps) => {
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [brandSearch, setBrandSearch] = useState<string>("");
  const [colorSearch, setColorSearch] = useState<string>("");

  const [isCategorySearchOpen, setIsCategorySearchOpen] =
    useState<boolean>(false);
  const [isBrandSearchOpen, setIsBrandSearchOpen] = useState<boolean>(false);
  const [isColorSearchOpen, setIsColorSearchOpen] = useState<boolean>(false);
  const [isColorExpanded, setIsColorExpanded] = useState<boolean>(false);

  const [moreFilterType, setMoreFilterType] = useState<MoreFilterType | null>(
    null,
  );
  const [moreFilterSearch, setMoreFilterSearch] = useState<string>("");
  const [activeAlphabet, setActiveAlphabet] = useState<string>("");

  useEffect(() => {
    if (moreFilterType) {
      document.body.classList.add("myntra-more-filter-open");
    } else {
      document.body.classList.remove("myntra-more-filter-open");
    }
    return () => {
      document.body.classList.remove("myntra-more-filter-open");
    };
  }, [moreFilterType]);

  const derivedCategoryLabels = useMemo<FilterModalItem[]>(() => {
    if (!products?.length) {
      return categories.map((category) => ({
        label: category,
        value: category,
        count: 0,
      }));
    }

    const categoryMap = new Map<string, number>();
    products.forEach((product) => {
      const label = getCategoryLabel(product);
      categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([label, count]) => ({ label, value: label, count }))
      .sort((first, second) => second.count - first.count);
  }, [products, categories]);

  const brandItems = useMemo<FilterModalItem[]>(() => {
    return brands
      .map((brand) => ({
        label: brand,
        value: brand,
        count: getCountByPredicate(
          products,
          (product) => product.brand === brand,
        ),
      }))
      .sort((first, second) => second.count - first.count);
  }, [brands, products]);

  const filteredCategoryLabels = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    return derivedCategoryLabels.filter((category) =>
      category.label.toLowerCase().includes(query),
    );
  }, [derivedCategoryLabels, categorySearch]);

  const filteredBrands = useMemo(() => {
    const query = brandSearch.trim().toLowerCase();
    return brandItems.filter((brand) =>
      brand.label.toLowerCase().includes(query),
    );
  }, [brandItems, brandSearch]);

  const filteredColors = useMemo(() => {
    const query = colorSearch.trim().toLowerCase();
    return colorOptions.filter((color) =>
      color.label.toLowerCase().includes(query),
    );
  }, [colorSearch]);

  const visibleColors = useMemo(() => {
    return isColorExpanded ? filteredColors : filteredColors.slice(0, 8);
  }, [filteredColors, isColorExpanded]);

  const hiddenColorCount = Math.max(
    filteredColors.length - visibleColors.length,
    0,
  );

  const moreFilterItems = useMemo<FilterModalItem[]>(() => {
    const sourceItems =
      moreFilterType === "categories" ? derivedCategoryLabels : brandItems;
    const query = moreFilterSearch.trim().toLowerCase();

    return sourceItems.filter((item) => {
      const matchesSearch = !query || item.label.toLowerCase().includes(query);
      const matchesAlphabet =
        !activeAlphabet || getAlphabetForLabel(item.label) === activeAlphabet;
      return matchesSearch && matchesAlphabet;
    });
  }, [
    moreFilterType,
    derivedCategoryLabels,
    brandItems,
    moreFilterSearch,
    activeAlphabet,
  ]);

  const groupedMoreFilterItems = useMemo(
    () => groupItemsByAlphabet(moreFilterItems),
    [moreFilterItems],
  );

  const hasAnyFilter =
    Boolean(filters.searchText) ||
    Boolean(filters.gender) ||
    Boolean(filters.category) ||
    Boolean(filters.brand) ||
    Boolean(filters.color) ||
    Boolean(filters.priceRange) ||
    Boolean(filters.discount) ||
    Boolean(filters.availability);

  const handleGenderChange = (gender: ProductGenderFilter): void => {
    onFilterChange("gender", filters.gender === gender ? "" : gender);
  };

  const handleCategoryChange = (categoryLabel: string): void => {
    const matchedCategory = categories.find(
      (cat) => cat.toLowerCase() === categoryLabel.toLowerCase(),
    );
    if (matchedCategory) {
      onFilterChange(
        "category",
        filters.category === matchedCategory ? "" : matchedCategory,
      );
      return;
    }
    onFilterChange(
      "searchText",
      filters.searchText === categoryLabel ? "" : categoryLabel,
    );
  };

  const handleBrandChange = (brand: string): void => {
    onFilterChange("brand", filters.brand === brand ? "" : brand);
  };

  const handleColorChange = (color: ProductColorFilter): void => {
    onFilterChange("color", filters.color === color ? "" : color);
  };

  const handleOpenMoreFilter = (type: MoreFilterType): void => {
    setMoreFilterType(type);
    setMoreFilterSearch("");
    setActiveAlphabet("");
  };

  const handleCloseMoreFilter = (): void => {
    setMoreFilterType(null);
    setMoreFilterSearch("");
    setActiveAlphabet("");
  };

  const handleClearFilterUI = (): void => {
    setCategorySearch("");
    setBrandSearch("");
    setColorSearch("");
    setIsCategorySearchOpen(false);
    setIsBrandSearchOpen(false);
    setIsColorSearchOpen(false);
    setIsColorExpanded(false);
    setMoreFilterType(null);
    setMoreFilterSearch("");
    setActiveAlphabet("");
  };

  const isMoreFilterItemActive = (item: FilterModalItem): boolean => {
    if (moreFilterType === "brands") return filters.brand === item.value;
    return filters.category === item.value || filters.searchText === item.label;
  };

  const handleMoreFilterItemChange = (item: FilterModalItem): void => {
    if (moreFilterType === "brands") {
      handleBrandChange(item.value);
      return;
    }
    handleCategoryChange(item.value);
  };

  const handleMinPriceChange = (value: number): void => {
    const nextMinPrice = Math.min(value, filters.priceMax);
    const clampedMinPrice = Math.min(nextMinPrice, filters.priceMax - 0);

    onFilterChange("priceMin", clampedMinPrice);
    onFilterChange("priceRange", "");
  };

  const handleMaxPriceChange = (value: number): void => {
    const nextMaxPrice = Math.max(value, filters.priceMin);
    const clampedMaxPrice = Math.max(nextMaxPrice, filters.priceMin + 0);

    onFilterChange("priceMax", clampedMaxPrice);
    onFilterChange("priceRange", "");
  };

  return (
    <>
      <aside className="filter-sidebar bg-white">
        <div className="filter-top-title">
          <h5>Filters</h5>
          <button
            type="button"
            className="clear-filter-btn"
            disabled={!hasAnyFilter}
            onClick={() => {
              onClearFilters();
              handleClearFilterUI();
            }}
          >
            Clear All
          </button>
        </div>

        {/* Gender Filter */}
        <section className="filter-section">
          <div className="radio-list">
            {genderOptions.map((gender) => {
              const count = getCountByPredicate(
                products,
                (product) => getProductGender(product) === gender,
              );
              return (
                <label className="radio-option" key={gender}>
                  <input
                    type="radio"
                    name="gender"
                    checked={filters.gender === gender}
                    onChange={() => handleGenderChange(gender)}
                  />
                  <span className="radio-ui" />
                  <span>
                    {gender}
                    {products ? (
                      <small className="option-count ms-1">({count})</small>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Categories Filter */}
        {showCategoryFilter ? (
          <section className="filter-section">
            <div
              className={`filter-section-header ${isCategorySearchOpen ? "search-open" : ""}`}
            >
              {isCategorySearchOpen ? (
                <input
                  className="inline-filter-search"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories"
                  autoFocus
                />
              ) : (
                <h6>Categories</h6>
              )}
              <button
                type="button"
                className="filter-search-btn"
                onClick={() => {
                  setIsCategorySearchOpen((prev) => !prev);
                  if (isCategorySearchOpen) setCategorySearch("");
                }}
                aria-label={
                  isCategorySearchOpen
                    ? "Close category search"
                    : "Search categories"
                }
              >
                <i
                  className={
                    isCategorySearchOpen ? "bi bi-x-lg" : "bi bi-search"
                  }
                />
              </button>
            </div>

            <div className="checkbox-list">
              {filteredCategoryLabels.slice(0, 8).map((category) => {
                const isActive =
                  filters.category === category.value ||
                  filters.searchText === category.label;
                return (
                  <label
                    className={`checkbox-option ${isActive ? "active" : ""}`}
                    key={category.label}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleCategoryChange(category.label)}
                    />
                    <span className="checkbox-ui" />
                    <span className="option-label">{category.label}</span>
                    <span className="option-count">({category.count})</span>
                  </label>
                );
              })}
              {filteredCategoryLabels.length > 8 ? (
                <button
                  type="button"
                  className="more-btn"
                  onClick={() => handleOpenMoreFilter("categories")}
                >
                  + {filteredCategoryLabels.length - 8} more
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Brand Filter */}
        <section className="filter-section">
          <div
            className={`filter-section-header ${isBrandSearchOpen ? "search-open" : ""}`}
          >
            {isBrandSearchOpen ? (
              <input
                className="inline-filter-search"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Search brands"
                autoFocus
              />
            ) : (
              <h6>Brand</h6>
            )}
            <button
              type="button"
              className="filter-search-btn"
              onClick={() => {
                setIsBrandSearchOpen((prev) => !prev);
                if (isBrandSearchOpen) setBrandSearch("");
              }}
              aria-label={
                isBrandSearchOpen ? "Close brand search" : "Search brands"
              }
            >
              <i
                className={isBrandSearchOpen ? "bi bi-x-lg" : "bi bi-search"}
              />
            </button>
          </div>

          <div className="checkbox-list">
            {filteredBrands.slice(0, 8).map((brand) => (
              <label
                className={`checkbox-option ${filters.brand === brand.label ? "active" : ""}`}
                key={brand.label}
              >
                <input
                  type="checkbox"
                  checked={filters.brand === brand.label}
                  onChange={() => handleBrandChange(brand.label)}
                />
                <span className="checkbox-ui" />
                <span className="option-label">{brand.label}</span>
                <span className="option-count">({brand.count})</span>
              </label>
            ))}
            {filteredBrands.length > 8 ? (
              <button
                type="button"
                className="more-btn"
                onClick={() => handleOpenMoreFilter("brands")}
              >
                + {filteredBrands.length - 8} more
              </button>
            ) : null}
          </div>
        </section>

        {/* Price Filter */}
        <section className="filter-section">
          <h6 className="filter-title">Price</h6>

          <div className="price-slider">
            <div className="price-slider-track" />

            <div
              className="price-slider-range"
              style={{
                left: `${(filters.priceMin / MAX_PRICE) * 100}%`,
                right: `${100 - (filters.priceMax / MAX_PRICE) * 100}%`,
              }}
            />

            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={PRICE_STEP}
              value={filters.priceMin}
              onChange={(event) =>
                handleMinPriceChange(Number(event.target.value))
              }
              className="price-range-input min-range"
              aria-label="Minimum price"
            />

            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={PRICE_STEP}
              value={filters.priceMax}
              onChange={(event) =>
                handleMaxPriceChange(Number(event.target.value))
              }
              className="price-range-input max-range"
              aria-label="Maximum price"
            />
          </div>

          <div className="price-value">
            <strong>
              {formatPriceRangeLabel(filters.priceMin, filters.priceMax)}
            </strong>
          </div>
        </section>

        {/* Color Filter */}
        <section className="filter-section">
          <div
            className={`filter-section-header ${
              isColorSearchOpen ? "search-open" : ""
            }`}
          >
            {isColorSearchOpen ? (
              <input
                className="inline-filter-search"
                value={colorSearch}
                onChange={(event) => {
                  setColorSearch(event.target.value);
                  setIsColorExpanded(true);
                }}
                placeholder="Search colors"
                autoFocus
              />
            ) : (
              <h6>Color</h6>
            )}

            <button
              type="button"
              className="filter-search-btn"
              onClick={() => {
                setIsColorSearchOpen((previousValue) => !previousValue);

                if (isColorSearchOpen) {
                  setColorSearch("");
                  setIsColorExpanded(false);
                }
              }}
              aria-label={
                isColorSearchOpen ? "Close color search" : "Search colors"
              }
            >
              <i
                className={isColorSearchOpen ? "bi bi-x-lg" : "bi bi-search"}
              />
            </button>
          </div>

          <div className="checkbox-list">
            {visibleColors.map((color) => {
              const count = getCountByPredicate(
                products,
                (product) =>
                  getProductColor(product).toLowerCase() ===
                  color.label.toLowerCase(),
              );

              return (
                <label
                  className={`checkbox-option color-option ${
                    filters.color === color.label ? "active" : ""
                  }`}
                  key={color.label}
                >
                  <input
                    type="checkbox"
                    checked={filters.color === color.label}
                    onChange={() => handleColorChange(color.label)}
                  />

                  <span className="checkbox-ui" />

                  <span
                    className="color-dot"
                    style={{ backgroundColor: color.hex }}
                  />

                  <span className="option-label">{color.label}</span>

                  {products ? (
                    <span className="option-count">({count})</span>
                  ) : null}
                </label>
              );
            })}

            {filteredColors.length > 8 ? (
              <button
                type="button"
                className="more-btn"
                onClick={() =>
                  setIsColorExpanded((previousValue) => !previousValue)
                }
              >
                {isColorExpanded ? "Show Less" : `+ ${hiddenColorCount} more`}
              </button>
            ) : null}
          </div>
        </section>

        {/* Discount Filter */}
        <section className="filter-section">
          <h6 className="filter-title">Discount Range</h6>
          <div className="radio-list">
            {discountOptions.map((option) => (
              <label className="radio-option" key={option.value}>
                <input
                  type="radio"
                  name="discount"
                  checked={filters.discount === option.value}
                  onChange={() =>
                    onFilterChange(
                      "discount",
                      filters.discount === option.value ? "" : option.value,
                    )
                  }
                />
                <span className="radio-ui" />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>
      </aside>

      {/* OPTIMIZATION FIX: Wrapped the overlay dialog in createPortal 
  to move it to document.body, escaping the parent's layout bounds.
*/}
      {moreFilterType
        ? createPortal(
            <div
              className={`more-filter-overlay-base ${
                moreFilterType === "categories"
                  ? "categories-filter-overlay-specific"
                  : "brands-filter-overlay-specific"
              }`}
              role="dialog"
              aria-modal="true"
            >
              <div
                className={`more-filter-modal bg-white ${
                  moreFilterType === "categories"
                    ? "modal-theme-categories"
                    : "modal-theme-brands"
                }`}
              >
                <div className="more-filter-toolbar">
                  <input
                    className="more-filter-search"
                    value={moreFilterSearch}
                    onChange={(event) =>
                      setMoreFilterSearch(event.target.value)
                    }
                    placeholder={
                      moreFilterType === "categories"
                        ? "Search Categories"
                        : "Search Brands"
                    }
                  />

                  <div className="alphabet-row">
                    {alphabetOptions.map((alphabet) => (
                      <button
                        type="button"
                        className={activeAlphabet === alphabet ? "active" : ""}
                        key={alphabet}
                        onClick={() =>
                          setActiveAlphabet(
                            activeAlphabet === alphabet ? "" : alphabet,
                          )
                        }
                      >
                        {alphabet}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="more-filter-close"
                    onClick={handleCloseMoreFilter}
                    aria-label="Close more filters"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </div>

                <div className="more-filter-content">
                  {groupedMoreFilterItems.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      No items found.
                    </div>
                  ) : (
                    <div className="more-filter-columns">
                      {groupedMoreFilterItems.map((group) => (
                        <div className="more-filter-group" key={group.alphabet}>
                          <h6>{group.alphabet}</h6>

                          {group.items.map((item) => (
                            <label
                              className={`more-filter-option ${isMoreFilterItemActive(item) ? "active" : ""}`}
                              key={`${group.alphabet}-${item.label}`}
                            >
                              <input
                                type="checkbox"
                                checked={isMoreFilterItemActive(item)}
                                onChange={() =>
                                  handleMoreFilterItemChange(item)
                                }
                              />
                              <span className="checkbox-ui" />
                              <span className="option-label">{item.label}</span>
                              <span className="option-count">
                                ({item.count})
                              </span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="more-filter-bottom-scroll">
                  <span />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default ProductFilter;