/* ==========================================================================
   Product Categories
   ========================================================================== */

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
  | "Beauty"
  | "Grocery";

/* ==========================================================================
   Product Filters
   ========================================================================== */

export type ProductGenderFilter =
  | ""
  | "Men"
  | "Women"
  | "Boys"
  | "Girls";

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

export type PriceRange =
  | ""
  | "BELOW_1000"
  | "BETWEEN_1000_10000"
  | "BETWEEN_10000_50000"
  | "ABOVE_50000";

export type RatingFilter =
  | ""
  | "ABOVE_5"
  | "ABOVE_4"
  | "ABOVE_3"
  | "ABOVE_2";

export type DiscountFilter =
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

export type AvailabilityFilter =
  | ""
  | "IN_STOCK"
  | "OUT_OF_STOCK";

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
  gender: ProductGenderFilter;
  category: ProductCategory | "";
  brand: string;
  color: ProductColorFilter;
  priceRange: PriceRange;
  priceMin: number;
  priceMax: number;
  rating: RatingFilter;
  discount: DiscountFilter;
  availability: AvailabilityFilter;
  sortBy: ProductSortOption;
}

/* ==========================================================================
   Product Size Chart
   ========================================================================== */

export interface ProductSizeChartRow {
  size: string;
  chest?: string;
  waist?: string;
  hip?: string;
  shoulder?: string;
  length?: string;
  footLength?: string;
  ukSize?: string;
  usSize?: string;
  euSize?: string;
  circumference?: string;
}

export interface ProductSizeChart {
  /**
   * Unit used by the stored measurement values.
   * The size-chart component can convert between cm and inches.
   */
  unit: "in" | "cm";
  rows: ProductSizeChartRow[];
  howToMeasure: string[];
}

/* ==========================================================================
   Product Size Options
   ========================================================================== */
export interface ProductSizeOption {
  size: string;
  stock?: number;
  available?: boolean;
}

/* ==========================================================================
   Product Media
   ========================================================================== */

export type ProductMediaType = "IMAGE" | "VIDEO";

export interface ProductMediaItem {
  id: string;
  type: ProductMediaType;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  label?: string;
}

/* ==========================================================================
   Product Color Variants
   ========================================================================== */

export interface ProductColorVariant {
  id: string;
  colorName: string;
  colorHex?: string;
  image: string;

  /**
   * When provided, clicking the color variant can open a separate
   * product-details record representing that color.
   */
  productId?: string;
}

/* ==========================================================================
   Product Offers
   ========================================================================== */

export type ProductOfferType =
  | "BANK"
  | "CASHBACK"
  | "COUPON"
  | "EMI"
  | "BEST_PRICE"
  | "OTHER";

export interface ProductOffer {
  id: string;
  title: string;
  description: string;
  offerType: ProductOfferType;
  terms?: string;
  code?: string;
  minimumSpend?: number;
  maximumDiscount?: number;
}

/* ==========================================================================
   Product Delivery Information
   ========================================================================== */

export interface ProductDeliveryInformation {
  estimatedDeliveryDays?: number;
  cashOnDeliveryAvailable?: boolean;
  returnPeriodDays?: number;
  exchangeAvailable?: boolean;
  freeDelivery?: boolean;
}

/* ==========================================================================
   Product Rating Summary
   ========================================================================== */

export interface ProductRatingBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ProductRatingSummary {
  totalRatings: number;
  totalReviews: number;
  verifiedBuyerCount?: number;
  customerPhotoCount?: number;
  ratingBreakdown?: ProductRatingBreakdown;
}

/* ==========================================================================
   Product
   ========================================================================== */

export interface Product {
  /* ------------------------------------------------------------------------
     Core Product Information
     ------------------------------------------------------------------------ */

  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  subcategory?: string;
  brand: string;
  price: number;
  rating: number;
  image: string;
  stock: number;
  discount: number;
  specifications: Record<string, string>;

  /* ------------------------------------------------------------------------
     Seller Information
     ------------------------------------------------------------------------ */

  sellerId: string;
  sellerName: string;
  sellerRating?: number;
  sellerRatingCount?: number;
  sellerSince?: string;
  sellerReturnRate?: number;
  sellerVerified?: boolean;

  /* ------------------------------------------------------------------------
     Tax and Marketplace Information
     ------------------------------------------------------------------------ */

  hsnCode?: string;
  gstRate?: number;
  cessRate?: number;
  unit?: string;
  isTaxInclusive?: boolean;
  taxCategory?: string;

  sellerGstin?: string;
  sellerPan?: string;
  sellerAddress?: string;

  /* ------------------------------------------------------------------------
     Size Information
     ------------------------------------------------------------------------ */

  sizeOptions?: Array<string | ProductSizeOption>;
  sizeChart?: ProductSizeChart;

  /* ------------------------------------------------------------------------
     Product Media
     ------------------------------------------------------------------------ */

  media?: ProductMediaItem[];
  colorVariants?: ProductColorVariant[];

  /* ------------------------------------------------------------------------
     Offers and Delivery
     ------------------------------------------------------------------------ */

  offers?: ProductOffer[];
  deliveryInformation?: ProductDeliveryInformation;

  /* ------------------------------------------------------------------------
     Product Details
     ------------------------------------------------------------------------ */

  productCode?: string;
  productDetails?: string[];
  materialAndCare?: string[];
  warranty?: string;
  countryOfOrigin?: string;

  /* ------------------------------------------------------------------------
     Product Trust and Rating Information
     ------------------------------------------------------------------------ */

  qualityVerified?: boolean;
  ratingSummary?: ProductRatingSummary;
}