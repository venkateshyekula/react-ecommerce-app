export type ProductCategory =
  | "Electronics"
  | "Clothing"
  | "Books"
  | "Footwear"
  | "Accessories";

export interface ProductSizeChartRow {
  size: string;
  chest?: string;
  waist?: string;
  shoulder?: string;
  length?: string;
  footLength?: string;
  ukSize?: string;
  usSize?: string;
  euSize?: string;
  circumference?: string;
}

export interface ProductSizeChart {
  unit: "in" | "cm";
  rows: ProductSizeChartRow[];
  howToMeasure: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  brand: string;
  price: number;
  rating: number;
  image: string;
  stock: number;
  discount: number;
  specifications: Record<string, string>;
  sellerId?: string;
  sellerName?: string;
  sizeOptions?: string[];
  sizeChart?: ProductSizeChart;
}

export type PriceRange =
  | ""
  | "BELOW_1000"
  | "BETWEEN_1000_10000"
  | "BETWEEN_10000_50000"
  | "ABOVE_50000";

export type RatingFilter = "" | "ABOVE_4" | "ABOVE_3" | "ABOVE_2";

export type DiscountFilter = "" | "ABOVE_10" | "ABOVE_20" | "ABOVE_30";

export type AvailabilityFilter = "" | "IN_STOCK" | "OUT_OF_STOCK";

export type ProductSortOption =
  | "RELEVANCE"
  | "PRICE_LOW_TO_HIGH"
  | "PRICE_HIGH_TO_LOW"
  | "RATING_HIGH_TO_LOW"
  | "DISCOUNT_HIGH_TO_LOW"
  | "STOCK_HIGH_TO_LOW";

export type ProductViewMode = "grid" | "list";

export interface ProductFilters {
  searchText: string;
  category: ProductCategory | "";
  brand: string;
  priceRange: PriceRange;
  rating: RatingFilter;
  discount: DiscountFilter;
  availability: AvailabilityFilter;
  sortBy: ProductSortOption;
}