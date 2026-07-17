export type ProductCategory =
  | "Electronics"
  | "Clothing"
  | "Books"
  | "Footwear"
  | "Accessories"
  | "Men"
  | "Women"
  | "Kids"
  | "Home"
  | "Beauty";

  export type ProductGenderFilter = "" | "Men" | "Women" | "Boys" | "Girls";

export type ProductColorFilter =
  | ""
  | "Gold"
  | "Pink"
  | "Green"
  | "Blue"
  | "Black"
  | "Red"
  | "Purple"
  | "Silver"
  | "Yellow"
  | "White"
  | "Maroon"
  | "Multi"
  | "Navy Blue"
  | "Off White"
  | "Teal"
  | "Grey"
  | "Peach"
  | "Orange"
  | "Beige"
  | "Brown"
  | "Cream"
  | "Mustard"
  | "Turquoise Blue"
  | "Olive"
  | "Lime Green"
  | "Sea Green"
  | "Lavender"
  | "Magenta"
  | "Rose Gold"
  | "Rust"
  | "Burgundy"
  | "Mauve"
  | "Violet"
  | "Rose"
  | "Coral"
  | "Coffee Brown"
  | "Copper"
  | "Charcoal"
  | "Tan"
  | "Fluorescent Green"
  | "Taupe"
  | "Bronze"
  | "Khaki"
  | "Metallic"
  | "Nude"
  | "Champagne"
  | "Camel Brown"
  | "Grey Melange"
  | "Assorted"
  | "Transparent"
  | "Steel"
  | "Skin";

export interface ProductFilters {
  searchText: string;
  gender: ProductGenderFilter;
  category: ProductCategory | "";
  brand: string;
  color: ProductColorFilter;
  priceRange:
    | ""
    | "BELOW_1000"
    | "BETWEEN_1000_10000"
    | "BETWEEN_10000_50000"
    | "ABOVE_50000";
  priceMin: number;
  priceMax: number;  
  rating: "" | "ABOVE_5" | "ABOVE_4" | "ABOVE_3" | "ABOVE_2";
  discount:
    | ""
    | "ABOVE_10"
    | "ABOVE_20"
    | "ABOVE_30"
    | "ABOVE_40"
    | "ABOVE_50"
    | "ABOVE_60"
    | "ABOVE_70"
    | "ABOVE_80"
    | "ABOVE_90";
  availability: "" | "IN_STOCK" | "OUT_OF_STOCK";
  sortBy:
    | "RELEVANCE"
    | "PRICE_LOW_TO_HIGH"
    | "PRICE_HIGH_TO_LOW"
    | "RATING_HIGH_TO_LOW"
    | "DISCOUNT_HIGH_TO_LOW"
    | "STOCK_HIGH_TO_LOW";
}
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
  category: string;
  subcategory?: string;
  brand: string;
  price: number;
  rating: number;
  image: string;
  stock: number;
  discount: number;
  specifications: Record<string, string>;
  sellerId: string;
  sellerName: string;

  hsnCode?: string;
  gstRate?: number;
  cessRate?: number;
  unit?: string;
  isTaxInclusive?: boolean;
  taxCategory?: string;

  sellerGstin?: string;
  sellerPan?: string;
  sellerAddress?: string;

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
