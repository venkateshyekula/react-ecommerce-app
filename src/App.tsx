import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";
import { AuthProvider } from "../src/context/AuthProvider";
import { CartProvider } from "../src/context/CartProvider";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="app-shell">
          <Navbar />
          <AppRoutes />
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;