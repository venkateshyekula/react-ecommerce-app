import {
  useEffect,
  useMemo,
  useReducer,
  type ReactNode
} from "react";
import type { Product } from "../types/product";
import type {
  CartAction,
  CartContextValue,
  CartItem,
  CartState
} from "../types/cart";
import {
  getFromStorage,
  setToStorage,
  STORAGE_KEYS
} from "../utils/storage";
import { CartContext } from "./CartContextObject";

interface CartProviderProps {
  children: ReactNode;
}

const createCartItemId = (
  productId: string,
  selectedSize?: string
): string => {
  return selectedSize ? `${productId}__size__${selectedSize}` : productId;
};

const mapProductToCartItem = (
  product: Product,
  selectedSize?: string
): CartItem => {
  return {
    cartItemId: createCartItemId(product.id, selectedSize),
    productId: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.image,
    stock: product.stock,
    quantity: 1,
    selectedSize
  };
};

const normalizeStoredCartItems = (items: CartItem[]): CartItem[] => {
  return items.map((item) => ({
    ...item,
    cartItemId:
      item.cartItemId ??
      createCartItemId(item.productId, item.selectedSize)
  }));
};

const getInitialCartState = (): CartState => {
  const storedItems = getFromStorage<CartItem[]>(
    STORAGE_KEYS.CART_ITEMS,
    []
  );

  return {
    items: normalizeStoredCartItems(storedItems)
  };
};

const cartReducer = (
  state: CartState,
  action: CartAction
): CartState => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const { product, selectedSize } = action.payload;
      const cartItemId = createCartItemId(product.id, selectedSize);

      const existingItem = state.items.find(
        (item) => item.cartItemId === cartItemId
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + 1, item.stock)
                }
              : item
          )
        };
      }

      return {
        items: [...state.items, mapProductToCartItem(product, selectedSize)]
      };
    }

    case "REMOVE_FROM_CART":
      return {
        items: state.items.filter(
          (item) => item.cartItemId !== action.payload.cartItemId
        )
      };

    case "INCREASE_QUANTITY":
      return {
        items: state.items.map((item) =>
          item.cartItemId === action.payload.cartItemId
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.stock)
              }
            : item
        )
      };

    case "DECREASE_QUANTITY":
      return {
        items: state.items.map((item) =>
          item.cartItemId === action.payload.cartItemId
            ? {
                ...item,
                quantity: Math.max(item.quantity - 1, 1)
              }
            : item
        )
      };

    case "CLEAR_CART":
      return {
        items: []
      };

    case "RESTORE_CART":
      return {
        items: normalizeStoredCartItems(action.payload)
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [state, dispatch] = useReducer(
    cartReducer,
    undefined,
    getInitialCartState
  );

  useEffect(() => {
    setToStorage<CartItem[]>(STORAGE_KEYS.CART_ITEMS, state.items);
  }, [state.items]);

  const addToCart = (product: Product, selectedSize?: string): void => {
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        product,
        selectedSize
      }
    });
  };

  const removeFromCart = (cartItemId: string): void => {
    dispatch({
      type: "REMOVE_FROM_CART",
      payload: {
        cartItemId
      }
    });
  };

  const increaseQuantity = (cartItemId: string): void => {
    dispatch({
      type: "INCREASE_QUANTITY",
      payload: {
        cartItemId
      }
    });
  };

  const decreaseQuantity = (cartItemId: string): void => {
    dispatch({
      type: "DECREASE_QUANTITY",
      payload: {
        cartItemId
      }
    });
  };

  const clearCart = (): void => {
    dispatch({
      type: "CLEAR_CART"
    });
  };

  const value = useMemo<CartContextValue>(
    () => ({
      cartItems: state.items,
      cartCount: state.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      cartTotal: state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart
    }),
    [state.items]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};