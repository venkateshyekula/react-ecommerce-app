import { useMemo } from "react";

import type { Product } from "../../types/product";

/* ==========================================================================
   Types
   ========================================================================== */

interface ProductSellerSummaryProps {
  product: Product;
}

interface SellerMetadataItem {
  id: string;
  icon: string;
  label: string;
  value: string;
}

/* ==========================================================================
   Helpers
   ========================================================================== */

const hasText = (value: string | undefined | null): value is string => {
  return Boolean(value?.trim());
};

const formatSellerSince = (value: string | undefined): string | null => {
  if (!hasText(value)) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value.trim();
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric"
  }).format(parsedDate);
};

const formatSellerRatingCount = (value: number): string => {
  return new Intl.NumberFormat("en-IN").format(value);
};

const formatSellerReturnRate = (value: number): string => {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
};

/* ==========================================================================
   Product Seller Summary Component
   ========================================================================== */

const ProductSellerSummary = ({ product }: ProductSellerSummaryProps) => {
  const sellerName = hasText(product.sellerName)
    ? product.sellerName.trim()
    : "ShopEase Marketplace Seller";

  const hasSellerRating =
    typeof product.sellerRating === "number" &&
    Number.isFinite(product.sellerRating) &&
    product.sellerRating >= 0 &&
    product.sellerRating <= 5;

  const hasSellerRatingCount =
    typeof product.sellerRatingCount === "number" &&
    Number.isFinite(product.sellerRatingCount) &&
    product.sellerRatingCount >= 0;

  const hasSellerReturnRate =
    typeof product.sellerReturnRate === "number" &&
    Number.isFinite(product.sellerReturnRate) &&
    product.sellerReturnRate >= 0;

  const formattedSellerSince = formatSellerSince(product.sellerSince);

  const sellerMetadata = useMemo<SellerMetadataItem[]>(() => {
    const items: SellerMetadataItem[] = [];

    if (formattedSellerSince) {
      items.push({
        id: "seller-since",
        icon: "bi bi-calendar-check",
        label: "Selling since",
        value: formattedSellerSince
      });
    }

    if (hasSellerReturnRate) {
      items.push({
        id: "seller-return-rate",
        icon: "bi bi-arrow-counterclockwise",
        label: "Seller return rate",
        value: formatSellerReturnRate(product.sellerReturnRate as number)
      });
    }

    if (hasText(product.sellerAddress)) {
      items.push({
        id: "seller-address",
        icon: "bi bi-geo-alt",
        label: "Seller address",
        value: product.sellerAddress.trim()
      });
    }

    if (hasText(product.sellerGstin)) {
      items.push({
        id: "seller-gstin",
        icon: "bi bi-receipt",
        label: "GSTIN",
        value: product.sellerGstin.trim().toUpperCase()
      });
    }

    if (hasText(product.sellerPan)) {
      items.push({
        id: "seller-pan",
        icon: "bi bi-card-text",
        label: "PAN",
        value: product.sellerPan.trim().toUpperCase()
      });
    }

    return items;
  }, [
    formattedSellerSince,
    hasSellerReturnRate,
    product.sellerAddress,
    product.sellerGstin,
    product.sellerPan,
    product.sellerReturnRate
  ]);

  const titleId = `product-seller-title-${product.id ?? "default"}`;

  return (
    <section className="product-seller-summary" aria-labelledby={titleId}>
      <div className="product-seller-header">
        <div className="product-seller-identity">
          <span className="product-seller-icon">
            <i className="bi bi-shop" aria-hidden="true" />
          </span>

          <div>
            <p className="product-seller-label">Seller</p>

            <div className="product-seller-name-row">
              <h3 id={titleId} className="product-seller-name">
                {sellerName}
              </h3>

              {product.sellerVerified ? (
                <span
                  className="product-seller-verified"
                  title="Verified marketplace seller"
                >
                  <i
                    className="bi bi-patch-check-fill"
                    aria-hidden="true"
                  />
                  <span>Verified</span>
                </span>
              ) : null}
            </div>

            <p className="product-seller-subtitle">
              Product listed through the ShopEase marketplace.
            </p>
          </div>
        </div>

        {hasSellerRating ? (
          <div
            className="product-seller-rating-summary"
            aria-label={`Seller rating ${product.sellerRating?.toFixed(
              1
            )} out of 5${
              hasSellerRatingCount
                ? ` from ${formatSellerRatingCount(
                    product.sellerRatingCount as number
                  )} ratings`
                : ""
            }`}
          >
            <span className="product-seller-rating">
              {product.sellerRating?.toFixed(1)}
              <i className="bi bi-star-fill" aria-hidden="true" />
            </span>

            {hasSellerRatingCount ? (
              <span className="product-seller-rating-count">
                {formatSellerRatingCount(
                  product.sellerRatingCount as number
                )}{" "}
                ratings
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {sellerMetadata.length > 0 ? (
        <dl className="product-seller-metadata">
          {sellerMetadata.map((item) => (
            <div className="product-seller-metadata-item" key={item.id}>
              <span className="product-seller-metadata-icon">
                <i className={item.icon} aria-hidden="true" />
              </span>

              <div>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="product-seller-assurance">
        <i className="bi bi-shield-check" aria-hidden="true" />
        <p>
          Payments and order processing are completed through ShopEase. Product
          availability and fulfilment depend on the seller and assigned warehouse.
        </p>
      </div>
    </section>
  );
};

export default ProductSellerSummary;