import { useEffect, useMemo, useState } from "react";

interface UseAdminTablePaginationOptions<T> {
  items: T[];
  defaultItemsPerPage?: number;
  resetDependencies?: unknown[];
}

export const useAdminTablePagination = <T,>({
  items,
  defaultItemsPerPage = 5,
  resetDependencies = []
}: UseAdminTablePaginationOptions<T>) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] =
    useState<number>(defaultItemsPerPage);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return items.slice(startIndex, endIndex);
  }, [items, safeCurrentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, ...resetDependencies]);

  return {
    currentPage: safeCurrentPage,
    totalPages,
    itemsPerPage,
    paginatedItems,
    setCurrentPage,
    setItemsPerPage
  };
};