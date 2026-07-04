import type { Product } from "../types/product";

const RECENTLY_VIEWED_KEY = "shopease_recently_viewed_products";
const MAX_RECENTLY_VIEWED = 8;

export type RecentlyViewedProduct = Pick<
  Product,
  | "id"
  | "name"
  | "brand"
  | "category"
  | "price"
  | "rating"
  | "image"
  | "discount"
  | "stock"
  | "description"
  | "specifications"
  | "sellerId"
  | "sellerName"
>;

export const getRecentlyViewedProducts = (): RecentlyViewedProduct[] => {
  try {
    const storedProducts = localStorage.getItem(RECENTLY_VIEWED_KEY);

    if (!storedProducts) {
      return [];
    }

    return JSON.parse(storedProducts) as RecentlyViewedProduct[];
  } catch {
    return [];
  }
};

export const saveRecentlyViewedProduct = (product: Product): void => {
  const existingProducts = getRecentlyViewedProducts();

  const recentProduct: RecentlyViewedProduct = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    rating: product.rating,
    image: product.image,
    discount: product.discount,
    stock: product.stock,
    description: product.description,
    specifications: product.specifications,
    sellerId: product.sellerId,
    sellerName: product.sellerName
  };

  const updatedProducts = [
    recentProduct,
    ...existingProducts.filter((item) => item.id !== product.id)
  ].slice(0, MAX_RECENTLY_VIEWED);

  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updatedProducts));
};

export const clearRecentlyViewedProducts = (): void => {
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
};