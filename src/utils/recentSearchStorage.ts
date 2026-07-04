const RECENT_SEARCHES_KEY = "shopease_recent_searches";
const MAX_RECENT_SEARCHES = 6;

export const getRecentSearches = (): string[] => {
  try {
    const storedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);

    if (!storedSearches) {
      return [];
    }

    return JSON.parse(storedSearches) as string[];
  } catch {
    return [];
  }
};

export const saveRecentSearch = (searchText: string): void => {
  const normalizedSearch = searchText.trim();

  if (!normalizedSearch) {
    return;
  }

  const existingSearches = getRecentSearches();

  const updatedSearches = [
    normalizedSearch,
    ...existingSearches.filter(
      (item) => item.toLowerCase() !== normalizedSearch.toLowerCase()
    )
  ].slice(0, MAX_RECENT_SEARCHES);

  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
};

export const clearRecentSearches = (): void => {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
};