import type { Product } from "./product";

export interface CustomerPreferenceProfile {
  userId: string;
  preferredCategories: string[];
  preferredBrands: string[];
  averagePriceRange: {
    min: number;
    max: number;
  };
  recentlyViewedProductIds: string[];
  wishlistProductIds: string[];
  orderedProductIds: string[];
}

export interface ProductRecommendationScore {
  product: Product;
  score: number;
  reasons: string[];
}

export interface PersonalizedRecommendationResult {
  products: Product[];
  scoredProducts: ProductRecommendationScore[];
  profile: CustomerPreferenceProfile;
}