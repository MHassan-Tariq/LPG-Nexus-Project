/**
 * Reusable Search Hook
 * 
 * Centralized search state management with debouncing.
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface UseSearchOptions {
  debounceMs?: number;
  onSearchChange?: (query: string) => void;
  paramName?: string;
}

export interface UseSearchReturn {
  query: string;
  resolvedQuery: string;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  isLoading: boolean;
}

/**
 * Hook for managing search state with debouncing and URL sync
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramName = options.paramName || "q";
  const debounceMs = options.debounceMs || 400;

  const urlQuery = searchParams.get(paramName) || "";
  const [query, setQueryState] = useState(urlQuery);
  const [resolvedQuery, setResolvedQuery] = useState(urlQuery);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with URL on mount
  useEffect(() => {
    if (urlQuery !== query) {
      setQueryState(urlQuery);
      setResolvedQuery(urlQuery);
    }
  }, [urlQuery]);

  // Debounce query updates
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setResolvedQuery(query);
      setIsLoading(false);
      options.onSearchChange?.(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, options]);

  // Update URL when resolved query changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (resolvedQuery) {
      params.set(paramName, resolvedQuery);
      params.set("page", "1"); // Reset to first page on search
    } else {
      params.delete(paramName);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [resolvedQuery, paramName, router, searchParams]);

  const setQuery = (newQuery: string) => {
    setQueryState(newQuery);
  };

  const clearSearch = () => {
    setQueryState("");
    setResolvedQuery("");
  };

  return {
    query,
    resolvedQuery,
    setQuery,
    clearSearch,
    isLoading,
  };
}

