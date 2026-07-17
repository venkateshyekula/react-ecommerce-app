import { orderService } from "./orderService";
import { productService } from "./productService";
import type { CartItem } from "../types/cart";
import type { Product } from "../types/product";
import type { PersonalizedRecommendationResult } from "../types/personalization";
import {
  buildCustomerPreferenceProfile,
  getFallbackRecommendedProducts,
  scoreProductsForCustomer,
} from "../utils/personalizationUtils";
import { getFromStorage, STORAGE_KEYS } from "../utils/storage";
import { getRecentlyViewedProducts } from "../utils/recentlyViewedStorage";

export const personalizationService = {
  async getRecommendedProductsForUser(
    userId: string,
    cartItems: CartItem[] = [],
    limit = 12
  ): Promise<PersonalizedRecommendationResult> {
    const [products, orders] = await Promise.all([
      productService.getProducts(),
      orderService.getOrdersByUserId(userId),
    ]);

    const wishlistItems = getFromStorage<Product[]>(
      STORAGE_KEYS.WISHLIST_ITEMS,
      []
    );
    const recentlyViewedProductIds = getRecentlyViewedProducts().map(
      (product) => product.id
    );

    const profile = buildCustomerPreferenceProfile({
      userId,
      products,
      orders,
      wishlistItems,
      cartItems,
      recentlyViewedProductIds,
    });

    const scoredProducts = scoreProductsForCustomer(products, profile);

    const recommendedProducts =
      scoredProducts.length > 0
        ? scoredProducts.slice(0, limit).map((item) => item.product)
        : getFallbackRecommendedProducts(products, limit);

    return {
      products: recommendedProducts,
      scoredProducts: scoredProducts.slice(0, limit),
      profile
    };
  },

  getRecommendationsFromProducts(
    products: Product[],
    limit = 12
  ): Product[] {
    return getFallbackRecommendedProducts(products, limit);
  }
};