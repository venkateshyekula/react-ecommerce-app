import type { Product } from "./product";

export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | {
      type: "ADD_TO_CART";
      payload: Product;
    }
  | {
      type: "REMOVE_FROM_CART";
      payload: string;
    }
  | {
      type: "INCREASE_QUANTITY";
      payload: string;
    }
  | {
      type: "DECREASE_QUANTITY";
      payload: string;
    }
  | {
      type: "CLEAR_CART";
    }
  | {
      type: "RESTORE_CART";
      payload: CartItem[];
    };

export interface CartContextValue {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
}