import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types/product";
import {
  clearRecentSearches,
  getRecentSearches,
  saveRecentSearch,
} from "../../utils/recentSearchStorage";

interface AdvancedSearchBoxProps {
  value: string;
  products: Product[];
  placeholder?: string;
  onChange: (value: string) => void;
}

const MAX_PRODUCT_SUGGESTIONS = 5;
const MAX_BRAND_SUGGESTIONS = 4;
const MAX_CATEGORY_SUGGESTIONS = 4;

const AdvancedSearchBox = ({
  value,
  products,
  placeholder = "Search products, brands, categories...",
  onChange,
}: AdvancedSearchBoxProps) => {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    getRecentSearches(),
  );

  const query = value.trim().toLowerCase();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const productSuggestions = useMemo(() => {
    if (!query) {
      return [];
    }

    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.sellerName?.toLowerCase().includes(query),
      )
      .slice(0, MAX_PRODUCT_SUGGESTIONS);
  }, [products, query]);

  const brandSuggestions = useMemo(() => {
    if (!query) {
      return [];
    }

    return Array.from(new Set(products.map((product) => product.brand)))
      .filter((brand) => brand.toLowerCase().includes(query))
      .slice(0, MAX_BRAND_SUGGESTIONS);
  }, [products, query]);

  const categorySuggestions = useMemo(() => {
    if (!query) {
      return [];
    }

    return Array.from(new Set(products.map((product) => product.category)))
      .filter((category) => category.toLowerCase().includes(query))
      .slice(0, MAX_CATEGORY_SUGGESTIONS);
  }, [products, query]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
    setIsOpen(true);
  };

  const handleSearchSubmit = (): void => {
    const searchText = value.trim();

    if (!searchText) {
      return;
    }

    saveRecentSearch(searchText);
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      handleSearchSubmit();
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleProductClick = (productId: string): void => {
    handleSearchSubmit();
    navigate(`/products/${productId}`);
  };

  const handleBrandClick = (brand: string): void => {
    onChange(brand);
    saveRecentSearch(brand);
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
  };

  const handleCategoryClick = (category: string): void => {
    saveRecentSearch(category);
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
    navigate(`/categories/${category}`);
  };

  const handleRecentSearchClick = (searchText: string): void => {
    onChange(searchText);
    setIsOpen(false);
  };

  const handleClearRecentSearches = (): void => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const shouldShowSuggestions =
    isOpen &&
    (Boolean(query) ||
      recentSearches.length > 0 ||
      productSuggestions.length > 0);

  return (
    <div className="advanced-search-box" ref={wrapperRef}>
      <div className="advanced-search-input-wrapper">
        <i className="bi bi-search advanced-search-icon" />

        <input
          type="text"
          className="form-control advanced-search-input"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {value ? (
          <button
            type="button"
            className="advanced-search-clear"
            onClick={() => {
              onChange("");
              setIsOpen(true);
            }}
            aria-label="Clear search"
          >
            <i className="bi bi-x-lg" />
          </button>
        ) : null}
      </div>

      {shouldShowSuggestions ? (
        <div className="advanced-search-dropdown bg-white rounded-4 shadow-sm">
          {!query && recentSearches.length > 0 ? (
            <div className="advanced-search-section">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0">Recent Searches</h6>

                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  onClick={handleClearRecentSearches}
                >
                  Clear
                </button>
              </div>

              <div className="recent-search-chip-list">
                {recentSearches.map((searchText) => (
                  <button
                    key={searchText}
                    type="button"
                    className="recent-search-chip"
                    onClick={() => handleRecentSearchClick(searchText)}
                  >
                    <i className="bi bi-clock-history me-1" />
                    {searchText}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {productSuggestions.length > 0 ? (
            <div className="advanced-search-section">
              <h6 className="fw-bold mb-2">Products</h6>

              {productSuggestions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="advanced-search-result"
                  onClick={() => handleProductClick(product.id)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="rounded-3 border object-fit-cover"
                    style={{ width: "45px", height: "45px" }}
                  />

                  <span className="flex-grow-1">
                    <strong>{product.name}</strong>
                    <small>
                      {product.brand} • {product.category}
                    </small>
                  </span>

                  <i className="bi bi-arrow-right text-muted" />
                </button>
              ))}
            </div>
          ) : null}

          {brandSuggestions.length > 0 ? (
            <div className="advanced-search-section">
              <h6 className="fw-bold mb-2">Brands</h6>

              <div className="suggestion-pill-list">
                {brandSuggestions.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    className="suggestion-pill"
                    onClick={() => handleBrandClick(brand)}
                  >
                    <i className="bi bi-tags me-1" />
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {categorySuggestions.length > 0 ? (
            <div className="advanced-search-section">
              <h6 className="fw-bold mb-2">Categories</h6>

              <div className="suggestion-pill-list">
                {categorySuggestions.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className="suggestion-pill"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <i className="bi bi-grid me-1" />
                    {category}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {query &&
          productSuggestions.length === 0 &&
          brandSuggestions.length === 0 &&
          categorySuggestions.length === 0 ? (
            <div className="advanced-search-section">
              <p className="text-muted mb-0">
                No suggestions found. Press Enter to search for{" "}
                <strong>{value}</strong>.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default AdvancedSearchBox;
