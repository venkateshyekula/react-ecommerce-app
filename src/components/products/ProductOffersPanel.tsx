import { useEffect, useMemo, useRef, useState } from "react";

import type {
  Product,
  ProductOffer,
  ProductOfferType
} from "../../types/product";

import {
  formatCurrency,
  getDiscountedPrice
} from "../../utils/currencyFormatter";

/* ==========================================================================
   Types
   ========================================================================== */

interface ProductOffersPanelProps {
  product: Product;
}

interface DisplayOffer {
  id: string;
  title: string;
  description: string;
  offerType: ProductOfferType;
  icon: string;
  terms?: string;
  code?: string;
  minimumSpend?: number;
  maximumDiscount?: number;
  isCalculatedProductDiscount?: boolean;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const COPY_SUCCESS_DURATION = 2000;

/* ==========================================================================
   Helpers
   ========================================================================== */

const getOfferIcon = (offerType: ProductOfferType): string => {
  switch (offerType) {
    case "BANK":
      return "bi bi-credit-card";

    case "CASHBACK":
      return "bi bi-cash-coin";

    case "COUPON":
      return "bi bi-ticket-perforated";

    case "EMI":
      return "bi bi-calendar2-check";

    case "BEST_PRICE":
      return "bi bi-tags";

    case "OTHER":
    default:
      return "bi bi-gift";
  }
};

/** Safe check for missing or empty offer fields */
const hasValidOfferContent = (offer: ProductOffer): boolean => {
  return Boolean(
    offer.id?.trim() &&
      offer.title?.trim() &&
      offer.description?.trim()
  );
};

const normalizeOffer = (offer: ProductOffer): DisplayOffer => {
  return {
    id: offer.id.trim(),
    title: offer.title.trim(),
    description: offer.description.trim(),
    offerType: offer.offerType,
    icon: getOfferIcon(offer.offerType),
    terms: offer.terms?.trim() || undefined,
    code: offer.code?.trim() || undefined,
    minimumSpend: offer.minimumSpend,
    maximumDiscount: offer.maximumDiscount
  };
};

const buildCalculatedDiscountOffer = (
  product: Product
): DisplayOffer | null => {
  if (
    !Number.isFinite(product.price) ||
    product.price <= 0 ||
    !Number.isFinite(product.discount) ||
    (product.discount ?? 0) <= 0
  ) {
    return null;
  }

  const discountedPrice = getDiscountedPrice(
    product.price,
    product.discount!
  );

  const savedAmount = Math.max(0, product.price - discountedPrice);

  if (savedAmount <= 0) {
    return null;
  }

  return {
    id: `${product.id}-calculated-product-discount`,
    title: "Best Price",
    description: `Save ${formatCurrency(
      savedAmount
    )} with the current ${product.discount}% product discount.`,
    offerType: "BEST_PRICE",
    icon: getOfferIcon("BEST_PRICE"),
    isCalculatedProductDiscount: true
  };
};

/* ==========================================================================
   Product Offers Panel
   ========================================================================== */

const ProductOffersPanel = ({ product }: ProductOffersPanelProps) => {
  const copyResetTimerRef = useRef<number | null>(null);

  const [expandedOfferIds, setExpandedOfferIds] = useState<Set<string>>(
    () => new Set<string>()
  );

  const [copiedOfferId, setCopiedOfferId] = useState<string>("");

  /* ==========================================================================
     Derived Offers
     ========================================================================== */

  const displayOffers = useMemo<DisplayOffer[]>(() => {
    const configuredOffers = (product.offers ?? [])
      .filter(hasValidOfferContent)
      .map(normalizeOffer);

    const calculatedDiscountOffer = buildCalculatedDiscountOffer(product);

    if (!calculatedDiscountOffer) {
      return configuredOffers;
    }

    const hasConfiguredBestPrice = configuredOffers.some(
      (offer) => offer.offerType === "BEST_PRICE"
    );

    if (hasConfiguredBestPrice) {
      return configuredOffers;
    }

    return [calculatedDiscountOffer, ...configuredOffers];
  }, [product]); // 👈 Satisfies ESLint clean dependency check

  /* ==========================================================================
     Reset When Product Changes
     ========================================================================== */

  useEffect(() => {
    setExpandedOfferIds(new Set<string>());
    setCopiedOfferId("");

    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = null;
    }
  }, [product.id]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  /* ==========================================================================
     Handlers
     ========================================================================== */

  const toggleOfferTerms = (offerId: string): void => {
    setExpandedOfferIds((currentExpandedIds) => {
      const updatedExpandedIds = new Set(currentExpandedIds);

      if (updatedExpandedIds.has(offerId)) {
        updatedExpandedIds.delete(offerId);
      } else {
        updatedExpandedIds.add(offerId);
      }

      return updatedExpandedIds;
    });
  };

  const handleCopyOfferCode = async (offer: DisplayOffer): Promise<void> => {
    if (!offer.code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(offer.code);

      setCopiedOfferId(offer.id);

      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }

      copyResetTimerRef.current = window.setTimeout(() => {
        setCopiedOfferId((currentCopiedOfferId) =>
          currentCopiedOfferId === offer.id ? "" : currentCopiedOfferId
        );

        copyResetTimerRef.current = null;
      }, COPY_SUCCESS_DURATION);
    } catch {
      setCopiedOfferId("");
    }
  };

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <section
      className="product-offers-content"
      aria-labelledby={`product-offers-title-${product.id}`}
    >
      <div className="product-offers-header">
        <div>
          <h3
            id={`product-offers-title-${product.id}`}
            className="product-panel-title"
          >
            <i className="bi bi-tags me-2 product-panel-icon" aria-hidden="true" />
            Best Offers
          </h3>

          <p className="product-offers-subtitle">
            Available product discounts and marketplace offers.
          </p>
        </div>

        {displayOffers.length > 0 ? (
          <span className="product-offers-count">
            {displayOffers.length}{" "}
            {displayOffers.length === 1 ? "offer" : "offers"}
          </span>
        ) : null}
      </div>

      {displayOffers.length === 0 ? (
        <div className="product-offers-empty">
          <span className="product-offers-empty-icon">
            <i className="bi bi-tag" aria-hidden="true" />
          </span>

          <div>
            <strong>No additional offers available</strong>
            <p>
              The displayed selling price is the current price for this
              product.
            </p>
          </div>
        </div>
      ) : (
        <div className="product-offer-list">
          {displayOffers.map((offer) => {
            const isTermsExpanded = expandedOfferIds.has(offer.id);

            const hasAdditionalConditions =
              offer.minimumSpend !== undefined ||
              offer.maximumDiscount !== undefined;

            const isCodeCopied = copiedOfferId === offer.id;

            return (
              <article className="product-offer-item" key={offer.id}>
                <span className="product-panel-icon product-offer-icon">
                  <i className={offer.icon} aria-hidden="true" />
                </span>

                <div className="product-offer-content">
                  <div className="product-offer-title-row">
                    <strong className="product-offer-title">
                      {offer.title}
                    </strong>

                    {offer.isCalculatedProductDiscount ? (
                      <span className="product-offer-applied-badge">
                        Applied
                      </span>
                    ) : null}
                  </div>

                  <p className="product-offer-description">
                    {offer.description}
                  </p>

                  {offer.code ? (
                    <div className="product-offer-code-row">
                      <span className="product-offer-code-label">
                        Use code
                      </span>

                      <code className="product-offer-code">{offer.code}</code>

                      <button
                        type="button"
                        className="product-offer-copy-button"
                        aria-label={`Copy offer code ${offer.code}`}
                        onClick={() => {
                          void handleCopyOfferCode(offer);
                        }}
                      >
                        <i
                          className={
                            isCodeCopied ? "bi bi-check2" : "bi bi-copy"
                          }
                          aria-hidden="true"
                        />

                        <span>{isCodeCopied ? "Copied" : "Copy"}</span>
                      </button>

                      <span className="visually-hidden" aria-live="polite">
                        {isCodeCopied
                          ? `Offer code ${offer.code} copied`
                          : ""}
                      </span>
                    </div>
                  ) : null}

                  {hasAdditionalConditions ? (
                    <ul className="product-offer-conditions">
                      {offer.minimumSpend !== undefined ? (
                        <li>
                          Minimum spend:{" "}
                          <strong>
                            {formatCurrency(offer.minimumSpend)}
                          </strong>
                        </li>
                      ) : null}

                      {offer.maximumDiscount !== undefined ? (
                        <li>
                          Maximum discount:{" "}
                          <strong>
                            {formatCurrency(offer.maximumDiscount)}
                          </strong>
                        </li>
                      ) : null}
                    </ul>
                  ) : null}

                  {offer.terms ? (
                    <div className="product-offer-terms-wrapper">
                      <button
                        type="button"
                        className="product-offer-terms-button"
                        aria-expanded={isTermsExpanded}
                        aria-controls={`product-offer-terms-${offer.id}`}
                        onClick={() => toggleOfferTerms(offer.id)}
                      >
                        <span>
                          {isTermsExpanded
                            ? "Hide terms"
                            : "Terms and conditions"}
                        </span>

                        <i
                          className={
                            isTermsExpanded
                              ? "bi bi-chevron-up"
                              : "bi bi-chevron-down"
                          }
                          aria-hidden="true"
                        />
                      </button>

                      {isTermsExpanded ? (
                        <p
                          id={`product-offer-terms-${offer.id}`}
                          className="product-offer-terms"
                        >
                          {offer.terms}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProductOffersPanel;