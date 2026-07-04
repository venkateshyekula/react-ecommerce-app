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
import NotFoundPage from "../pages/NotFoundPage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage";

import SellerDashboardPage from "../pages/seller/SellerDashboardPage";
import SellerProductsPage from "../pages/seller/SellerProductsPage";
import SellerOrdersPage from "../pages/seller/SellerOrdersPage";

import SupportDashboardPage from "../pages/support/SupportDashboardPage";
import SupportOrdersPage from "../pages/support/SupportOrdersPage";
import SupportTicketsPage from "../pages/support/SupportTicketsPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />

      <Route path="/products" element={<ProductListPage />} />

      <Route path="/products/:id" element={<ProductDetailsPage />} />

      <Route path="/categories/:category" element={<CategoryPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["CUSTOMER", "ADMIN"]} />}>
        <Route path="/wishlist" element={<WishlistPage />} />

        <Route path="/cart" element={<CartPage />} />

        <Route path="/checkout" element={<CheckoutPage />} />

        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />

        <Route path="/orders" element={<OrderHistoryPage />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
        </Route>
      </Route>

      <Route element={<RoleRoute allowedRoles={["SELLER"]} />}>
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<Navigate to="/seller/dashboard" replace />} />
          <Route path="dashboard" element={<SellerDashboardPage />} />
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="orders" element={<SellerOrdersPage />} />
        </Route>
      </Route>

      <Route element={<RoleRoute allowedRoles={["SUPPORT"]} />}>
        <Route path="/support" element={<SupportLayout />}>
          <Route index element={<Navigate to="/support/dashboard" replace />} />
          <Route path="dashboard" element={<SupportDashboardPage />} />
          <Route path="orders" element={<SupportOrdersPage />} />
          <Route path="tickets" element={<SupportTicketsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
