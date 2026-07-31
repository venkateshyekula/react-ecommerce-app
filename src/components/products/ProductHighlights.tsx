import { useMemo } from "react";

import type { Product } from "../../types/product";

import {
  formatCurrency,
  getDiscountedPrice
} from "../../utils/currencyFormatter";

/* ==========================================================================
   Types
   ========================================================================== */

interface ProductHighlightsProps {
  product: Product;
}

type ProductHighlightVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary";

interface ProductHighlightItem {
  id: string;
  icon: string;
  label: string;
  value: string;
  description?: string;
  variant: ProductHighlightVariant;
}

/* ==========================================================================
   Helpers
   ========================================================================== */

const hasText = (value: string | undefined | null): value is string => {
  return Boolean(value?.trim());
};

const isPositiveNumber = (value: number | undefined | null): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
};

const getStockHighlight = (stock: number): ProductHighlightItem => {
  if (stock <= 0) {
    return {
      id: "highlight-stock-out",
      icon: "bi bi-x-circle",
      label: "Availability",
      value: "Out of Stock",
      description: "This product is currently unavailable.",
      variant: "danger"
    };
  }

  if (stock <= 5) {
    return {
      id: "highlight-stock-low",
      icon: "bi bi-exclamation-triangle",
      label: "Availability",
      value: `Only ${stock} Left`,
      description: "Limited stock is currently available.",
      variant: "warning"
    };
  }

  return {
    id: "highlight-stock-available",
    icon: "bi bi-check-circle",
    label: "Availability",
    value: "In Stock",
    description: `${stock} units are currently available.`,
    variant: "success"
  };
};

const getReturnPolicyHighlight = (
  returnPeriodDays: number,
  exchangeAvailable: boolean | undefined
): ProductHighlightItem => {
  const exchangeDescription =
    exchangeAvailable === true
      ? "Returns and exchanges are subject to the applicable policy."
      : "Returns are subject to the applicable policy.";

  return {
    id: "highlight-return-policy",
    icon: "bi bi-arrow-counterclockwise",
    label: "Returns",
    value: `${returnPeriodDays}-Day Return`,
    description: exchangeDescription,
    variant: "info"
  };
};

const getNonReturnableHighlight = (): ProductHighlightItem => {
  return {
    id: "highlight-non-returnable",
    icon: "bi bi-slash-circle",
    label: "Returns",
    value: "Non-Returnable",
    description:
      "This product is marked as non-returnable under the applicable category policy.",
    variant: "warning"
  };
};

/* ==========================================================================
   Product Highlights Component
   ========================================================================== */

const ProductHighlights = ({ product }: ProductHighlightsProps) => {
  const titleId = `product-highlights-title-${product.id ?? "default"}`;

  const highlights = useMemo<ProductHighlightItem[]>(() => {
    const items: ProductHighlightItem[] = [];

    const safeDiscount = product.discount ?? 0;
    const discountedPrice = getDiscountedPrice(product.price, safeDiscount);
    const savedAmount = Math.max(0, product.price - discountedPrice);

    /* ----------------------------------------------------------------------
       Quality Verification
       ---------------------------------------------------------------------- */
    if (product.qualityVerified === true) {
      items.push({
        id: "highlight-quality-verified",
        icon: "bi bi-patch-check-fill",
        label: "Product Quality",
        value: "Quality Verified",
        description:
          "This product is marked as quality verified in the ShopEase catalog.",
        variant: "success"
      });
    }

    /* ----------------------------------------------------------------------
       Savings
       ---------------------------------------------------------------------- */
    if (isPositiveNumber(product.discount) && savedAmount > 0) {
      items.push({
        id: "highlight-savings",
        icon: "bi bi-piggy-bank",
        label: "You Save",
        value: formatCurrency(savedAmount),
        description: `${product.discount}% discount is applied to the listed product price.`,
        variant: "primary"
      });
    }

    /* ----------------------------------------------------------------------
       Stock Availability
       ---------------------------------------------------------------------- */
    items.push(getStockHighlight(product.stock));

    /* ----------------------------------------------------------------------
       Return and Exchange Policy
       ---------------------------------------------------------------------- */
    const returnPeriodDays = product.deliveryInformation?.returnPeriodDays;

    if (
      typeof returnPeriodDays === "number" &&
      Number.isFinite(returnPeriodDays)
    ) {
      if (returnPeriodDays > 0) {
        items.push(
          getReturnPolicyHighlight(
            returnPeriodDays,
            product.deliveryInformation?.exchangeAvailable
          )
        );
      } else if (returnPeriodDays === 0) {
        items.push(getNonReturnableHighlight());
      }
    }

    /* ----------------------------------------------------------------------
       Exchange Eligibility
       ---------------------------------------------------------------------- */
    if (
      product.deliveryInformation?.exchangeAvailable === true &&
      isPositiveNumber(returnPeriodDays)
    ) {
      items.push({
        id: "highlight-exchange",
        icon: "bi bi-arrow-left-right",
        label: "Exchange",
        value: "Exchange Available",
        description: `Exchange requests are supported within the ${returnPeriodDays}-day policy window.`,
        variant: "info"
      });
    }

    /* ----------------------------------------------------------------------
       Delivery Information
       ---------------------------------------------------------------------- */
    if (product.deliveryInformation?.freeDelivery === true) {
      items.push({
        id: "highlight-free-delivery",
        icon: "bi bi-truck",
        label: "Delivery",
        value: "Free Delivery",
        description:
          "Free delivery is available for this product. Final availability is confirmed using the delivery pincode.",
        variant: "primary"
      });
    }

    const estimatedDeliveryDays =
      product.deliveryInformation?.estimatedDeliveryDays;

    if (isPositiveNumber(estimatedDeliveryDays)) {
      items.push({
        id: "highlight-delivery-estimate",
        icon: "bi bi-calendar-check",
        label: "Delivery Estimate",
        value: `${estimatedDeliveryDays} ${
          estimatedDeliveryDays === 1 ? "Day" : "Days"
        }`,
        description:
          "The final delivery date is confirmed after checking the delivery pincode.",
        variant: "primary"
      });
    }

    /* ----------------------------------------------------------------------
       Cash on Delivery
       ---------------------------------------------------------------------- */
    if (product.deliveryInformation?.cashOnDeliveryAvailable === true) {
      items.push({
        id: "highlight-cod-available",
        icon: "bi bi-cash-stack",
        label: "Payment",
        value: "Cash on Delivery",
        description:
          "Cash on Delivery is available for supported delivery locations.",
        variant: "success"
      });
    } else if (
      product.deliveryInformation?.cashOnDeliveryAvailable === false
    ) {
      items.push({
        id: "highlight-cod-unavailable",
        icon: "bi bi-credit-card",
        label: "Payment",
        value: "Prepaid Payment",
        description:
          "Cash on Delivery is not available for this product or delivery configuration.",
        variant: "secondary"
      });
    }

    /* ----------------------------------------------------------------------
       Warranty
       ---------------------------------------------------------------------- */
    if (hasText(product.warranty)) {
      items.push({
        id: "highlight-warranty",
        icon: "bi bi-award",
        label: "Warranty",
        value: product.warranty.trim(),
        description:
          "Warranty coverage is subject to the seller or manufacturer terms.",
        variant: "primary"
      });
    }

    /* ----------------------------------------------------------------------
       Tax-Inclusive Price
       ---------------------------------------------------------------------- */
    if (product.isTaxInclusive === true) {
      items.push({
        id: "highlight-tax-inclusive",
        icon: "bi bi-receipt",
        label: "Price",
        value: "Tax Inclusive",
        description: "The displayed product price includes applicable taxes.",
        variant: "secondary"
      });
    }

    return items;
  }, [
    product.deliveryInformation,
    product.discount,
    product.isTaxInclusive,
    product.price,
    product.qualityVerified,
    product.stock,
    product.warranty
  ]);

  if (highlights.length === 0) {
    return null;
  }

  return (
    <section className="product-key-highlights" aria-labelledby={titleId}>
      <div className="product-highlights-header">
        <div>
          <h3 id={titleId} className="product-highlights-title">
            <i className="bi bi-stars me-2" aria-hidden="true" />
            Product Highlights
          </h3>

          <p className="product-highlights-subtitle">
            Important product, price, delivery, and policy information.
          </p>
        </div>

        <span
          className="product-highlights-count"
          aria-label={`${highlights.length} product highlights`}
        >
          {highlights.length}
        </span>
      </div>

      <div className="product-highlights-grid">
        {highlights.map((highlight) => (
          <article
            key={highlight.id}
            className={`product-highlight-box rounded-3 product-highlight-${highlight.variant}`}
          >
            <span
              className={`product-highlight-icon product-highlight-icon-${highlight.variant}`}
            >
              <i className={highlight.icon} aria-hidden="true" />
            </span>

            <div className="product-highlight-content">
              <span className="highlight-label">{highlight.label}</span>

              <strong className="product-highlight-value">
                {highlight.value}
              </strong>

              {highlight.description ? (
                <p className="product-highlight-description">
                  {highlight.description}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ProductHighlights;