import { useId, useMemo } from "react";

import type { Product } from "../../types/product";

/* ==========================================================================
   Types
   ========================================================================== */

export interface ProductSizeOption {
  size: string;
  stock?: number;
  available?: boolean;
}

interface ProductSizeSelectorProps {
  product: Product;

  /**
   * Optional advanced size records.
   *
   * When omitted, the component automatically uses product.sizeOptions.
   */
  sizes?: Array<string | ProductSizeOption>;

  selectedSize: string;
  onSizeChange: (size: string) => void;

  disabled?: boolean;
  required?: boolean;
  errorMessage?: string;
  showStockCount?: boolean;

  /**
   * The size guide is automatically shown when the
   * product has size-chart rows and this value is not false.
   */
  showSizeGuide?: boolean;

  /**
   * Preferred callback used by ProductDetailsPage.
   */
  onOpenSizeChart?: () => void;

  /**
   * Backward-compatible callback for older integrations.
   */
  onSizeGuideClick?: () => void;

  className?: string;
}

interface NormalizedSizeOption {
  size: string;
  stock?: number;
  available: boolean;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const LOW_STOCK_THRESHOLD = 5;

/* ==========================================================================
   Helpers
   ========================================================================== */

const normalizeSizeOption = (
  sizeOption: string | ProductSizeOption
): NormalizedSizeOption => {
  if (typeof sizeOption === "string") {
    return {
      size: sizeOption.trim(),
      available: true
    };
  }

  const normalizedStock =
    typeof sizeOption.stock === "number" && Number.isFinite(sizeOption.stock)
      ? Math.max(0, Math.floor(sizeOption.stock))
      : undefined;

  const isAvailable =
    sizeOption.available ??
    (normalizedStock === undefined || normalizedStock > 0);

  return {
    size: sizeOption.size.trim(),
    stock: normalizedStock,
    available: isAvailable
  };
};

const getSizeSectionTitle = (product: Product): string => {
  if (product.category === "Footwear") {
    return "Select Size (UK Size)";
  }

  return "Select Size";
};

const createInputIdPart = (size: string): string => {
  const sanitizedSize = size
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return sanitizedSize || "size";
};

/* ==========================================================================
   Product Size Selector Component
   ========================================================================== */

const ProductSizeSelector = ({
  product,
  sizes,
  selectedSize,
  onSizeChange,
  disabled = false,
  required = true,
  errorMessage = "",
  showStockCount = true,
  showSizeGuide = true,
  onOpenSizeChart,
  onSizeGuideClick,
  className = ""
}: ProductSizeSelectorProps) => {
  const generatedId = useId();

  /* ==========================================================================
     Resolve Size Source
     ========================================================================== */

  const sourceSizes = useMemo<Array<string | ProductSizeOption>>(() => {
    if (Array.isArray(sizes) && sizes.length > 0) {
      return sizes;
    }

    return product.sizeOptions ?? [];
  }, [product.sizeOptions, sizes]);

  /* ==========================================================================
     Normalize and Deduplicate Sizes
     ========================================================================== */

  const normalizedSizes = useMemo<NormalizedSizeOption[]>(() => {
    const uniqueSizes = new Map<string, NormalizedSizeOption>();

    sourceSizes.forEach((sizeOption) => {
      const normalizedOption = normalizeSizeOption(sizeOption);

      const trimmedSize = normalizedOption.size.trim();

      if (!trimmedSize) {
        return;
      }

      const normalizedKey = trimmedSize.toLowerCase();

      if (!uniqueSizes.has(normalizedKey)) {
        uniqueSizes.set(normalizedKey, {
          ...normalizedOption,
          size: trimmedSize
        });
      }
    });

    return Array.from(uniqueSizes.values());
  }, [sourceSizes]);

  /* ==========================================================================
     Derived State
     ========================================================================== */

  const normalizedSelectedSize = selectedSize.trim().toLowerCase();

  const selectedSizeOption = useMemo(() => {
    return normalizedSizes.find(
      (sizeOption) => sizeOption.size.toLowerCase() === normalizedSelectedSize
    );
  }, [normalizedSelectedSize, normalizedSizes]);

  const availableSizeCount = useMemo(() => {
    return normalizedSizes.filter((sizeOption) => sizeOption.available).length;
  }, [normalizedSizes]);

  const hasError = Boolean(errorMessage.trim());
  const hasAvailableSizes = availableSizeCount > 0;
  const hasSizeChart = Boolean(product.sizeChart?.rows?.length);

  const sizeGuideHandler = onOpenSizeChart ?? onSizeGuideClick;

  const shouldShowSizeGuide =
    showSizeGuide && hasSizeChart && Boolean(sizeGuideHandler);

  /* ==========================================================================
     Handlers
     ========================================================================== */

  const handleSizeChange = (sizeOption: NormalizedSizeOption): void => {
    if (disabled || !sizeOption.available) {
      return;
    }

    onSizeChange(sizeOption.size);
  };

  const handleSizeGuideClick = (): void => {
    if (disabled) {
      return;
    }

    sizeGuideHandler?.();
  };

  /* ==========================================================================
     Visibility Guard
     ========================================================================== */

  if (normalizedSizes.length === 0) {
    return null;
  }

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <section
      className={`product-size-selector ${
        disabled ? "product-size-selector-disabled" : ""
      } ${hasError ? "product-size-selector-invalid" : ""} ${className}`.trim()}
      aria-labelledby={`${generatedId}-title`}
    >
      {/* Header */}
      <div className="product-size-selector-header">
        <div className="product-size-selector-heading">
          <h3
            id={`${generatedId}-title`}
            className="product-size-selector-title"
          >
            {getSizeSectionTitle(product)}

            {required ? (
              <>
                <span className="product-size-required" aria-hidden="true">
                  *
                </span>
                <span className="visually-hidden">Required</span>
              </>
            ) : null}
          </h3>

          {selectedSizeOption ? (
            <span className="product-selected-size-label" aria-live="polite">
              Selected: <strong>{selectedSizeOption.size}</strong>
            </span>
          ) : null}
        </div>

        {shouldShowSizeGuide ? (
          <button
            type="button"
            className="product-size-guide-button"
            disabled={disabled}
            aria-label={`Open size guide for ${product.name}`}
            onClick={handleSizeGuideClick}
          >
            <i className="bi bi-rulers" aria-hidden="true" />
            <span>Size Guide</span>
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Size Options */}
      {hasAvailableSizes ? (
        <div
          className="product-size-options"
          aria-label={`Available sizes for ${product.name}`}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${generatedId}-error` : `${generatedId}-help`
          }
        >
          {normalizedSizes.map((sizeOption, index) => {
            const isSelected =
              normalizedSelectedSize === sizeOption.size.toLowerCase();

            const isUnavailable = !sizeOption.available;
            const isOptionDisabled = disabled || isUnavailable;

            const isLowStock =
              sizeOption.available &&
              typeof sizeOption.stock === "number" &&
              sizeOption.stock > 0 &&
              sizeOption.stock <= LOW_STOCK_THRESHOLD;

            const inputId = `${generatedId}-${createInputIdPart(
              sizeOption.size
            )}-${index}`;

            return (
              <div
                className="product-size-option-wrapper"
                key={`${sizeOption.size}-${index}`}
              >
                <input
                  id={inputId}
                  className="product-size-input visually-hidden"
                  type="radio"
                  name={`${generatedId}-product-size`}
                  value={sizeOption.size}
                  checked={isSelected}
                  disabled={isOptionDisabled}
                  onChange={() => handleSizeChange(sizeOption)}
                />

                <label
                  className={`product-size-option ${
                    isSelected ? "selected" : ""
                  } ${isUnavailable ? "unavailable" : ""} ${
                    isLowStock ? "low-stock" : ""
                  }`.trim()}
                  htmlFor={inputId}
                  title={
                    isUnavailable
                      ? `${sizeOption.size} is unavailable`
                      : `Select size ${sizeOption.size}`
                  }
                >
                  <span className="product-size-value">
                    {sizeOption.size}
                  </span>

                  {isSelected ? (
                    <span
                      className="product-size-selected-icon"
                      aria-hidden="true"
                    >
                      <i className="bi bi-check" />
                    </span>
                  ) : null}

                  {isUnavailable ? (
                    <>
                      <span
                        className="product-size-unavailable-line"
                        aria-hidden="true"
                      />
                      <span className="visually-hidden">Unavailable</span>
                    </>
                  ) : null}
                </label>

                {showStockCount &&
                isLowStock &&
                sizeOption.stock !== undefined ? (
                  <span
                    className="product-size-stock-message"
                    aria-label={`${sizeOption.stock} units remaining for size ${sizeOption.size}`}
                  >
                    {sizeOption.stock} left
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="product-size-empty-state" role="status">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          <span>All sizes are currently unavailable.</span>
        </div>
      )}

      {/* Error or Help Message */}
      {hasError ? (
        <p
          id={`${generatedId}-error`}
          className="product-size-error-message"
          role="alert"
        >
          <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
          <span>{errorMessage}</span>
        </p>
      ) : (
        <p id={`${generatedId}-help`} className="product-size-help-text">
          {selectedSizeOption
            ? `Size ${selectedSizeOption.size} is selected.`
            : required
            ? "Please select an available size before continuing."
            : "You can optionally select an available size."}
        </p>
      )}
    </section>
  );
};

export default ProductSizeSelector;