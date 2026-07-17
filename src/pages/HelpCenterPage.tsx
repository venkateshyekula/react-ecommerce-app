import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type HelpTopicKey =
  | "orders"
  | "returns"
  | "payments"
  | "wallet"
  | "coupons"
  | "account"
  | "delivery";

interface HelpTopic {
  key: HelpTopicKey;
  title: string;
  description: string;
  iconClassName: string;
}

interface HelpQuestion {
  question: string;
  answer: string;
}

const helpTopics: HelpTopic[] = [
  {
    key: "orders",
    title: "Orders",
    description: "Track, cancel, reorder and view order details.",
    iconClassName: "bi bi-box-seam"
  },
  {
    key: "returns",
    title: "Returns & Refunds",
    description: "Return eligibility, refund status and refund timelines.",
    iconClassName: "bi bi-arrow-counterclockwise"
  },
  {
    key: "payments",
    title: "Payments",
    description: "Payment methods, failed payments and payable amount.",
    iconClassName: "bi bi-credit-card"
  },
  {
    key: "wallet",
    title: "Wallet & Rewards",
    description: "Wallet balance, reward points, expiry and savings.",
    iconClassName: "bi bi-wallet2"
  },
  {
    key: "coupons",
    title: "Coupons & Offers",
    description: "Coupon usage, coupon history and offer limits.",
    iconClassName: "bi bi-ticket-perforated"
  },
  {
    key: "account",
    title: "Account & Profile",
    description: "Profile, saved addresses and account security.",
    iconClassName: "bi bi-person-circle"
  },
  {
    key: "delivery",
    title: "Shipping & Delivery",
    description: "Delivery promises, fulfillment and tracking timeline.",
    iconClassName: "bi bi-truck"
  }
];

const helpQuestions: Record<HelpTopicKey, HelpQuestion[]> = {
  orders: [
    {
      question: "How do I track my order?",
      answer:
        "Go to Orders & Returns and open the order card. You can view the delivery promise, fulfillment timeline, tracking events and order status."
    },
    {
      question: "Can I cancel an order?",
      answer:
        "Cancellation is available only for eligible orders. If the order has already moved into later fulfillment stages, cancellation may not be available."
    },
    {
      question: "Can I reorder previously purchased items?",
      answer:
        "Yes. Open Orders & Returns and use the Reorder action. Available products will be added back to your cart."
    }
  ],
  returns: [
    {
      question: "How do I request a return?",
      answer:
        "Open Orders & Returns, find the eligible delivered order and start the return request from the order card."
    },
    {
      question: "Where can I see refund status?",
      answer:
        "Refund status is shown inside the order card and order success details where applicable."
    },
    {
      question: "How are wallet refunds handled?",
      answer:
        "If a refund is processed as wallet credit, it appears in My Wallet as a credit transaction."
    }
  ],
  payments: [
    {
      question: "Which payment methods are supported?",
      answer:
        "ShopEase supports configured checkout payment methods such as card, UPI, cash on delivery, wallet and reward-based adjustments."
    },
    {
      question: "Can wallet and rewards be used together?",
      answer:
        "Yes. Reward points are applied first as a discount. Wallet balance can then be used for the remaining payable amount."
    },
    {
      question: "Why is payment method not required sometimes?",
      answer:
        "If rewards and wallet fully cover the payable amount, no additional payment method is required."
    }
  ],
  wallet: [
    {
      question: "Where can I see wallet balance?",
      answer:
        "Open My Wallet to view wallet balance, credits, debits, expiry alerts and wallet ledger."
    },
    {
      question: "Where can I see reward points?",
      answer:
        "Open Rewards to view available points, earned points, redeemed points and expiry alerts."
    },
    {
      question: "Where can I see total savings?",
      answer:
        "Open My Savings to view coupon savings, reward savings, wallet credits and refund benefits."
    }
  ],
  coupons: [
    {
      question: "Where can I see used coupons?",
      answer:
        "Open Coupon History to view coupon redemptions, order references and total coupon savings."
    },
    {
      question: "Why is a coupon not applicable?",
      answer:
        "A coupon may be expired, inactive, below minimum cart value, user-specific, or already used up to its allowed limit."
    },
    {
      question: "Can coupon usage be tracked?",
      answer:
        "Yes. Coupon redemption history is stored when an order is placed using a valid coupon."
    }
  ],
  account: [
    {
      question: "How do I manage my profile?",
      answer:
        "Open My Profile to view account details, contact information and quick account actions."
    },
    {
      question: "How do I add or edit addresses?",
      answer:
        "Open Address Book to add, edit, delete or set a default delivery address."
    },
    {
      question: "How do I keep my account secure?",
      answer:
        "Keep your login credentials private and log out from shared devices after using your account."
    }
  ],
  delivery: [
    {
      question: "How is delivery promise calculated?",
      answer:
        "Delivery promise is based on pincode, delivery zone, warehouse, seller fulfillment mapping and delivery SLA rules."
    },
    {
      question: "Where can I see delivery timeline?",
      answer:
        "Open the order card to view fulfillment timeline, tracking steps and tracking events."
    },
    {
      question: "Why did my delivery timeline change?",
      answer:
        "Timeline can change when fulfillment status is updated by admin, seller fulfillment changes, or operational events are synced."
    }
  ]
};

const HelpCenterPage = () => {
  const { isAuthenticated, currentUser } = useAuth();

  const [activeTopic, setActiveTopic] = useState<HelpTopicKey>("orders");
  const [searchText, setSearchText] = useState<string>("");

  const activeTopicDetails = helpTopics.find(
    (topic) => topic.key === activeTopic
  );

  const filteredQuestions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const questions = helpQuestions[activeTopic];

    if (!query) {
      return questions;
    }

    return questions.filter((item) =>
      `${item.question} ${item.answer}`.toLowerCase().includes(query)
    );
  }, [activeTopic, searchText]);

  return (
    <main className="help-center-page bg-light">
      <section className="help-center-hero bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="row justify-content-center">
            <div className="col-xl-10">
              <div className="d-flex flex-column flex-lg-row justify-content-between gap-4">
                <div>
                  <p className="text-uppercase text-muted small fw-bold mb-2">
                    ShopEase Support
                  </p>

                  <h4 className="fw-bold mb-2">Help Center</h4>

                  <p className="text-muted mb-0">
                    Get help with orders, returns, refunds, wallet, rewards,
                    coupons, delivery and account settings.
                  </p>

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <Link to="/faqs" className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-question-circle me-2" />
                      View FAQs
                    </Link>

                    <Link
                      to="/contact-support"
                      className="btn btn-outline-secondary btn-sm"
                    >
                      <i className="bi bi-headset me-2" />
                      Contact Support
                    </Link>

                    <Link to="/orders" className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-box-seam me-2" />
                      Orders & Returns
                    </Link>
                  </div>
                </div>

                <div className="help-center-user-card border rounded-4 p-3 bg-light">
                  {isAuthenticated ? (
                    <>
                      <p className="small text-muted mb-1">Signed in as</p>
                      <h6 className="fw-bold mb-1">{currentUser?.name}</h6>
                      <p className="small text-muted mb-3">
                        Use your account pages for order-specific help.
                      </p>

                      <div className="d-flex flex-wrap gap-2">
                        <Link to="/faqs" className="btn btn-sm btn-outline-secondary">
                          <i className="bi bi-question-circle me-2" />
                          Browse FAQs
                        </Link>

                        <Link
                          to="/support-tickets"
                          className="btn btn-sm btn-outline-secondary"
                        >
                          <i className="bi bi-ticket-detailed me-2" />
                          My Tickets
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="small text-muted mb-1">Need faster help?</p>
                      <h6 className="fw-bold mb-2">Login to view your orders</h6>

                      <div className="d-flex flex-wrap gap-2">
                        <Link to="/login" className="btn btn-sm btn-outline-secondary">
                          Login
                        </Link>

                        <Link to="/faqs" className="btn btn-sm btn-outline-secondary">
                          FAQs
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="help-search-card mt-4">
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search text-muted" />
                  </span>

                  <input
                    className="form-control"
                    placeholder="Search help topics like refund, coupon, wallet, delivery..."
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-xl-10">
            <div className="row g-4">
              <aside className="col-lg-4">
                <div className="help-sidebar bg-white">
                  <div className="p-4 border-bottom">
                    <h5 className="fw-bold mb-2">Help Topics</h5>
                    <p className="text-muted small mb-0">
                      Select a topic to find answers.
                    </p>
                  </div>

                  <div className="list-group list-group-flush help-topic-list">
                    {helpTopics.map((topic) => (
                      <button
                        type="button"
                        className={`list-group-item list-group-item-action ${
                          activeTopic === topic.key ? "active" : ""
                        }`}
                        key={topic.key}
                        onClick={() => {
                          setActiveTopic(topic.key);
                          setSearchText("");
                        }}
                      >
                        <span className="help-topic-list-icon">
                          <i className={topic.iconClassName} />
                        </span>

                        <span>
                          <strong>{topic.title}</strong>
                          <small>{topic.description}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="help-contact-card bg-white  p-4 mt-4">
                  <h5 className="fw-bold mb-2">Still need help?</h5>
                  <p className="text-muted small mb-3">
                    Visit FAQs, support, or account pages for order-specific
                    assistance.
                  </p>

                  <div className="d-grid gap-2">
                    <Link to="/faqs" className="btn btn-outline-secondary">
                      <i className="bi bi-question-circle me-2" />
                      View FAQs
                    </Link>

                    <Link to="/orders" className="btn btn-outline-secondary">
                      <i className="bi bi-box-seam me-2" />
                      Orders & Returns
                    </Link>

                    <Link to="/contact-support" className="btn btn-secondary">
                      <i className="bi bi-headset me-2" />
                      Contact Support
                    </Link>
                  </div>
                </div>
              </aside>

              <section className="col-lg-8">
                <div className="help-content-card bg-white">
                  <div className="p-4 border-bottom">
                    <div className="d-flex align-items-start gap-3">
                      <span className="help-content-icon bg-light border">
                        <i className={activeTopicDetails?.iconClassName} />
                      </span>

                      <div>
                        <h4 className="fw-bold mb-1">
                          {activeTopicDetails?.title}
                        </h4>
                        <p className="text-muted mb-0">
                          {activeTopicDetails?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {filteredQuestions.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="bi bi-search fs-1 text-muted d-block mb-3" />
                        <h5 className="fw-bold">No help articles found</h5>
                        <p className="text-muted mb-0">
                          Try another keyword or select a different help topic.
                        </p>
                      </div>
                    ) : (
                      <div
                        className="accordion help-accordion"
                        id="helpCenterAccordion"
                      >
                        {filteredQuestions.map((item, index) => {
                          const collapseId = `help-${activeTopic}-${index}`;
                          const headingId = `help-heading-${activeTopic}-${index}`;

                          return (
                            <div
                              className="accordion-item border mb-3 overflow-hidden"
                              key={item.question}
                            >
                              <h2 className="accordion-header" id={headingId}>
                                <button
                                  className={`accordion-button fw-bold ${
                                    index === 0 ? "" : "collapsed"
                                  }`}
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target={`#${collapseId}`}
                                  aria-expanded={index === 0}
                                  aria-controls={collapseId}
                                >
                                  {item.question}
                                </button>
                              </h2>

                              <div
                                id={collapseId}
                                className={`accordion-collapse collapse ${
                                  index === 0 ? "show" : ""
                                }`}
                                aria-labelledby={headingId}
                                data-bs-parent="#helpCenterAccordion"
                              >
                                <div className="accordion-body text-muted">
                                  {item.answer}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-3 col-sm-6">
                    <Link
                      to="/orders"
                      className="help-quick-link-card bg-white border rounded-4 p-3 text-decoration-none"
                    >
                      <i className="bi bi-box-seam" />
                      <strong>Track Orders</strong>
                      <span>View order timeline</span>
                    </Link>
                  </div>

                  <div className="col-md-3 col-sm-6">
                    <Link
                      to="/wallet"
                      className="help-quick-link-card bg-white border rounded-4 p-3 text-decoration-none"
                    >
                      <i className="bi bi-wallet2" />
                      <strong>Wallet</strong>
                      <span>Check credits</span>
                    </Link>
                  </div>

                  <div className="col-md-3 col-sm-6">
                    <Link
                      to="/coupon-history"
                      className="help-quick-link-card bg-white border rounded-4 p-3 text-decoration-none"
                    >
                      <i className="bi bi-ticket-perforated" />
                      <strong>Coupons</strong>
                      <span>View usage</span>
                    </Link>
                  </div>

                  <div className="col-md-3 col-sm-6">
                    <Link
                      to="/faqs"
                      className="help-quick-link-card bg-white border rounded-4 p-3 text-decoration-none"
                    >
                      <i className="bi bi-question-circle" />
                      <strong>FAQs</strong>
                      <span>Browse all topics</span>
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HelpCenterPage;