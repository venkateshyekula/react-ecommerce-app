import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";
import ToastContainer from "./components/common/ToastContainer";
import ComparisonBar from "./components/products/ComparisonBar";

import { AuthProvider } from "./context/AuthProvider";
import { CartProvider } from "./context/CartProvider";
import { ComparisonProvider } from "./context/ComparisonProvider";
import { ToastProvider } from "./context/ToastProvider";
import { WishlistProvider } from "./context/WishlistProvider";
import AppRoutes from "./routes/AppRoutes";
import { useSupportTeamAvailabilityHeartbeat } from "./hooks/useSupportTeamAvailabilityHeartbeat";
import { useAuth } from "./context/useAuth";

const AppContent = () => {

const { currentUser } = useAuth();

useSupportTeamAvailabilityHeartbeat(currentUser);

return <AppRoutes />;

};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            <ComparisonProvider>
              <div className="app-shell">
                <Navbar />
                <AppContent />
                <Footer />
                <ComparisonBar />
                {/*<RecentlyViewedDrawer />*/}
                <ToastContainer />
              </div>
            </ComparisonProvider>
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;