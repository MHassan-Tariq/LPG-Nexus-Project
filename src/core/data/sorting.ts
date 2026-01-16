/**
 * Core Sorting Utilities
 * 
 * Centralized sorting logic for consistent ordering across tables.
 * Wraps existing sorting patterns without changing behavior.
 */

/**
 * Standard sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Parse sort parameters from URL
 * 
 * @param sortBy - Field name to sort by
 * @param sortOrder - Sort direction ("asc" or "desc")
 * @returns Sort configuration or default
 */
export function parseSortParams(
  sortBy?: string | null,
  sortOrder?: string | null
): { field: string; direction: SortDirection } {
  const direction: SortDirection = sortOrder === "desc" ? "desc" : "asc";
  const field = sortBy || "createdAt";

  return { field, direction };
}

/**
 * Build Prisma orderBy clause
 * 
 * @param field - Field name to sort by
 * @param direction - Sort direction
 * @returns Prisma orderBy object
 */
export function buildOrderBy(field: string, direction: SortDirection = "desc") {
  return {
    [field]: direction,
  };
}

/**
 * Default sort orders for common fields
 */
export const DEFAULT_SORT_ORDERS: Record<string, SortDirection> = {
  createdAt: "desc",
  updatedAt: "desc",
  deliveryDate: "desc",
  expenseDate: "desc",
  paidOn: "desc",
  recordedAt: "desc",
  performedAt: "desc",
  customerCode: "asc",
  name: "asc",
  serialNumber: "asc",
};

/**
 * Get default sort order for a field
 * 
 * @param field - Field name
 * @returns Default sort direction
 */
export function getDefaultSortOrder(field: string): SortDirection {
  return DEFAULT_SORT_ORDERS[field] || "desc";
}

