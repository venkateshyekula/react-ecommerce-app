import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

interface AdminNavItem {
  label: string;
  path: string;
  icon: string;
}

interface AdminNavSubGroup {
  label: string;
  icon: string;
  items: AdminNavItem[];
}

interface AdminNavGroup {
  label: string;
  icon: string;
  items?: AdminNavItem[];
  subGroups?: AdminNavSubGroup[];
}

const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    icon: "bi bi-speedometer2",
    items: [
      {
        label: "Dashboard",
        path: "/admin/dashboard",
        icon: "bi bi-speedometer2",
      },
      {
        label: "Analytics",
        path: "/admin/analytics",
        icon: "bi bi-bar-chart-line",
      },
    ],
  },
  {
    label: "Catalog",
    icon: "bi bi-box-seam",
    items: [
      {
        label: "Products",
        path: "/admin/products",
        icon: "bi bi-box-seam",
      },
      {
        label: "Inventory Restock",
        path: "/admin/inventory-restock",
        icon: "bi bi-box-arrow-in-down",
      },
      {
        label: "Coupons",
        path: "/admin/coupons",
        icon: "bi bi-ticket-perforated",
      },
      {
        label: "Reviews",
        path: "/admin/reviews",
        icon: "bi bi-chat-square-text",
      },
      {
        label: "Questions",
        path: "/admin/questions",
        icon: "bi bi-question-circle",
      },
    ],
  },
  {
    label: "Orders",
    icon: "bi bi-receipt",
    items: [
      {
        label: "Orders",
        path: "/admin/orders",
        icon: "bi bi-receipt",
      },
      {
        label: "Fulfillment",
        path: "/admin/order-fulfillment",
        icon: "bi bi-box-seam",
      },
      {
        label: "Seller Fulfillment",
        path: "/admin/seller-fulfillment",
        icon: "bi bi-diagram-3",
      },
    ],
  },
  {
    label: "Returns",
    icon: "bi bi-arrow-return-left",
    subGroups: [
      {
        label: "Return Intelligence",
        icon: "bi bi-radar",
        items: [
          {
            label: "Return Analytics Risk",
            path: "/admin/return-analytics-risk-dashboard",
            icon: "bi bi-shield-exclamation",
          },
          {
            label: "Customer Return Abuse",
            path: "/admin/customer-return-abuse",
            icon: "bi bi-person-exclamation",
          },
          {
            label: "Product Return Quality",
            path: "/admin/product-return-quality",
            icon: "bi bi-box-seam",
          },
          {
            label: "Return Fraud Patterns",
            path: "/admin/return-fraud-patterns",
            icon: "bi bi-activity",
          },
        ],
      },
      {
        label: "Return Operations",
        icon: "bi bi-sliders",
        items: [
          {
            label: "Return Automation Rules",
            path: "/admin/return-automation-rules",
            icon: "bi bi-sliders",
          },
          {
            label: "Return Audit Export",
            path: "/admin/return-operations-audit",
            icon: "bi bi-journal-text",
          },
          {
            label: "Return Policies",
            path: "/admin/return-policies",
            icon: "bi bi-arrow-counterclockwise",
          },
          {
            label: "Return Requests",
            path: "/admin/return-requests",
            icon: "bi bi-arrow-return-left",
          },
          {
            label: "Return Loss Dashboard",
            path: "/admin/return-loss-dashboard",
            icon: "bi bi-graph-down-arrow",
          },
          {
            label: "Return Disputes",
            path: "/admin/return-disputes",
            icon: "bi bi-shield-exclamation",
          },
          {
            label: "Refunds",
            path: "/admin/refunds",
            icon: "bi bi-cash-coin",
          },
          {
            label: "Return SLA Monitoring",
            path: "/admin/return-sla-monitoring",
            icon: "bi bi-clock-history",
          },
          {
            label: "Return Logistics Automation",
            path: "/admin/return-logistics-automation-rules",
            icon: "bi bi-diagram-3",
          },
        ],
      },
      {
        label: "Seller Operations",
        icon: "bi bi-shop-window",
        items: [
          {
            label: "Seller Risk Compliance",
            path: "/admin/seller-risk-compliance",
            icon: "bi bi-shop-window",
          },
          {
            label: "Seller Payout Settlement",
            path: "/admin/seller-payout-settlement",
            icon: "bi bi-wallet2",
          },
        ],
      },
      {
        label: "Compliance",
        icon: "bi bi-journal-text",
        items: [
          {
            label: "Unified Audit Export",
            path: "/admin/unified-operations-audit",
            icon: "bi bi-journal-text",
          },
        ],
      },
    ],
  },
  {
    label: "Delivery",
    icon: "bi bi-truck",
    items: [
      {
        label: "Delivery",
        path: "/admin/delivery",
        icon: "bi bi-truck",
      },
      {
        label: "Delivery SLA",
        path: "/admin/delivery-sla",
        icon: "bi bi-speedometer2",
      },
      {
        label: "Delivery Analytics",
        path: "/admin/delivery-analytics",
        icon: "bi bi-graph-up-arrow",
      },
    ],
  },
  {
    label: "Agent Ops",
    icon: "bi bi-truck-front",
    items: [
      {
        label: "Agent Assignments",
        path: "/admin/agent-assignments",
        icon: "bi bi-truck",
      },
      {
        label: "Agent SLA Dashboard",
        path: "/admin/agent-workload-dashboard",
        icon: "bi bi-speedometer2",
      },
      {
        label: "Agent Proof Verification",
        path: "/admin/agent-proof-verification",
        icon: "bi bi-card-checklist",
      },
      {
        label: "Agent Route Planning",
        path: "/admin/agent-route-planning",
        icon: "bi bi-diagram-3",
      },
      {
        label: "Agent Performance Report",
        path: "/admin/agent-performance-report",
        icon: "bi bi-graph-up-arrow",
      },
      {
        label: "Agent Payouts",
        path: "/admin/agent-payouts",
        icon: "bi bi-wallet2",
      },
      {
        label: "Agent Escalation",
        path: "/admin/agent-escalation-reassignment",
        icon: "bi bi-diagram-3",
      },
    ],
  },
  {
    label: "Wallet & Rewards",
    icon: "bi bi-wallet2",
    items: [
      {
        label: "Wallet",
        path: "/wallet",
        icon: "bi bi-wallet2",
      },
      {
        label: "Wallet Credits",
        path: "/admin/wallet-credits",
        icon: "bi bi-wallet2",
      },
      {
        label: "Reward Rules",
        path: "/admin/reward-rules",
        icon: "bi bi-stars",
      },
    ],
  },
];

const isItemActive = ({
  pathname,
  item,
}: {
  pathname: string;
  item: AdminNavItem;
}): boolean => {
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

const isGroupActive = ({
  pathname,
  group,
}: {
  pathname: string;
  group: AdminNavGroup;
}): boolean => {
  const directItems = group.items ?? [];

  const directActive = directItems.some((item) =>
    isItemActive({
      pathname,
      item,
    }),
  );

  const subGroupActive =
    group.subGroups?.some((subGroup) =>
      subGroup.items.some((item) =>
        isItemActive({
          pathname,
          item,
        }),
      ),
    ) ?? false;

  return directActive || subGroupActive;
};

const AdminLayout = () => {
  const location = useLocation();

  // ONLY first subgroup is expanded (false), all others are collapsed (true)
  const [collapsedSubGroups, setCollapsedSubGroups] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    let isFirstSubGroupFound = false;

    adminNavGroups.forEach((group) => {
      group.subGroups?.forEach((subGroup) => {
        const key = `${group.label}-${subGroup.label}`;
        if (!isFirstSubGroupFound) {
          initialState[key] = false; // Expanded
          isFirstSubGroupFound = true;
        } else {
          initialState[key] = true; // Collapsed
        }
      });
    });

    return initialState;
  });

  const toggleSubGroup = (groupLabel: string, subGroupLabel: string) => {
    const key = `${groupLabel}-${subGroupLabel}`;
    setCollapsedSubGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <main className="admin-layout dashboard-layout bg-light min-vh-100">
      <section className="admin-top-subnav py-2">
        <div className="container-fluid">
          <nav aria-label="Admin navigation">
            <ul className="admin-subnav-scroll d-flex align-items-center gap-2 list-unstyled mb-0 p-0">
              {adminNavGroups.map((group) => {
                const groupActive = isGroupActive({
                  pathname: location.pathname,
                  group,
                });

                return (
                  <li
                    className={`dropdown ${groupActive ? "is-active" : ""}`}
                    key={group.label}
                  >
                    <div
                      className={`dropdown-toggle admin-subnav-group-btn ${
                        groupActive ? "active" : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-haspopup="true"
                      aria-expanded={groupActive}
                    >
                      <i className={`${group.icon} me-1`} />
                      <span>{group.label}</span>
                    </div>

                    <ul className="admin-subnav-menu list-unstyled mb-0">
                      {/* Direct Level Nav Items */}
                      {group.items?.map((item) => (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              `dropdown-item ${isActive ? "active" : ""}`
                            }
                          >
                            <i className={`${item.icon} me-2`} />
                            <span>{item.label}</span>
                          </NavLink>
                        </li>
                      ))}

                      {/* Sub-groups (First expanded, remaining collapsed) */}
                      {group.subGroups?.map((subGroup, index) => {
                        const subGroupKey = `${group.label}-${subGroup.label}`;
                        const isCollapsed =
                          collapsedSubGroups[subGroupKey] ?? true;

                        return (
                          <React.Fragment key={subGroup.label}>
                            {/* Divider line */}
                            {((group.items && group.items.length > 0) ||
                              index > 0) && (
                              <li
                                className="admin-dropdown-divider"
                                role="separator"
                              />
                            )}

                            {/* Header Click Toggle */}
                            <li
                              className="admin-dropdown-header px-3 py-1.5 d-flex align-items-center justify-content-between"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSubGroup(group.label, subGroup.label);
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <span className="d-flex align-items-center gap-1">
                                <i className={`${subGroup.icon} me-1`} />
                                {subGroup.label}
                              </span>
                              <i
                                className={`bi ${
                                  isCollapsed ? "bi-plus-lg" : "bi-dash-lg"
                                } admin-header-toggle-icon`}
                              />
                            </li>

                            {/* Subgroup Items */}
                            {!isCollapsed &&
                              subGroup.items.map((item) => (
                                <li key={item.path}>
                                  <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                      `dropdown-item ${
                                        isActive ? "active" : ""
                                      }`
                                    }
                                  >
                                    <i className={`${item.icon} me-2`} />
                                    <span>{item.label}</span>
                                  </NavLink>
                                </li>
                              ))}
                          </React.Fragment>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </section>

      <section className="dashboard-content admin-content">
        <div className="container-fluid py-4">
          <Outlet />
        </div>
      </section>
    </main>
  );
};

export default AdminLayout;