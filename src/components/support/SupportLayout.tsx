import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { supportTeamService } from "../../services/supportTeamService";
import type { SupportEscalationTeam } from "../../types/supportEscalation";
import type { SupportTeamMember } from "../../types/supportTeam";

interface SupportNavItem {
  label: string;
  path: string;
  icon: string;
  access:
    | "FULL_SUPPORT"
    | "ALL_SUPPORT"
    | "REFUND_ACCESS"
    | "PAYMENT_RECONCILIATION_ACCESS"
    | "RETURN_ACCESS";
}

interface SupportUserAccessShape {
  id?: string;
  role?: string;
  supportTeamCode?: SupportEscalationTeam;
  supportTeamRole?: string;
}

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
    icon: "bi bi-receipt",
    access: "FULL_SUPPORT",
  },
  {
    label: "Tickets",
    path: "/support/tickets",
    icon: "bi bi-headset",
    access: "ALL_SUPPORT",
  },
  {
    label: "Escalations",
    path: "/support/escalations",
    icon: "bi bi-exclamation-diamond",
    access: "ALL_SUPPORT",
  },
  {
    label: "Refunds",
    path: "/support/refunds",
    icon: "bi bi-arrow-counterclockwise",
    access: "REFUND_ACCESS",
  },
  {
    label: "Reconciliation",
    path: "/support/reconciliation",
    icon: "bi bi-shield-check",
    access: "PAYMENT_RECONCILIATION_ACCESS",
  },
  {
    label: "Returns",
    path: "/support/returns",
    icon: "bi bi-arrow-return-left",
    access: "RETURN_ACCESS",
  },
];

const restrictedTeamMemberPaths = ["/support/dashboard", "/support/orders"];

const refundAllowedTeamCodes: SupportEscalationTeam[] = [
  "REFUND_TEAM",
  "PAYMENT_FINANCE",
];

const reconciliationAllowedTeamCodes: SupportEscalationTeam[] = [
  "PAYMENT_FINANCE",
  "REFUND_TEAM",
];

const returnAllowedTeamCodes: SupportEscalationTeam[] = [
  "REFUND_TEAM",
  "DELIVERY_TEAM",
  "SELLER_FULFILLMENT",
  "CUSTOMER_OPERATIONS",
];

const SupportLayout = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const [currentTeamMember, setCurrentTeamMember] =
    useState<SupportTeamMember | null>(null);

  const supportUser = currentUser as SupportUserAccessShape | null;

  useEffect(() => {
    const loadTeamMember = async (): Promise<void> => {
      if (!supportUser?.id || supportUser.role !== "SUPPORT") {
        setCurrentTeamMember(null);
        return;
      }

      try {
        const member = await supportTeamService.getMemberByUserId(
          supportUser.id,
        );

        setCurrentTeamMember(member);
      } catch {
        setCurrentTeamMember(null);
      }
    };

    void loadTeamMember();
  }, [supportUser?.id, supportUser?.role]);

  const isAdmin = supportUser?.role === "ADMIN";
  const isSupport = supportUser?.role === "SUPPORT";

  const resolvedSupportTeamCode =
    supportUser?.supportTeamCode ?? currentTeamMember?.teamCode ?? null;

  const isSupportTeamMember = Boolean(isSupport && resolvedSupportTeamCode);

  const canViewFullSupportNavigation =
    isAdmin || (isSupport && !isSupportTeamMember);

  const canViewRefundNavigation =
    canViewFullSupportNavigation ||
    Boolean(
      resolvedSupportTeamCode &&
        refundAllowedTeamCodes.includes(resolvedSupportTeamCode),
    );

  const canViewPaymentReconciliationNavigation =
    canViewFullSupportNavigation ||
    Boolean(
      resolvedSupportTeamCode &&
        reconciliationAllowedTeamCodes.includes(resolvedSupportTeamCode),
    );

  const canViewReturnNavigation =
    canViewFullSupportNavigation ||
    Boolean(
      resolvedSupportTeamCode &&
        returnAllowedTeamCodes.includes(resolvedSupportTeamCode),
    );

  const isRestrictedPathForTeamMember =
    isSupportTeamMember &&
    restrictedTeamMemberPaths.some((restrictedPath) =>
      location.pathname.startsWith(restrictedPath),
    );

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
    !canViewReturnNavigation;

  const visibleNavItems = useMemo(() => {
    return supportNavItems.filter((item) => {
      if (item.access === "ALL_SUPPORT") {
        return true;
      }

      if (item.access === "REFUND_ACCESS") {
        return canViewRefundNavigation;
      }

      if (item.access === "PAYMENT_RECONCILIATION_ACCESS") {
        return canViewPaymentReconciliationNavigation;
      }

      if (item.access === "RETURN_ACCESS") {
        return canViewReturnNavigation;
      }

      return canViewFullSupportNavigation;
    });
  }, [
    canViewFullSupportNavigation,
    canViewRefundNavigation,
    canViewPaymentReconciliationNavigation,
    canViewReturnNavigation,
  ]);

  if (
    isRestrictedPathForTeamMember ||
    isRefundPathRestrictedForTeamMember ||
    isReconciliationPathRestrictedForTeamMember ||
    isReturnPathRestrictedForTeamMember
  ) {
    return <Navigate to="/support/escalations" replace />;
  }

  return (
    <div className="support-layout bg-light">
      <div className="container-fluid">
        <div className="row">
          <aside className="col-lg-2 bg-white support-sidebar py-3 border-end min-vh-100">
            <div className="p-3 border-bottom mb-3">
              <div className="d-flex align-items-center gap-3">
                <div className="support-sidebar-icon rounded-4 bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center">
                  <i className="bi bi-headset fs-5" />
                </div>

                <div>
                  <h5 className="fw-bold mb-1">Support</h5>

                  <p
                    className="text-muted small mb-0"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {isSupportTeamMember
                      ? "Manage assigned escalations"
                      : "Manage support operations"}
                  </p>
                </div>
              </div>
            </div>

            {isSupportTeamMember ? (
              <div className="alert alert-info small mx-3 mb-3">
                <strong>Team scoped access</strong>

                <div style={{ fontSize: "0.8rem" }}>
                  You can access tickets and escalations linked to{" "}
                  <strong>{resolvedSupportTeamCode}</strong>.
                </div>
              </div>
            ) : null}

            <nav className="support-sidebar-nav-wrapper px-2">
              <ul className="nav nav-pills flex-column gap-2 vertical-tabs support-vertical-tabs support-sidebar-nav list-unstyled mb-0">
                {visibleNavItems.map((item) => (
                  <li className="nav-item w-100" key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `nav-link dashboard-vertical-tab support-vertical-tab d-flex align-items-center gap-2 rounded-4 px-3 py-2 ${
                          isActive
                            ? "active text-primary bg-primary-subtle fw-semibold shadow-sm"
                            : "text-secondary"
                        }`
                      }
                    >
                      <i className={`${item.icon} fs-5`} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <section className="col-lg-10 support-content">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
};

export default SupportLayout;