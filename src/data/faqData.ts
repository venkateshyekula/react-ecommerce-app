export interface FaqQuickLink {
  label: string;
  path: string;
}

export interface FaqQuestion {
  question: string;
  answer?: string;
}

export interface FaqSection {
  id: string;
  title: string;
  description?: string;
  quickLinks?: FaqQuickLink[];
  questions: FaqQuestion[];
}

export const faqSections: FaqSection[] = [
  {
    id: "topQueries",
    title: "Top Queries",
    description: "Common questions customers ask about ShopEase.",
    quickLinks: [
      {
        label: "Track orders",
        path: "/orders"
      }
    ],
    questions: [
      {
        question: "How do I track my order?",
        answer:
          "Go to Orders & Returns and open the order card. You can view delivery promise, fulfillment status, tracking events and order timeline."
      },
      {
        question: "How do I cancel an order?",
        answer:
          "Open Orders & Returns and choose Cancel Order if the order is still eligible for cancellation."
      },
      {
        question: "How do I create a return request?",
        answer:
          "Open Orders & Returns, select the delivered order and use the return request option if the item is eligible."
      },
      {
        question: "When will I receive my refund?",
        answer:
          "Refund processing depends on the refund workflow. Completed refunds can be viewed in the order details and wallet/refund sections where applicable."
      },
      {
        question: "How do I redeem reward points?",
        answer:
          "Reward points can be redeemed during checkout if you meet the minimum redemption criteria and have an active reward rule."
      }
    ]
  },
  {
    id: "terms",
    title: "Terms and Conditions",
    description: "Read platform usage rules and customer responsibilities.",
    quickLinks: [
      {
        label: "View Terms of Use",
        path: "/terms-and-conditions"
      },
      {
        label: "View Privacy Policy",
        path: "/privacy-policy"
      }
    ],
    questions: [
      {
        question: "Where can I read the ShopEase Terms of Use?",
        answer:
          "You can open the Terms of Use page from the footer, login/register pages or this FAQ quick link."
      },
      {
        question: "Where can I read the Privacy Policy?",
        answer:
          "The Privacy Policy page explains how ShopEase handles account, order, wallet, reward, coupon and support-related data in the demo app."
      }
    ]
  },
  {
    id: "shipping",
    title: "Shipping, Order Tracking & Delivery",
    description: "Delivery promises, tracking events and fulfillment updates.",
    quickLinks: [
      {
        label: "Track orders",
        path: "/orders"
      }
    ],
    questions: [
      {
        question: "How is the delivery promise calculated?",
        answer:
          "Delivery promise is calculated using pincode, delivery zone, warehouse, seller fulfillment mapping and SLA rules."
      },
      {
        question: "Where can I see my delivery timeline?",
        answer:
          "Open the order card from Orders & Returns to see fulfillment timeline, tracking steps and tracking events."
      },
      {
        question: "Why did my delivery status change?",
        answer:
          "Delivery status changes when fulfillment status is updated by admin or when tracking events are synced."
      },
      {
        question: "Can delivery be faster for some products?",
        answer:
          "Yes. Delivery speed may vary based on product category, warehouse availability, seller mapping and SLA configuration."
      }
    ]
  },
  {
    id: "cancel",
    title: "Cancellations and Modifications",
    description: "Cancel orders and understand order modification limits.",
    quickLinks: [
      {
        label: "Cancel order",
        path: "/orders"
      }
    ],
    questions: [
      {
        question: "Can I cancel an order after placing it?",
        answer:
          "You can cancel an order only while it is in a cancellation-eligible status. Later fulfillment stages may not allow cancellation."
      },
      {
        question: "Can I modify my delivery address after placing an order?",
        answer:
          "Address modification after order placement depends on the order workflow. If unavailable, contact support or cancel and reorder if eligible."
      },
      {
        question: "What happens after I cancel an order?",
        answer:
          "The order status is updated and refund workflow may begin depending on payment method and order state."
      }
    ]
  },
  {
    id: "returns",
    title: "Returns and Refunds",
    description: "Return eligibility, pickup, refund and wallet credits.",
    quickLinks: [
      {
        label: "Return item",
        path: "/orders"
      },
      {
        label: "Refund status",
        path: "/orders"
      }
    ],
    questions: [
      {
        question: "How does return eligibility work?",
        answer:
          "Return eligibility is based on product rules, return policy configuration, delivery status and return window."
      },
      {
        question: "How do I place a return request?",
        answer:
          "Open Orders & Returns, select an eligible delivered order and raise a return request with reason and comments."
      },
      {
        question: "Where can I see return request status?",
        answer:
          "Return request status appears in the order card and admin/support workflows where applicable."
      },
      {
        question: "Can refund be issued to wallet?",
        answer:
          "Yes. Refunds may be processed as wallet credit depending on the refund workflow configured in the app."
      }
    ]
  },
  {
    id: "signuplogin",
    title: "Sign Up and Login",
    description: "Account creation, login help and account security.",
    quickLinks: [
      {
        label: "Login",
        path: "/login"
      },
      {
        label: "Register",
        path: "/register"
      }
    ],
    questions: [
      {
        question: "How do I create an account on ShopEase?",
        answer:
          "Open Register, fill the required details, accept the Terms of Use and Privacy Policy, then continue."
      },
      {
        question: "Why do I need to accept Terms and Privacy Policy?",
        answer:
          "The acknowledgement confirms that you accept platform usage rules and privacy terms before continuing."
      },
      {
        question: "Why am I redirected to Home after login?",
        answer:
          "Direct login redirects to Home. If you were redirected from a protected page, login sends you back to that page."
      },
      {
        question: "How do I keep my account safe?",
        answer:
          "Use valid credentials, do not share your password and log out from shared devices."
      }
    ]
  },
  {
    id: "payments",
    title: "Payments",
    description: "Payment methods, wallet payment, rewards and failed payment help.",
    quickLinks: [
      {
        label: "Go to checkout",
        path: "/checkout"
      },
      {
        label: "View wallet",
        path: "/wallet"
      }
    ],
    questions: [
      {
        question: "Which payment methods are supported?",
        answer:
          "ShopEase supports configured checkout payment methods such as card, UPI, cash on delivery, wallet and reward adjustments."
      },
      {
        question: "Can wallet and rewards be used together?",
        answer:
          "Yes. Reward points are applied first as a discount, then wallet balance can be used for the remaining payable amount."
      },
      {
        question: "Why is no payment method required for some orders?",
        answer:
          "If rewards and wallet cover the full payable amount, no additional payment method is required."
      },
      {
        question: "What should I do if payment fails?",
        answer:
          "Check your payment details and try again. If the order was not created, your cart should remain available."
      }
    ]
  },
  {
    id: "walletRewards",
    title: "Wallet, Rewards and Savings",
    description: "Wallet credits, reward points, expiry alerts and savings dashboard.",
    quickLinks: [
      {
        label: "View wallet",
        path: "/wallet"
      },
      {
        label: "View rewards",
        path: "/rewards"
      },
      {
        label: "View savings",
        path: "/savings"
      }
    ],
    questions: [
      {
        question: "Where can I see wallet transactions?",
        answer:
          "Open My Wallet to view credits, debits, wallet expiry alerts and order payment transactions."
      },
      {
        question: "Where can I see reward points?",
        answer:
          "Open Rewards to view points earned, redeemed, adjusted or expired."
      },
      {
        question: "What happens when reward points expire?",
        answer:
          "Expired points are recorded in the reward ledger and expiry alerts may be shown before expiry."
      },
      {
        question: "Where can I see total savings?",
        answer:
          "Open My Savings to view coupon savings, reward savings, wallet credits and refund benefits."
      }
    ]
  },
  {
    id: "coupons",
    title: "Coupons and Offers",
    description: "Coupon application, usage history and coupon restrictions.",
    quickLinks: [
      {
        label: "Coupon history",
        path: "/coupon-history"
      }
    ],
    questions: [
      {
        question: "How do I apply a coupon?",
        answer:
          "Enter a valid coupon code in checkout. If eligible, the discount is applied before rewards and wallet."
      },
      {
        question: "Why is my coupon not applicable?",
        answer:
          "A coupon may be inactive, expired, below minimum cart value, already used, user-specific or over its usage limit."
      },
      {
        question: "Where can I see coupon usage history?",
        answer:
          "Open Coupon History to see coupon redemptions, order references and total coupon savings."
      },
      {
        question: "Can coupons have usage limits?",
        answer:
          "Yes. Coupons may have global usage limits and per-user usage limits."
      }
    ]
  },
  {
    id: "addresses",
    title: "Address Book",
    description: "Saved addresses, default address and checkout address selection.",
    quickLinks: [
      {
        label: "Manage addresses",
        path: "/addresses"
      }
    ],
    questions: [
      {
        question: "How do I add a new address?",
        answer:
          "Open Address Book and choose Add New Address. The saved address can be used during checkout."
      },
      {
        question: "How do I set a default address?",
        answer:
          "Open Address Book and use Set Default on the address you want to use by default."
      },
      {
        question: "Can I edit or delete saved addresses?",
        answer:
          "Yes. Address Book supports edit, delete and default address actions."
      }
    ]
  }
];