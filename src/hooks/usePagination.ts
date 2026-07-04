import { useEffect, useMemo, useState } from "react";

interface UsePaginationOptions<T> {
  items: T[];
  itemsPerPage: number;
  initialPage?: number;
}

interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  paginatedItems: T[];
  setCurrentPage: (page: number) => void;
  resetPage: () => void;
}

export const usePagination = <T,>({
  items,
  itemsPerPage,
  initialPage = 1
}: UsePaginationOptions<T>): UsePaginationResult<T> => {
  const [currentPage, setCurrentPageState] = useState<number>(initialPage);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  useEffect(() => {
    setCurrentPageState((previousPage) => {
      if (previousPage > totalPages) {
        return totalPages;
      }

      if (previousPage < 1) {
        return 1;
      }

      return previousPage;
    });
  }, [totalPages]);

  const setCurrentPage = (page: number): void => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPageState(safePage);
  };

  const resetPage = (): void => {
    setCurrentPageState(1);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const startItem = items.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(endIndex, items.length);

  return {
    currentPage,
    totalPages,
    startItem,
    endItem,
    paginatedItems,
    setCurrentPage,
    resetPage
  };
};