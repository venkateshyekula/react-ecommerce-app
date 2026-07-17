import type { CartItem } from "../types/cart";
import type { Order } from "../types/order";
import type { Product } from "../types/product";
import type {
  CustomerPreferenceProfile,
  ProductRecommendationScore,
} from "../types/personalization";

interface BuildPreferenceProfileInput {
  userId: string;
  products: Product[];
  orders: Order[];
  wishlistItems: Product[];
  cartItems: CartItem[];
  recentlyViewedProductIds: string[];
}

const getTopValues = (values: string[], limit = 5): string[] => {
  const countMap = values.reduce<Record<string, number>>((map, value) => {
    if (!value) {
      return map;
    }

    map[value] = (map[value] ?? 0) + 1;
    return map;
  }, {});

  return Object.entries(countMap)
    .sort((first, second) => second[1] - first[1])
    .slice(0, limit)
    .map(([value]) => value);
};

const getProductsByIds = (
  products: Product[],
  productIds: string[]
): Product[] => {
  const productIdSet = new Set(productIds);

  return products.filter((product) => productIdSet.has(product.id));
};

export const buildCustomerPreferenceProfile = ({
  userId,
  products,
  orders,
  wishlistItems,
  cartItems,
  recentlyViewedProductIds,
}: BuildPreferenceProfileInput): CustomerPreferenceProfile => {
  const orderedProductIds = orders.flatMap((order) =>
    order.items.map((item) => item.productId)
  );

  const wishlistProductIds = wishlistItems.map((item) => item.id);

  const cartProductIds = cartItems.map((item) => item.productId);

  const signalProductIds = [
    ...orderedProductIds,
    ...wishlistProductIds,
    ...cartProductIds,
    ...recentlyViewedProductIds
  ];

  const signalProducts = getProductsByIds(products, signalProductIds);

  const categories = [
    ...signalProducts.map((product) => product.category),
    ...cartItems.map((item) => item.category ?? ""),
  ];

  const brands = [
    ...signalProducts.map((product) => product.brand),
    ...cartItems.map((item) => item.brand),
    ...orders.flatMap((order) => order.items.map((item) => item.brand)),
  ];

  const prices = [
    ...signalProducts.map((product) => product.price),
    ...cartItems.map((item) => item.price),
    ...orders.flatMap((order) => order.items.map((item) => item.price)),
  ].filter((price) => price > 0);

  const averagePrice =
    prices.length > 0
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0;

  return {
    userId,
    preferredCategories: getTopValues(categories, 5),
    preferredBrands: getTopValues(brands, 5),
    averagePriceRange: {
      min: Math.max(0, Math.floor(averagePrice * 0.65)),
      max: Math.ceil(averagePrice * 1.45)
    },
    recentlyViewedProductIds,
    wishlistProductIds,
    orderedProductIds,
  };
};

export const scoreProductsForCustomer = (
  products: Product[],
  profile: CustomerPreferenceProfile
): ProductRecommendationScore[] => {
  const excludedProductIds = new Set([
    ...profile.orderedProductIds,
    ...profile.wishlistProductIds
  ]);

  return products
    .filter((product) => !excludedProductIds.has(product.id))
    .map((product) => {
      let score = 0;
      const reasons: string[] = [];

      if (profile.preferredCategories.includes(product.category)) {
        score += 35;
        reasons.push(`Matches your interest in ${product.category}`);
      }

      if (profile.preferredBrands.includes(product.brand)) {
        score += 25;
        reasons.push(`Similar brand preference: ${product.brand}`);
      }

      if (
        product.price >= profile.averagePriceRange.min &&
        product.price <= profile.averagePriceRange.max
      ) {
        score += 15;
        reasons.push("Fits your usual shopping price range");
      }

      if (product.rating >= 4) {
        score += 10;
        reasons.push("Highly rated product");
      }

      if (product.discount >= 20) {
        score += 10;
        reasons.push("Good discount available");
      }

      if (product.stock > 0) {
        score += 5;
      }

      return {
        product,
        score,
        reasons,
      };
    })
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score);
};

export const getFallbackRecommendedProducts = (
  products: Product[],
  limit = 12
): Product[] => {
  return [...products]
    .filter((product) => product.stock > 0)
    .sort((first, second) => {
      const firstScore = first.rating * 10 + first.discount;
      const secondScore = second.rating * 10 + second.discount;

      return secondScore - firstScore;
    })
    .slice(0, limit);
};