export type ProductCategory =
  | "Electronics"
  | "Clothing"
  | "Books"
  | "Footwear"
  | "Accessories";

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
}

export interface ProductFilters {
  searchText: string;
  category: ProductCategory | "";
  brand: string;
  priceRange: PriceRange;
  rating: RatingFilter;
}

export type PriceRange =
  | ""
  | "BELOW_1000"
  | "BETWEEN_1000_10000"
  | "BETWEEN_10000_50000"
  | "ABOVE_50000";

export type RatingFilter = "" | "ABOVE_4" | "ABOVE_3" | "ABOVE_2";