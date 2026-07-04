import type { CartItem as CartItemType } from "../../types/cart";
import { formatCurrency } from "../../utils/currencyFormatter";

interface CartItemProps {
  item: CartItemType;
  onIncrease: (cartItemId: string) => void;
  onDecrease: (cartItemId: string) => void;
  onRemove: (cartItemId: string) => void;
}

const CartItem = ({
  item,
  onIncrease,
  onDecrease,
  onRemove
}: CartItemProps) => {
  return (
    <div className="cart-item bg-white rounded-4 shadow-sm p-3 mb-3">
      <div className="row g-3 align-items-center">
        <div className="col-md-2">
           {/* FIXED: Replaced raw evaluation with a structured img tag */}
          <img 
            src={item.image} 
            alt={item.name} 
            className="img-fluid rounded"
          />
        </div>

        <div className="col-md-4">
          <h5 className="fw-bold mb-1">{item.name}</h5>
          <p className="text-muted small mb-1">{item.brand}</p>

          {item.selectedSize ? (
            <span className="cart-size-badge">
              Size: {item.selectedSize}
            </span>
          ) : null}

          <p className="fw-bold text-primary mt-2 mb-0">
            {formatCurrency(item.price)}
          </p>
        </div>

        <div className="col-md-3">
          <div className="quantity-control d-flex align-items-center">
            <button
              type="button"
              className="btn btn-outline-secondary quantity-btn"
              onClick={() => onDecrease(item.cartItemId)}
              disabled={item.quantity <= 1}
            >
              <i className="bi bi-dash" />
            </button>

            <span className="quantity-value fw-bold">
              {item.quantity}
            </span>

            <button
              type="button"
              className="btn btn-outline-secondary quantity-btn"
              onClick={() => onIncrease(item.cartItemId)}
              disabled={item.quantity >= item.stock}
            >
              <i className="bi bi-plus" />
            </button>
          </div>

          <p className="small text-muted mb-0 mt-2">
            Available stock: {item.stock}
          </p>
        </div>

        <div className="col-md-2 text-md-end">
          <p className="small text-muted mb-1">Subtotal</p>
          <h6 className="fw-bold mb-0">
            {formatCurrency(item.price * item.quantity)}
          </h6>
        </div>

        <div className="col-md-1 text-md-end">
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => onRemove(item.cartItemId)}
            aria-label={`Remove ${item.name}`}
          >
            <i className="bi bi-trash" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;