/**
 * Reusable Pagination Hook
 * 
 * Centralized pagination state management for consistent use across pages.
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  skip: number;
  take: number;
  hasNext: boolean;
  hasPrev: boolean;
  totalPages: number;
  startItem: number;
  endItem: number;
}

/**
 * Hook for managing pagination state with URL sync
 */
export function usePagination(
  total: number,
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialPage = parseInt(searchParams.get("page") || "1") || options.initialPage || 1;
  const initialPageSize = parseInt(searchParams.get("pageSize") || "10") || options.initialPageSize || 10;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Sync with URL params
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1");
    const urlPageSize = parseInt(searchParams.get("pageSize") || "10");
    
    if (urlPage !== page) setPageState(urlPage);
    if (urlPageSize !== pageSize) setPageSizeState(urlPageSize);
  }, [searchParams, page, pageSize]);

  const setPage = (newPage: number) => {
    setPageState(newPage);
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
    options.onPageChange?.(newPage);
  };

  const setPageSize = (newPageSize: number) => {
    setPageSizeState(newPageSize);
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newPageSize.toString());
    params.set("page", "1"); // Reset to first page
    router.push(`?${params.toString()}`, { scroll: false });
    options.onPageSizeChange?.(newPageSize);
  };

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);
  const skip = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  const take = pageSize;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    skip,
    take,
    hasNext,
    hasPrev,
    totalPages,
    startItem,
    endItem,
  };
}

