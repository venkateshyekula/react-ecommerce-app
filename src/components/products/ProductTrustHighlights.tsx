interface TrustHighlight {
  title: string;
  description: string;
  icon: string;
}

const trustHighlights: TrustHighlight[] = [
  {
    title: "Genuine Products",
    description: "Quality checked products from trusted sellers.",
    icon: "bi bi-patch-check-fill"
  },
  {
    title: "Secure Payments",
    description: "Multiple checkout options with secure order flow.",
    icon: "bi bi-shield-lock"
  },
  {
    title: "Easy Support",
    description: "Raise questions, tickets, or order issues anytime.",
    icon: "bi bi-headset"
  }
];

const ProductTrustHighlights = () => {
  return (
    <section className="pdp-trust-highlights">
      {trustHighlights.map((highlight) => (
        <div className="pdp-trust-card" key={highlight.title}>
          <span className="pdp-trust-icon">
            <i className={highlight.icon} />
          </span>

          <div>
            <strong>{highlight.title}</strong>
            <p>{highlight.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default ProductTrustHighlights;