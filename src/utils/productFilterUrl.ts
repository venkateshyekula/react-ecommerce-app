import type { ProductFilters } from "../types/product";

const DEFAULT_MIN_PRICE = 0;
const DEFAULT_MAX_PRICE = 100000;

export const getProductFiltersFromSearchParams = (
  searchParams: URLSearchParams,
  defaultFilters: ProductFilters
): ProductFilters => {
  return {
    ...defaultFilters,
    searchText: searchParams.get("search") ?? defaultFilters.searchText,
    gender:
      (searchParams.get("gender") as ProductFilters["gender"]) ??
      defaultFilters.gender,
    category:
      (searchParams.get("category") as ProductFilters["category"]) ??
      defaultFilters.category,
    brand: searchParams.get("brand") ?? defaultFilters.brand,
    color:
      (searchParams.get("color") as ProductFilters["color"]) ??
      defaultFilters.color,
    priceRange:
      (searchParams.get("priceRange") as ProductFilters["priceRange"]) ??
      defaultFilters.priceRange,
    priceMin: Number(searchParams.get("min") ?? defaultFilters.priceMin),
    priceMax: Number(searchParams.get("max") ?? defaultFilters.priceMax),
    rating:
      (searchParams.get("rating") as ProductFilters["rating"]) ??
      defaultFilters.rating,
    discount:
      (searchParams.get("discount") as ProductFilters["discount"]) ??
      defaultFilters.discount,
    availability:
      (searchParams.get("availability") as ProductFilters["availability"]) ??
      defaultFilters.availability,
    sortBy:
      (searchParams.get("sort") as ProductFilters["sortBy"]) ??
      defaultFilters.sortBy
  };
};

export const getSearchParamsFromProductFilters = (
  filters: ProductFilters
): URLSearchParams => {
  const params = new URLSearchParams();

  if (filters.searchText) {
    params.set("search", filters.searchText);
  }

  if (filters.gender) {
    params.set("gender", filters.gender);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.brand) {
    params.set("brand", filters.brand);
  }

  if (filters.color) {
    params.set("color", filters.color);
  }

  if (filters.priceRange) {
    params.set("priceRange", filters.priceRange);
  }

  if (filters.priceMin > DEFAULT_MIN_PRICE) {
    params.set("min", String(filters.priceMin));
  }

  if (filters.priceMax < DEFAULT_MAX_PRICE) {
    params.set("max", String(filters.priceMax));
  }

  if (filters.rating) {
    params.set("rating", filters.rating);
  }

  if (filters.discount) {
    params.set("discount", filters.discount);
  }

  if (filters.availability) {
    params.set("availability", filters.availability);
  }

  if (filters.sortBy !== "RELEVANCE") {
    params.set("sort", filters.sortBy);
  }

  return params;
};

export const shouldSyncFilterToUrl = (key: keyof ProductFilters): boolean => {
  return key !== "category";
};