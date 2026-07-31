import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import AdminLayout from "../components/admin/AdminLayout";
import SellerLayout from "../components/seller/SellerLayout";
import SupportLayout from "../components/support/SupportLayout";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import ProductListPage from "../pages/ProductListPage";
import ProductDetailsPage from "../pages/ProductDetailsPage";
import CategoryPage from "../pages/CategoryPage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import OrderSuccessPage from "../pages/OrderSuccessPage";
import OrderHistoryPage from "../pages/OrderHistoryPage";
import WishlistPage from "../pages/WishlistPage";
import ComparePage from "../pages/ComparePage";
import NotFoundPage from "../pages/NotFoundPage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage";
import AdminReviewsPage from "../pages/admin/AdminReviewsPage";
import AdminQuestionsPage from "../pages/admin/AdminQuestionsPage";
import AdminCouponsPage from "../pages/admin/AdminCouponsPage";

import SellerDashboardPage from "../pages/seller/SellerDashboardPage";
import SellerProductsPage from "../pages/seller/SellerProductsPage";
import SellerOrdersPage from "../pages/seller/SellerOrdersPage";
import SellerQuestionsPage from "../pages/seller/SellerQuestionsPage";

import SupportDashboardPage from "../pages/support/SupportDashboardPage";
import SupportOrdersPage from "../pages/support/SupportOrdersPage";
import SupportTicketsPage from "../pages/support/SupportTicketsPage";

import AddressBookPage from "../pages/AddressBookPage";
import AdminDeliveryZonesPage from "../pages/admin/AdminDeliveryZonesPage";
import AdminDeliveryAnalyticsPage from "../pages/admin/AdminDeliveryAnalyticsPage";
import AdminDeliverySlaRulesPage from "../pages/admin/AdminDeliverySlaRulesPage";
import AdminSellerFulfillmentPage from "../pages/admin/AdminSellerFulfillmentPage";
import AdminOrderFulfillmentPage from "../pages/admin/AdminOrderFulfillmentPage";
import AdminReturnPolicyRulesPage from "../pages/admin/AdminReturnPolicyRulesPage";
import AdminReturnRequestsPage from "../pages/admin/AdminReturnRequestsPage";
import AdminRefundsPage from "../pages/admin/AdminRefundsPage";
import WalletPage from "../pages/WalletPage";
import AdminWalletCreditsPage from "../pages/admin/AdminWalletCreditsPage";
import RewardsPage from "../pages/RewardsPage";
import AdminRewardRulesPage from "../pages/admin/AdminRewardRulesPage";
import SavingsDashboardPage from "../pages/SavingsDashboardPage";
import CouponHistoryPage from "../pages/CouponHistoryPage";
import RecommendedForYouPage from "../pages/RecommendedForYouPage";
import HelpCenterPage from "../pages/HelpCenterPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import TermsAndConditionsPage from "../pages/TermsAndConditionsPage";
import FaqPage from "../pages/FaqPage";
import ContactSupportPage from "../pages/ContactSupportPage";
import MySupportTicketsPage from "../pages/MySupportTicketsPage";
import InvoicePage from "../pages/InvoicePage";
import SupportEscalationQueuePage from "../pages/support/SupportEscalationQueuePage";
import PaymentProcessingPage from "../pages/PaymentProcessingPage";
import RefundQueuePage from "../pages/RefundQueuePage";
import PaymentReconciliationPage from "../pages/support/PaymentReconciliationPage";
import MyReturnsPage from "../pages/MyReturnsPage";
import ReturnRequestPage from "../pages/ReturnRequestPage";
import ReturnManagementPage from "../pages/support/ReturnManagementPage";
import AgentLayout from "../components/agent/AgentLayout";
import AgentDashboardPage from "../pages/agent/AgentDashboardPage";
import AgentReturnPickupsPage from "../pages/agent/AgentReturnPickupsPage";
import ReturnWarehouseQcPage from "../pages/support/ReturnWarehouseQcPage";
import ReturnRefundSettlementPage from "../pages/support/ReturnRefundSettlementPage";
import SellerReturnsPage from "../pages/seller/SellerReturnsPage";
import SellerReturnDisputesPage from "../pages/seller/SellerReturnDisputesPage";
import AdminReturnDisputesPage from "../pages/admin/AdminReturnDisputesPage";
import AdminInventoryRestockPage from "../pages/admin/AdminInventoryRestockPage";
import AdminReturnLossDashboardPage from "../pages/admin/AdminReturnLossDashboardPage";
import AdminAgentAssignmentPage from "../pages/admin/AdminAgentAssignmentPage";
import PickupAgentDashboardPage from "../pages/pickup/PickupAgentDashboardPage";
import DeliveryAgentDashboardPage from "../pages/delivery/DeliveryAgentDashboardPage";
import AdminAgentWorkloadDashboardPage from "../pages/admin/AdminAgentWorkloadDashboardPage";
import AdminAgentProofVerificationPage from "../pages/admin/AdminAgentProofVerificationPage";
import AdminAgentRoutePlanningPage from "../pages/admin/AdminAgentRoutePlanningPage";
import AdminAgentPerformanceReportPage from "../pages/admin/AdminAgentPerformanceReportPage";
import AdminAgentPayoutPage from "../pages/admin/AdminAgentPayoutPage";
import AdminReturnAnalyticsRiskDashboardPage from "../pages/admin/AdminReturnAnalyticsRiskDashboardPage";
import AdminCustomerReturnAbusePage from "../pages/admin/AdminCustomerReturnAbusePage";
import AdminProductReturnQualityPage from "../pages/admin/AdminProductReturnQualityPage";
import AdminSellerRiskCompliancePage from "../pages/admin/AdminSellerRiskCompliancePage";
import AdminReturnFraudPatternDashboardPage from "../pages/admin/AdminReturnFraudPatternDashboardPage";
import AdminReturnAutomationRulesPage from "../pages/admin/AdminReturnAutomationRulesPage";
import AdminSellerPayoutSettlementPage from "../pages/admin/AdminSellerPayoutSettlementPage";
import AdminReturnOperationsAuditPage from "../pages/admin/AdminReturnOperationsAuditPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Public routes */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:id" element={<ProductDetailsPage />} />
      <Route path="/categories/:category" element={<CategoryPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      <Route path="/faqs" element={<FaqPage />} />
      <Route path="/contact-support" element={<ContactSupportPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route
        path="/terms-and-conditions"
        element={<TermsAndConditionsPage />}
      />

      {/* Authenticated common routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Customer/Admin shopping routes */}
      <Route element={<RoleRoute allowedRoles={["CUSTOMER", "ADMIN"]} />}>
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        {/* Add Payment Processing route */}
        <Route
          path="/payment-processing/:paymentId"
          element={<PaymentProcessingPage />}
        />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/addresses" element={<AddressBookPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/savings" element={<SavingsDashboardPage />} />
        <Route path="/coupon-history" element={<CouponHistoryPage />} />
        <Route path="/recommended" element={<RecommendedForYouPage />} />
        <Route path="/support-tickets" element={<MySupportTicketsPage />} />
        <Route path="/invoice/:orderId" element={<InvoicePage />} />
        <Route path="/my-returns" element={<MyReturnsPage />} />
        <Route
          path="/returns/request/:orderId"
          element={<ReturnRequestPage />}
        />
      </Route>

      {/* Admin routes */}
      <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route
            path="inventory-restock"
            element={<AdminInventoryRestockPage />}
          />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route
            path="order-fulfillment"
            element={<AdminOrderFulfillmentPage />}
          />
          <Route
            path="return-policies"
            element={<AdminReturnPolicyRulesPage />}
          />
          <Route
            path="customer-return-abuse"
            element={<AdminCustomerReturnAbusePage />}
          />
          <Route
            path="/admin/return-fraud-patterns"
            element={<AdminReturnFraudPatternDashboardPage />}
          />
          <Route
            path="/admin/return-automation-rules"
            element={<AdminReturnAutomationRulesPage />}
          />
          <Route path="return-requests" element={<AdminReturnRequestsPage />} />
          <Route
            path="product-return-quality"
            element={<AdminProductReturnQualityPage />}
          />
          <Route
            path="return-loss-dashboard"
            element={<AdminReturnLossDashboardPage />}
          />
          <Route
            path="return-operations-audit"
            element={<AdminReturnOperationsAuditPage />}
          />
          <Route
            path="seller-risk-compliance"
            element={<AdminSellerRiskCompliancePage />}
          />
          <Route
            path="seller-payout-settlement"
            element={<AdminSellerPayoutSettlementPage />}
          />
          <Route
            path="return-analytics-risk-dashboard"
            element={<AdminReturnAnalyticsRiskDashboardPage />}
          />
          <Route path="refunds" element={<AdminRefundsPage />} />
          <Route path="wallet-credits" element={<AdminWalletCreditsPage />} />
          <Route path="reward-rules" element={<AdminRewardRulesPage />} />
          <Route path="delivery" element={<AdminDeliveryZonesPage />} />
          <Route
            path="agent-assignments"
            element={<AdminAgentAssignmentPage />}
          />
          <Route path="agent-payouts" element={<AdminAgentPayoutPage />} />
          <Route
            path="agent-route-planning"
            element={<AdminAgentRoutePlanningPage />}
          />
          <Route
            path="agent-performance-report"
            element={<AdminAgentPerformanceReportPage />}
          />
          <Route
            path="agent-workload-dashboard"
            element={<AdminAgentWorkloadDashboardPage />}
          />
          <Route
            path="agent-proof-verification"
            element={<AdminAgentProofVerificationPage />}
          />
          <Route path="delivery-sla" element={<AdminDeliverySlaRulesPage />} />
          <Route
            path="seller-fulfillment"
            element={<AdminSellerFulfillmentPage />}
          />
          <Route
            path="/admin/return-disputes"
            element={<AdminReturnDisputesPage />}
          />
          <Route
            path="delivery-analytics"
            element={<AdminDeliveryAnalyticsPage />}
          />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="questions" element={<AdminQuestionsPage />} />
        </Route>
      </Route>

      {/* Seller routes */}
      <Route element={<RoleRoute allowedRoles={["SELLER"]} />}>
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<Navigate to="/seller/dashboard" replace />} />
          <Route path="dashboard" element={<SellerDashboardPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
          <Route path="questions" element={<SellerQuestionsPage />} />
          <Route path="/seller/returns" element={<SellerReturnsPage />} />
          <Route
            path="/seller/return-disputes"
            element={<SellerReturnDisputesPage />}
          />
        </Route>
      </Route>

      {/* Support routes */}
      <Route
        element={
          <RoleRoute allowedRoles={["SUPPORT", "ADMIN", "WAREHOUSE_AGENT"]} />
        }
      >
        <Route path="/support" element={<SupportLayout />}>
          <Route index element={<Navigate to="/support/tickets" replace />} />
          <Route path="dashboard" element={<SupportDashboardPage />} />
          <Route path="orders" element={<SupportOrdersPage />} />
          <Route path="tickets" element={<SupportTicketsPage />} />
          <Route path="escalations" element={<SupportEscalationQueuePage />} />
          <Route path="refunds" element={<RefundQueuePage />} />
          <Route
            path="reconciliation"
            element={<PaymentReconciliationPage />}
          />
          <Route path="returns" element={<ReturnManagementPage />} />
          <Route path="returns/qc" element={<ReturnWarehouseQcPage />} />
          <Route
            path="returns/refund-settlement"
            element={<ReturnRefundSettlementPage />}
          />
        </Route>
      </Route>

      <Route
        element={
          <RoleRoute
            allowedRoles={[
              "PICKUP_AGENT",
              "DELIVERY_AGENT",
              "LOGISTICS_AGENT",
              "ADMIN",
            ]}
          />
        }
      >
        <Route path="/agent" element={<AgentLayout />}>
          <Route index element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="dashboard" element={<AgentDashboardPage />} />
          <Route path="returns" element={<PickupAgentDashboardPage />} />
          <Route path="deliveries" element={<DeliveryAgentDashboardPage />} />

          {/* Optional temporary legacy route */}
          <Route path="returns-legacy" element={<AgentReturnPickupsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
