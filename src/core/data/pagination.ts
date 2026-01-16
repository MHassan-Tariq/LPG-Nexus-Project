/**
 * Core Pagination Utilities
 * 
 * Centralized pagination logic for consistent use across the application.
 * Wraps existing pagination patterns without changing behavior.
 */

import { z } from "zod";

/**
 * Standard pagination parameters schema
 * Used across all API routes and pages
 */
export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().min(1).max(120).optional(),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

/**
 * Parse pagination parameters from URL search params
 * 
 * @param searchParams - URL search params object
 * @returns Parsed and validated pagination params
 */
export function parsePaginationParams(
  searchParams: URLSearchParams | Record<string, string | undefined>
): PaginationParams {
  const params = searchParams instanceof URLSearchParams
    ? {
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
        q: searchParams.get("q") ?? undefined,
      }
    : {
        page: searchParams.page,
        pageSize: searchParams.pageSize,
        q: searchParams.q,
      };

  return paginationParamsSchema.parse(params);
}

/**
 * Calculate skip and take values for Prisma queries
 * 
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Object with skip and take values
 */
export function getPaginationSkipTake(page: number, pageSize: number) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/**
 * Calculate total pages from total items and page size
 * 
 * @param total - Total number of items
 * @param pageSize - Number of items per page
 * @returns Total number of pages
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}

/**
 * Standard paginated response structure
 */
export interface PaginatedResponse<T = unknown> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Create a standard paginated response
 * 
 * @param data - Array of items for current page
 * @param page - Current page number
 * @param pageSize - Items per page
 * @param total - Total number of items
 * @returns Standardized paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    page,
    pageSize,
    total,
    totalPages: calculateTotalPages(total, pageSize),
  };
}

