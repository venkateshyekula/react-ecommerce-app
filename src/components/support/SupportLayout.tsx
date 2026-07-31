import { useMemo } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

type SupportEscalationTeam =
  | "GENERAL_SUPPORT"
  | "ORDER_SUPPORT"
  | "PAYMENT_FINANCE"
  | "REFUND_TEAM"
  | "RETURN_TEAM"
  | "CUSTOMER_OPERATIONS"
  | "SELLER_FULFILLMENT"
  | "ADMIN_ESCALATION";

interface SupportUserAccessShape {
  id?: string;
  role?: string;
  supportTeamCode?: SupportEscalationTeam;
  supportTeamRole?: string;
  warehouseTeamCode?: string;
  warehouseTeamRole?: string;
}

interface SupportNavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  access:
    | "FULL_SUPPORT"
    | "ALL_SUPPORT"
    | "REFUND_ACCESS"
    | "PAYMENT_RECONCILIATION_ACCESS"
    | "RETURN_ACCESS"
    | "REFUND_SETTLEMENT_ACCESS"
    | "WAREHOUSE_AGENT";
}

const refundAllowedTeamCodes: SupportEscalationTeam[] = [
  "REFUND_TEAM",
  "PAYMENT_FINANCE",
];

const reconciliationAllowedTeamCodes: SupportEscalationTeam[] = [
  "PAYMENT_FINANCE",
];

const returnAllowedTeamCodes: SupportEscalationTeam[] = [
  "RETURN_TEAM",
  "CUSTOMER_OPERATIONS",
  "SELLER_FULFILLMENT",
];

const supportNavItems: SupportNavItem[] = [
  {
    label: "Dashboard",
    path: "/support/dashboard",
    icon: "bi bi-speedometer2",
    access: "FULL_SUPPORT",
  },
  {
    label: "Orders",
    path: "/support/orders",
    icon: "bi bi-bag-check",
    access: "FULL_SUPPORT",
  },
  {
    label: "Tickets",
    path: "/support/tickets",
    icon: "bi bi-ticket-detailed",
    access: "ALL_SUPPORT",
  },
  {
    label: "Escalations",
    path: "/support/escalations",
    icon: "bi bi-exclamation-triangle",
    access: "ALL_SUPPORT",
  },
  {
    label: "Refund Queue",
    path: "/support/refunds",
    icon: "bi bi-arrow-counterclockwise",
    access: "REFUND_ACCESS",
  },
  {
    label: "Payment Reconciliation",
    path: "/support/reconciliation",
    icon: "bi bi-receipt-cutoff",
    access: "PAYMENT_RECONCILIATION_ACCESS",
  },
  {
    label: "Returns",
    path: "/support/returns",
    icon: "bi bi-arrow-return-left",
    exact: true,
    access: "RETURN_ACCESS",
  },
  {
    label: "Refund Settlement",
    path: "/support/returns/refund-settlement",
    icon: "bi bi-cash-coin",
    access: "REFUND_SETTLEMENT_ACCESS",
  },
  {
    label: "Warehouse QC",
    path: "/support/returns/qc",
    icon: "bi bi-clipboard-check",
    access: "WAREHOUSE_AGENT",
  },
];

const SupportLayout = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const supportUser = currentUser as SupportUserAccessShape | null;

  const isAdmin = supportUser?.role === "ADMIN";
  const isSupport = supportUser?.role === "SUPPORT";
  const isWarehouseAgent = supportUser?.role === "WAREHOUSE_AGENT";

  const resolvedSupportTeamCode = supportUser?.supportTeamCode ?? null;

  const isSupportTeamMember = Boolean(isSupport && resolvedSupportTeamCode);

  const canViewFullSupportNavigation =
    isAdmin || (isSupport && !isSupportTeamMember);

  const canViewRefundNavigation =
    canViewFullSupportNavigation ||
    Boolean(
      resolvedSupportTeamCode &&
        refundAllowedTeamCodes.includes(resolvedSupportTeamCode)
    );

  const canViewPaymentReconciliationNavigation =
    canViewFullSupportNavigation ||
    Boolean(
      resolvedSupportTeamCode &&
        reconciliationAllowedTeamCodes.includes(resolvedSupportTeamCode)
    );

  const canViewReturnNavigation =
    canViewFullSupportNavigation ||
    Boolean(
      resolvedSupportTeamCode &&
        returnAllowedTeamCodes.includes(resolvedSupportTeamCode)
    );

  const canViewWarehouseQcNavigation = isAdmin || isWarehouseAgent;

  const visibleNavItems = useMemo(() => {
    return supportNavItems.filter((item) => {
      if (isWarehouseAgent) {
        return item.access === "WAREHOUSE_AGENT";
      }

      switch (item.access) {
        case "FULL_SUPPORT":
          return canViewFullSupportNavigation;
        case "ALL_SUPPORT":
          return isAdmin || isSupport;
        case "REFUND_ACCESS":
        case "REFUND_SETTLEMENT_ACCESS":
          return canViewRefundNavigation;
        case "PAYMENT_RECONCILIATION_ACCESS":
          return canViewPaymentReconciliationNavigation;
        case "RETURN_ACCESS":
          return canViewReturnNavigation;
        case "WAREHOUSE_AGENT":
          return canViewWarehouseQcNavigation;
        default:
          return canViewFullSupportNavigation;
      }
    });
  }, [
    isWarehouseAgent,
    canViewFullSupportNavigation,
    isAdmin,
    isSupport,
    canViewRefundNavigation,
    canViewPaymentReconciliationNavigation,
    canViewReturnNavigation,
    canViewWarehouseQcNavigation,
  ]);

  const isRestrictedDashboardOrOrders =
    isSupportTeamMember &&
    (location.pathname.startsWith("/support/dashboard") ||
      location.pathname.startsWith("/support/orders")) &&
    !canViewFullSupportNavigation;

  const isRefundPathRestrictedForTeamMember =
    isSupportTeamMember &&
    location.pathname.startsWith("/support/refunds") &&
    !canViewRefundNavigation;

  const isReconciliationPathRestrictedForTeamMember =
    isSupportTeamMember &&
    location.pathname.startsWith("/support/reconciliation") &&
    !canViewPaymentReconciliationNavigation;

  const isReturnPathRestrictedForTeamMember =
    isSupportTeamMember &&
    location.pathname.startsWith("/support/returns") &&
    !location.pathname.startsWith("/support/returns/qc") &&
    !location.pathname.startsWith("/support/returns/refund-settlement") &&
    !canViewReturnNavigation;

  const isRefundSettlementPathRestricted =
    isSupportTeamMember &&
    location.pathname.startsWith("/support/returns/refund-settlement") &&
    !canViewRefundNavigation;

  const isWarehouseQcPathRestricted =
    location.pathname.startsWith("/support/returns/qc") &&
    !canViewWarehouseQcNavigation;

  const isWarehouseAgentOnNonQcSupportPath =
    isWarehouseAgent &&
    location.pathname.startsWith("/support") &&
    !location.pathname.startsWith("/support/returns/qc");

  if (isWarehouseAgentOnNonQcSupportPath) {
    return <Navigate to="/support/returns/qc" replace />;
  }

  if (isWarehouseQcPathRestricted) {
    return <Navigate to="/support/escalations" replace />;
  }

  if (
    isRestrictedDashboardOrOrders ||
    isRefundPathRestrictedForTeamMember ||
    isReconciliationPathRestrictedForTeamMember ||
    isReturnPathRestrictedForTeamMember ||
    isRefundSettlementPathRestricted
  ) {
    return <Navigate to="/support/escalations" replace />;
  }

  return (
    <main className="support-layout dashboard-layout bg-light">
      <div className="container-fluid">
        <div className="row">
          <aside className="col-lg-2 dashboard-sidebar support-sidebar">
            <div className="dashboard-sidebar-inner support-sidebar-inner">
              <div className="dashboard-sidebar-header mb-4">
                <h4 className="fw-bold mb-1">
                  <i
                    className={`${
                      isWarehouseAgent ? "bi bi-box-seam" : "bi bi-headset"
                    } me-2 text-primary`}
                  />
                  {isWarehouseAgent ? "Warehouse" : "Support"}
                </h4>

                <p className="small text-muted mb-0">
                  {isWarehouseAgent
                    ? "Manage return QC"
                    : isSupportTeamMember
                      ? "Assigned escalations"
                      : "Operations dashboard"}
                </p>
              </div>

              <nav
                className="nav nav-underline flex-column dashboard-vertical-tabs support-vertical-tabs"
                aria-label="Support navigation"
              >
                {visibleNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `nav-link dashboard-vertical-tab support-vertical-tab ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <span className="dashboard-tab-icon">
                      <i className={item.icon} />
                    </span>

                    <span className="dashboard-tab-label">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          <section className="col-lg-10 dashboard-content support-content">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
};

export default SupportLayout;