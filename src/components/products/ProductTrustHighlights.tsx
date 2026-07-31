import { useMemo } from "react";

import type { Product } from "../../types/product";

/* ==========================================================================
   Types
   ========================================================================== */

interface ProductTrustHighlightsProps {
  product: Product;
}

interface TrustHighlight {
  id: string;
  title: string;
  description: string;
  icon: string;
  variant: "primary" | "success" | "warning" | "info";
}

/* ==========================================================================
   Helpers
   ========================================================================== */

const isPositiveInteger = (value: number | undefined): value is number => {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
};

const getReturnPolicyDescription = (
  returnPeriodDays: number,
  exchangeAvailable: boolean | undefined
): string => {
  const returnText = `${returnPeriodDays}-day return window`;

  if (exchangeAvailable === true) {
    return `${returnText} with exchange support, subject to the applicable return policy.`;
  }

  return `${returnText}, subject to the applicable return policy.`;
};

const getDeliveryDescription = (
  estimatedDeliveryDays: number | undefined,
  freeDelivery: boolean | undefined
): string => {
  const descriptions: string[] = [];

  if (isPositiveInteger(estimatedDeliveryDays)) {
    descriptions.push(
      `Estimated delivery in ${estimatedDeliveryDays} ${
        estimatedDeliveryDays === 1 ? "day" : "days"
      }`
    );
  }

  if (freeDelivery === true) {
    descriptions.push("free delivery available");
  } else if (freeDelivery === false) {
    descriptions.push("delivery charges may apply");
  }

  if (descriptions.length === 0) {
    return "Delivery availability and charges are confirmed using the delivery pincode.";
  }

  return `${descriptions.join(
    " with "
  )}. Final availability is confirmed using the delivery pincode.`;
};

/* ==========================================================================
   Product Trust Highlights
   ========================================================================== */

const ProductTrustHighlights = ({
  product
}: ProductTrustHighlightsProps) => {
  const trustHighlights = useMemo<TrustHighlight[]>(() => {
    const highlights: TrustHighlight[] = [];

    /*
     * Product-specific verification is shown only when
     * explicitly available in product data.
     */
    if (product.qualityVerified === true) {
      highlights.push({
        id: "quality-verified",
        title: "Quality Verified",
        description:
          "This product is marked as quality verified in the ShopEase catalog.",
        icon: "bi bi-patch-check-fill",
        variant: "success"
      });
    }

    /*
     * Seller verification is displayed only when the
     * sellerVerified field is explicitly true.
     */
    if (product.sellerVerified === true) {
      const sellerDisplayName =
        product.sellerName?.trim() || "This seller";

      highlights.push({
        id: "verified-seller",
        title: "Verified Marketplace Seller",
        description: `${sellerDisplayName} is marked as a verified seller on ShopEase.`,
        icon: "bi bi-shop-window",
        variant: "primary"
      });
    }

    /*
     * Return and exchange information is displayed only
     * when the product contains a real return period.
     */
    const returnPeriodDays = product.deliveryInformation?.returnPeriodDays;

    if (isPositiveInteger(returnPeriodDays)) {
      highlights.push({
        id: "return-policy",
        title: `${returnPeriodDays}-Day Returns`,
        description: getReturnPolicyDescription(
          returnPeriodDays,
          product.deliveryInformation?.exchangeAvailable
        ),
        icon: "bi bi-arrow-counterclockwise",
        variant: "info"
      });
    }

    /*
     * A non-returnable indication is rendered only when
     * the return period is explicitly set to zero.
     */
    if (product.deliveryInformation?.returnPeriodDays === 0) {
      highlights.push({
        id: "non-returnable",
        title: "Non-Returnable Product",
        description:
          "This product is marked as non-returnable. Review the applicable policy before placing the order.",
        icon: "bi bi-exclamation-circle",
        variant: "warning"
      });
    }

    const hasDeliveryInformation =
      isPositiveInteger(
        product.deliveryInformation?.estimatedDeliveryDays
      ) || typeof product.deliveryInformation?.freeDelivery === "boolean";

    if (hasDeliveryInformation) {
      highlights.push({
        id: "delivery",
        title:
          product.deliveryInformation?.freeDelivery === true
            ? "Free Delivery"
            : "Delivery Information",
        description: getDeliveryDescription(
          product.deliveryInformation?.estimatedDeliveryDays,
          product.deliveryInformation?.freeDelivery
        ),
        icon: "bi bi-truck",
        variant: "primary"
      });
    }

    /*
     * Secure checkout and customer support are
     * ShopEase platform features rather than unsupported
     * product-specific claims.
     */
    highlights.push({
      id: "secure-checkout",
      title: "Secure Checkout",
      description:
        "Payment and order processing are completed through the ShopEase checkout flow.",
      icon: "bi bi-shield-lock",
      variant: "success"
    });

    highlights.push({
      id: "customer-support",
      title: "Customer Support",
      description:
        "Customers can raise product questions and order-related support tickets through ShopEase.",
      icon: "bi bi-headset",
      variant: "info"
    });

    return highlights;
  }, [
    product.deliveryInformation,
    product.qualityVerified,
    product.sellerName,
    product.sellerVerified
  ]);

  const titleId = `product-trust-title-${product.id ?? "default"}`;

  return (
    <section className="product-trust-highlights" aria-labelledby={titleId}>
      <div className="product-trust-header">
        <div>
          <h3 id={titleId} className="product-panel-title">
            <i className="bi bi-shield-check me-2" aria-hidden="true" />
            Shop with Confidence
          </h3>

          <p className="product-trust-subtitle">
            Product, seller, delivery, and marketplace assurances available for
            this item.
          </p>
        </div>

        <span className="product-trust-shield" aria-hidden="true">
          <i className="bi bi-shield-check" />
        </span>
      </div>

      <div className="product-trust-grid">
        {trustHighlights.map((highlight) => (
          <article
            key={highlight.id}
            className={`product-trust-item product-trust-item-${highlight.variant}`}
          >
            <span
              className={`product-trust-icon product-trust-icon-${highlight.variant}`}
            >
              <i className={highlight.icon} aria-hidden="true" />
            </span>

            <div className="product-trust-content">
              <h4>{highlight.title}</h4>
              <p>{highlight.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="product-trust-policy-note">
        <i className="bi bi-info-circle" aria-hidden="true" />
        <p>
          Delivery, return, exchange, and payment availability may depend on
          the delivery location, product category, seller, and order status.
        </p>
      </div>
    </section>
  );
};

export default ProductTrustHighlights;