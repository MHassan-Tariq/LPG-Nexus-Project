/**
 * Core Search Utilities
 * 
 * Centralized search/filter logic for consistent search patterns.
 * Wraps existing search implementations without changing behavior.
 */

/**
 * Build Prisma search filter for text search
 * 
 * @param query - Search query string
 * @param fields - Array of field names to search in
 * @param mode - Search mode ("insensitive" for case-insensitive)
 * @returns Prisma OR filter object or undefined
 */
export function buildTextSearchFilter(
  query?: string,
  fields: string[] = [],
  mode: "default" | "insensitive" = "insensitive"
): { OR: Array<{ [key: string]: { contains: string; mode?: "insensitive" } }> } | undefined {
  if (!query || !query.trim() || fields.length === 0) {
    return undefined;
  }

  const searchMode = mode === "insensitive" ? { mode: "insensitive" as const } : {};

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: query.trim(),
        ...searchMode,
      },
    })),
  };
}

/**
 * Build nested relation search filter
 * 
 * @param query - Search query string
 * @param relationPath - Dot-separated relation path (e.g., "customer.name")
 * @param mode - Search mode
 * @returns Prisma nested filter object or undefined
 */
export function buildNestedSearchFilter(
  query?: string,
  relationPath: string = "",
  mode: "default" | "insensitive" = "insensitive"
): { [key: string]: { [key: string]: { contains: string; mode?: "insensitive" } } } | undefined {
  if (!query || !query.trim() || !relationPath) {
    return undefined;
  }

  const searchMode = mode === "insensitive" ? { mode: "insensitive" as const } : {};
  const parts = relationPath.split(".");
  
  if (parts.length === 0) return undefined;

  // Build nested object: { customer: { name: { contains: query, mode: "insensitive" } } }
  let filter: any = { contains: query.trim(), ...searchMode };
  
  for (let i = parts.length - 1; i >= 0; i--) {
    filter = { [parts[i]]: filter };
  }

  return filter;
}

/**
 * Build numeric search filter
 * 
 * @param query - Search query string
 * @param field - Field name to search
 * @returns Prisma filter object or undefined
 */
export function buildNumericSearchFilter(
  query?: string,
  field: string = "code"
): { [key: string]: number } | undefined {
  if (!query) return undefined;

  const numericQuery = Number(query);
  if (isNaN(numericQuery)) return undefined;

  return {
    [field]: numericQuery,
  };
}

/**
 * Combine multiple search filters with OR logic
 * 
 * @param filters - Array of filter objects
 * @returns Combined OR filter or undefined
 */
export function combineSearchFilters(
  filters: Array<Record<string, any> | undefined>
): { OR: Array<Record<string, any>> } | undefined {
  const validFilters = filters.filter((f): f is Record<string, any> => f !== undefined);
  
  if (validFilters.length === 0) return undefined;
  if (validFilters.length === 1) return { OR: validFilters };

  return { OR: validFilters };
}

