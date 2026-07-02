import type { CartItem as CartItemType } from "../../types/cart";
import { formatCurrency } from "../../utils/currencyFormatter";
import Button from "../common/Button";

interface CartItemProps {
  item: CartItemType;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
}

const CartItem = ({
  item,
  onIncrease,
  onDecrease,
  onRemove
}: CartItemProps) => {
  const subtotal = item.price * item.quantity;
  const isMaxQuantity = item.quantity >= item.stock;

  return (
    <div className="cart-item bg-white rounded-4 shadow-sm p-3 mb-3">
      <div className="row g-3 align-items-center">
        <div className="col-4 col-md-2">
          {/* FIXED: Replaced raw evaluation with a structured img tag */}
          <img 
            src={item.image} 
            alt={item.name} 
            className="img-fluid rounded"
          />
        </div>

        <div className="col-8 col-md-4">
          <h5 className="fw-bold mb-1">{item.name}</h5>
          <p className="text-muted small mb-1">{item.brand}</p>
          <p className="mb-0 fw-semibold">{formatCurrency(item.price)}</p>
        </div>

        <div className="col-12 col-md-3">
          <div className="quantity-control d-flex align-items-center">
            <Button
              variant="outline-secondary"
              className="quantity-btn"
              disabled={item.quantity <= 1}
              onClick={() => onDecrease(item.productId)}
            >
              <i className="bi bi-dash" />
            </Button>

            <span className="quantity-value px-3 fw-bold">
              {item.quantity}
            </span>

            <Button
              variant="outline-secondary"
              className="quantity-btn"
              disabled={isMaxQuantity}
              onClick={() => onIncrease(item.productId)}
            >
              <i className="bi bi-plus" />
            </Button>
          </div>

          {isMaxQuantity ? (
            <small className="text-muted d-block mt-1">
              Max stock reached
            </small>
          ) : null}
        </div>

        <div className="col-6 col-md-2">
          <p className="text-muted small mb-1">Subtotal</p>
          <p className="fw-bold mb-0">{formatCurrency(subtotal)}</p>
        </div>

        <div className="col-6 col-md-1 text-end">
          <Button
            variant="outline-danger"
            className="btn-sm"
            onClick={() => onRemove(item.productId)}
            aria-label={`Remove ${item.name}`}
          >
            <i className="bi bi-trash" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;