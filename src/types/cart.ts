import type { Product } from "./product";

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
  selectedSize?: string;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | {
      type: "ADD_TO_CART";
      payload: {
        product: Product;
        selectedSize?: string;
      };
    }
  | {
      type: "REMOVE_FROM_CART";
      payload: {
        cartItemId: string;
      };
    }
  | {
      type: "INCREASE_QUANTITY";
      payload: {
        cartItemId: string;
      };
    }
  | {
      type: "DECREASE_QUANTITY";
      payload: {
        cartItemId: string;
      };
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
  addToCart: (product: Product, selectedSize?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  clearCart: () => void;
}