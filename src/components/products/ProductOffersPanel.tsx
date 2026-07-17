import type { Product } from "../../types/product";
import { formatCurrency, getDiscountedPrice } from "../../utils/currencyFormatter";

interface ProductOffersPanelProps {
  product: Product;
}

interface ProductOffer {
  title: string;
  description: string;
  icon: string;
}

const ProductOffersPanel = ({ product }: ProductOffersPanelProps) => {
  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const savedAmount = product.price - discountedPrice;

  const offers: ProductOffer[] = [
    {
      title: "Best Price",
      description:
        product.discount > 0
          ? `Save ${formatCurrency(savedAmount)} with ${product.discount}% product discount.`
          : "This product is already listed at a competitive price.",
      icon: "bi bi-tags"
    },
    {
      title: "Bank Offer",
      description: "Extra savings may be available with selected bank cards.",
      icon: "bi bi-credit-card"
    },
    {
      title: "Partner Coupon",
      description: "Apply eligible coupons during checkout for additional value.",
      icon: "bi bi-ticket-perforated"
    }
  ];

  return (
    <section className="pdp-offers-panel">
      <h6 className="pdp-section-title mb-3">
        <i className="bi bi-percent me-2 text-primary" />
        Available Offers
      </h6>

      <div className="pdp-offer-list">
        {offers.map((offer) => (
          <div className="pdp-offer-card" key={offer.title}>
            <span className="pdp-offer-icon">
              <i className={offer.icon} />
            </span>

            <div>
              <strong>{offer.title}</strong>
              <p>{offer.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductOffersPanel;