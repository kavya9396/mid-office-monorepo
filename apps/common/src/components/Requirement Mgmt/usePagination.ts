import { useMemo, useState } from "react";

export type UsePaginationResult<T> = {
  /** Current page, 1-based. Always within 1..pageCount. */
  page: number;
  setPage: (page: number) => void;
  pageCount: number;
  /** Items of the current page. */
  pageItems: T[];
  /** True when the items do not fit on one page. */
  hasMultiplePages: boolean;
  resetPage: () => void;
};

export function usePagination<T>(items: T[], pageSize: number): UsePaginationResult<T> {
  const [requestedPage, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pageCount);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    pageCount,
    pageItems,
    hasMultiplePages: items.length > pageSize,
    resetPage: () => setPage(1),
  };
}
