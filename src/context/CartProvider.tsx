import {
  useEffect,
  useMemo,
  useReducer,
  type ReactNode
} from "react";
import type {
  CartAction,
  CartItem,
  CartState
} from "../types/cart";
import type { Product } from "../types/product";
import {
  getFromStorage,
  setToStorage,
  STORAGE_KEYS
} from "../utils/storage";
import { CartContext } from "./cartContext";

interface CartProviderProps {
  children: ReactNode;
}

const getInitialCartState = (): CartState => {
  const storedCartItems = getFromStorage<CartItem[]>(
    STORAGE_KEYS.CART_ITEMS,
    []
  );

  return {
    items: storedCartItems
  };
};

const mapProductToCartItem = (product: Product): CartItem => {
  return {
    productId: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.image,
    stock: product.stock,
    quantity: 1
  };
};

const cartReducer = (
  state: CartState,
  action: CartAction
): CartState => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const product = action.payload;

      if (product.stock <= 0) {
        return state;
      }

      const existingItem = state.items.find(
        (item) => item.productId === product.id
      );

      if (existingItem) {
        return {
          items: state.items.map((item) => {
            if (item.productId !== product.id) {
              return item;
            }

            return {
              ...item,
              quantity: Math.min(item.quantity + 1, item.stock)
            };
          })
        };
      }

      return {
        items: [...state.items, mapProductToCartItem(product)]
      };
    }

    case "REMOVE_FROM_CART": {
      return {
        items: state.items.filter(
          (item) => item.productId !== action.payload
        )
      };
    }

    case "INCREASE_QUANTITY": {
      return {
        items: state.items.map((item) => {
          if (item.productId !== action.payload) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(item.quantity + 1, item.stock)
          };
        })
      };
    }

    case "DECREASE_QUANTITY": {
      return {
        items: state.items.map((item) => {
          if (item.productId !== action.payload) {
            return item;
          }

          return {
            ...item,
            quantity: Math.max(item.quantity - 1, 1)
          };
        })
      };
    }

    case "CLEAR_CART": {
      return {
        items: []
      };
    }

    case "RESTORE_CART": {
      return {
        items: action.payload
      };
    }

    default: {
      return state;
    }
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

  const addToCart = (product: Product): void => {
    dispatch({
      type: "ADD_TO_CART",
      payload: product
    });
  };

  const removeFromCart = (productId: string): void => {
    dispatch({
      type: "REMOVE_FROM_CART",
      payload: productId
    });
  };

  const increaseQuantity = (productId: string): void => {
    dispatch({
      type: "INCREASE_QUANTITY",
      payload: productId
    });
  };

  const decreaseQuantity = (productId: string): void => {
    dispatch({
      type: "DECREASE_QUANTITY",
      payload: productId
    });
  };

  const clearCart = (): void => {
    dispatch({
      type: "CLEAR_CART"
    });
  };

  const cartCount = useMemo(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  }, [state.items]);

  const cartTotal = useMemo(() => {
    return state.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [state.items]);

  const value = useMemo(
    () => ({
      cartItems: state.items,
      cartCount,
      cartTotal,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart
    }),
    [state.items, cartCount, cartTotal]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};