import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import CartItem from "../components/cart/CartItem";
import { useCart } from "../context/useCart";
import { formatCurrency } from "../utils/currencyFormatter";

const CartPage = () => {
  const {
    cartItems,
    cartCount,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const deliveryFee = cartTotal > 0 && cartTotal < 999 ? 99 : 0;
  const grandTotal = cartTotal + deliveryFee;

  return (
    <main className="cart-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">Shopping Cart</h1>
              <p className="text-muted mb-0">
                Review your cart items before checkout.
              </p>
            </div>

            <Link to="/products" className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-4 py-md-5">
        {cartItems.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            message="Looks like you haven't added any products to your cart yet."
            action={
              <Link to="/products" className="btn btn-primary">
                Start Shopping
              </Link>
            }
          />
        ) : (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
                <h5 className="fw-bold mb-0">
                  Cart Items{" "}
                  <span className="text-muted">({cartCount})</span>
                </h5>

                <Button variant="outline-danger" onClick={clearCart}>
                  <i className="bi bi-trash me-2" />
                  Clear Cart
                </Button>
              </div>

              {cartItems.map((item) => (
                <CartItem
                  key={item.productId}
                  item={item}
                  onIncrease={increaseQuantity}
                  onDecrease={decreaseQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            <div className="col-lg-4">
              <div className="cart-summary-card bg-white rounded-4 shadow-sm p-4 sticky-lg-top">
                <h5 className="fw-bold mb-4">Order Summary</h5>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-semibold">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Delivery Fee</span>
                  <span className="fw-semibold">
                    {deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}
                  </span>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-4">
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold fs-5">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                <Link
                  to="/checkout"
                  className="btn btn-primary w-100"
                >
                  Proceed to Checkout
                </Link>

                <div className="cart-summary-note bg-light rounded-4 p-3 mt-3">
                  <p className="small text-muted mb-0">
                    <i className="bi bi-shield-check text-success me-2" />
                    Secure checkout with Credit Card, UPI, and Cash on Delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default CartPage;