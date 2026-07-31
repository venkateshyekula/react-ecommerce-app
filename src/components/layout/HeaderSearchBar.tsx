import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent
} from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/productService";
import type { Product } from "../../types/product";
import {
  clearRecentSearches,
  getRecentSearches,
  saveRecentSearch
} from "../../utils/recentSearchStorage";

type SearchSuggestionType = "PRODUCT" | "CATEGORY" | "BRAND" | "SUBCATEGORY";

interface SearchSuggestion {
  id: string;
  label: string;
  subtitle?: string;
  type: SearchSuggestionType;
  target: string;
}

const getProductSubcategory = (product: Product): string => {
  return String((product as Product & { subcategory?: string }).subcategory ?? "");
};

const getProductColor = (product: Product): string => {
  return String(product.specifications?.Color ?? "");
};

const getProductIdealFor = (product: Product): string => {
  return String(product.specifications?.["Ideal For"] ?? "");
};

const getSuggestionIcon = (type: SearchSuggestionType): string => {
  switch (type) {
    case "PRODUCT":
      return "bi bi-box-seam";

    case "CATEGORY":
      return "bi bi-grid";

    case "BRAND":
      return "bi bi-shop";

    case "SUBCATEGORY":
      return "bi bi-tags";

    default:
      return "bi bi-search";
  }
};

const HeaderSearchBar = () => {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(
    getRecentSearches()
  );

  useEffect(() => {
    const loadProducts = async (): Promise<void> => {
      try {
        const result = await productService.getProducts();
        setProducts(result);
      } catch {
        setProducts([]);
      }
    };

    void loadProducts();
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setDebouncedSearchText("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const debounceTimer = window.setTimeout(() => {
      setDebouncedSearchText(searchText);
      setIsSearching(false);
    }, 300);

    return () => {
      window.clearTimeout(debounceTimer);
    };
  }, [searchText]);

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

  const query = debouncedSearchText.trim().toLowerCase();

  const productSuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!query) {
      return [];
    }

    return products
      .filter((product) => {
        const searchableText = [
          product.name,
          product.brand,
          product.category,
          product.sellerName ?? "",
          product.description,
          getProductSubcategory(product),
          getProductColor(product),
          getProductIdealFor(product)
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .slice(0, 6)
      .map((product) => ({
        id: `product-${product.id}`,
        label: product.name,
        subtitle: `${product.brand} • ${product.category}`,
        type: "PRODUCT",
        target: `/products/${product.id}`
      }));
  }, [products, query]);

  const categorySuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!query) {
      return [];
    }

    return Array.from(new Set(products.map((product) => product.category)))
      .filter((category) => category.toLowerCase().includes(query))
      .slice(0, 5)
      .map((category) => ({
        id: `category-${category}`,
        label: category,
        subtitle: "Category",
        type: "CATEGORY",
        target: `/categories/${encodeURIComponent(category)}`
      }));
  }, [products, query]);

  const brandSuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!query) {
      return [];
    }

    return Array.from(new Set(products.map((product) => product.brand)))
      .filter((brand) => brand.toLowerCase().includes(query))
      .slice(0, 5)
      .map((brand) => ({
        id: `brand-${brand}`,
        label: brand,
        subtitle: "Brand",
        type: "BRAND",
        target: `/products?search=${encodeURIComponent(brand)}`
      }));
  }, [products, query]);

  const subcategorySuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!query) {
      return [];
    }

    return Array.from(
      new Set(
        products
          .map((product) => getProductSubcategory(product))
          .filter(Boolean)
      )
    )
      .filter((subcategory) => subcategory.toLowerCase().includes(query))
      .slice(0, 5)
      .map((subcategory) => ({
        id: `subcategory-${subcategory}`,
        label: subcategory,
        subtitle: "Collection",
        type: "SUBCATEGORY",
        target: `/products?search=${encodeURIComponent(subcategory)}`
      }));
  }, [products, query]);

  const combinedSuggestions = useMemo<SearchSuggestion[]>(() => {
    return [
      ...productSuggestions,
      ...categorySuggestions,
      ...brandSuggestions,
      ...subcategorySuggestions
    ];
  }, [
    productSuggestions,
    categorySuggestions,
    brandSuggestions,
    subcategorySuggestions
  ]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchText]);

  const handleInputFocus = (): void => {
    setRecentSearches(getRecentSearches());
    setIsOpen(true);
  };

  const submitSearch = (overrideValue?: string): void => {
    const value = (overrideValue ?? searchText).trim();

    if (!value) {
      return;
    }

    saveRecentSearch(value);
    setRecentSearches(getRecentSearches());

    navigate(`/products?search=${encodeURIComponent(value)}`);
    setIsOpen(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion): void => {
    saveRecentSearch(suggestion.label);
    setRecentSearches(getRecentSearches());

    navigate(suggestion.target);
    setIsOpen(false);
  };

  const handleClearInput = (): void => {
    setSearchText("");
    setDebouncedSearchText("");
    setIsSearching(false);
    setRecentSearches(getRecentSearches());
    setActiveIndex(-1);

    inputRef.current?.focus();
  };

  const totalSuggestionsCount = useMemo(() => {
    if (isSearching) {
      return 0;
    }

    if (!query) {
      return recentSearches.length;
    }

    return combinedSuggestions.length;
  }, [isSearching, query, recentSearches.length, combinedSuggestions.length]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (isSearching) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((previousIndex) =>
        previousIndex < totalSuggestionsCount - 1
          ? previousIndex + 1
          : previousIndex
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((previousIndex) =>
        previousIndex > -1 ? previousIndex - 1 : -1
      );

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (activeIndex === -1) {
        submitSearch();
        return;
      }

      if (!query) {
        const selectedRecent = recentSearches[activeIndex];

        if (selectedRecent) {
          submitSearch(selectedRecent);
        }

        return;
      }

      const selectedSuggestion = combinedSuggestions[activeIndex];

      if (selectedSuggestion) {
        handleSuggestionClick(selectedSuggestion);
      }
    }
  };

  return (
    <div className="header-search-container" ref={wrapperRef}>
      <div className="header-search-box position-relative d-flex align-items-center">
        <i className="bi bi-search header-search-icon" />

        <input
          ref={inputRef}
          type="search"
          className="form-control header-search-input"
          placeholder="Search products, brands and more"
          value={searchText}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setSearchText(event.target.value);
            setIsOpen(true);
          }}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
        />

        {searchText ? (
          <button
            type="button"
            className="header-search-clear"
            onClick={handleClearInput}
            aria-label="Clear search input"
          >
            <i className="bi bi-x-lg" />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="header-search-dropdown">
          {isSearching ? (
            <div className="p-4 text-center text-muted">
              <div
                className="spinner-border text-primary mb-2"
                role="status"
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderWidth: "0.2em"
                }}
              >
                <span className="visually-hidden">Searching...</span>
              </div>

              <div className="small">Searching catalog...</div>
            </div>
          ) : null}

          {!isSearching && !query && recentSearches.length > 0 ? (
            <div className="header-search-section">
              <div className="d-flex justify-content-between mb-2">
                <strong>Recent Searches</strong>

                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  onClick={() => {
                    clearRecentSearches();
                    setRecentSearches([]);
                  }}
                >
                  Clear
                </button>
              </div>

              {recentSearches.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  className={`header-search-result ${
                    activeIndex === index ? "bg-light active-suggestion" : ""
                  }`}
                  onClick={() => submitSearch(item)}
                >
                  <i className="bi bi-clock-history me-2 text-muted" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          ) : null}

          {!isSearching && query && combinedSuggestions.length > 0 ? (
            <div className="header-search-section">
              {productSuggestions.length > 0 ? (
                <>
                  <strong className="d-block mb-1">Products</strong>

                  {productSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className={`header-search-result ${
                        activeIndex === index ? "bg-light active-suggestion" : ""
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <i
                        className={`${getSuggestionIcon(
                          suggestion.type
                        )} me-2 text-muted`}
                      />

                      <span>
                        <span className="d-block">{suggestion.label}</span>

                        {suggestion.subtitle ? (
                          <small className="text-muted">
                            {suggestion.subtitle}
                          </small>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </>
              ) : null}

              {categorySuggestions.length > 0 ? (
                <>
                  <strong className="d-block mt-3 mb-1">Categories</strong>

                  {categorySuggestions.map((suggestion) => {
                    const suggestionIndex = combinedSuggestions.findIndex(
                      (item) => item.id === suggestion.id
                    );

                    return (
                      <button
                        key={suggestion.id}
                        type="button"
                        className={`header-search-result ${
                          activeIndex === suggestionIndex
                            ? "bg-light active-suggestion"
                            : ""
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <i className="bi bi-grid me-2 text-muted" />

                        <span>
                          <span className="d-block">{suggestion.label}</span>
                          <small className="text-muted">
                            {suggestion.subtitle}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </>
              ) : null}

              {brandSuggestions.length > 0 ? (
                <>
                  <strong className="d-block mt-3 mb-1">Brands</strong>

                  {brandSuggestions.map((suggestion) => {
                    const suggestionIndex = combinedSuggestions.findIndex(
                      (item) => item.id === suggestion.id
                    );

                    return (
                      <button
                        key={suggestion.id}
                        type="button"
                        className={`header-search-result ${
                          activeIndex === suggestionIndex
                            ? "bg-light active-suggestion"
                            : ""
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <i className="bi bi-shop me-2 text-muted" />

                        <span>
                          <span className="d-block">{suggestion.label}</span>
                          <small className="text-muted">
                            {suggestion.subtitle}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </>
              ) : null}

              {subcategorySuggestions.length > 0 ? (
                <>
                  <strong className="d-block mt-3 mb-1">Collections</strong>

                  {subcategorySuggestions.map((suggestion) => {
                    const suggestionIndex = combinedSuggestions.findIndex(
                      (item) => item.id === suggestion.id
                    );

                    return (
                      <button
                        key={suggestion.id}
                        type="button"
                        className={`header-search-result ${
                          activeIndex === suggestionIndex
                            ? "bg-light active-suggestion"
                            : ""
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <i className="bi bi-tags me-2 text-muted" />

                        <span>
                          <span className="d-block">{suggestion.label}</span>
                          <small className="text-muted">
                            {suggestion.subtitle}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </>
              ) : null}
            </div>
          ) : null}

          {!isSearching && query && combinedSuggestions.length === 0 ? (
            <div className="p-3 text-center text-muted small">
              No recommendations match &quot;{searchText}&quot;
            </div>
          ) : null}

          {!isSearching && !query && recentSearches.length === 0 ? (
            <div className="p-3 text-center text-muted small">
              Start typing to search products, brands, categories, and
              collections.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default HeaderSearchBar;