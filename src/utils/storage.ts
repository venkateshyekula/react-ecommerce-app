export const STORAGE_KEYS = {
  CURRENT_USER: "ecommerce_current_user",
  CART_ITEMS: "ecommerce_cart_items"
} as const;

export const getFromStorage = <T>(key: string, fallbackValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
      return fallbackValue;
    }

    return JSON.parse(storedValue) as T;
  } catch {
    return fallbackValue;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeFromStorage = (key: string): void => {
  localStorage.removeItem(key);
};

export const clearStorageKey = (key: string): void => {
  localStorage.removeItem(key);
};