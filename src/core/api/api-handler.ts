/**
 * Core API Handler
 * 
 * Standardized API route handler that centralizes:
 * - Authentication
 * - Permission checks
 * - Tenant filtering
 * - Error handling
 * - Response formatting
 * 
 * Routes remain externally unchanged - this is internal refactoring.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
import { requireEditPermission, requireViewPermission } from "@/core/permissions/permission-guards";
import { parsePaginationParams, PaginationParams } from "@/core/data/pagination";

/**
 * Standard API handler context
 */
export interface ApiHandlerContext {
  request: NextRequest;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  tenantFilter: Awaited<ReturnType<typeof getTenantFilter>>;
  searchParams: URLSearchParams;
  pagination?: PaginationParams;
}

/**
 * API handler function type
 */
export type ApiHandler<T = any> = (context: ApiHandlerContext) => Promise<NextResponse<T>>;

/**
 * Wrapper for GET handlers with automatic:
 * - Authentication check
 * - View permission check (optional)
 * - Tenant filter
 * - Pagination parsing
 * 
 * @param handler - Handler function
 * @param options - Handler options
 */
export function createGetHandler<T = any>(
  handler: ApiHandler<T>,
  options?: {
    requirePermission?: string;
    requirePagination?: boolean;
  }
) {
  return async (request: NextRequest): Promise<NextResponse<T> | NextResponse<{ error: string }>> => {
    try {
      // Check authentication
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check view permission if required
      if (options?.requirePermission) {
        const permissionError = await requireViewPermission(options.requirePermission);
        if (permissionError) {
          return permissionError as NextResponse<{ error: string }>;
        }
      }

      // Get tenant filter
      const tenantFilter = await getTenantFilter();

      // Parse search params
      const { searchParams } = new URL(request.url);

      // Parse pagination if required
      let pagination: PaginationParams | undefined;
      if (options?.requirePagination) {
        pagination = parsePaginationParams(searchParams);
      }

      // Create context
      const context: ApiHandlerContext = {
        request,
        user,
        tenantFilter,
        searchParams,
        pagination,
      };

      // Call handler
      return await handler(context);
    } catch (error) {
      console.error("API handler error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper for POST/PATCH/DELETE handlers with automatic:
 * - Authentication check
 * - Edit permission check (required)
 * - Tenant filter
 * 
 * @param handler - Handler function
 * @param options - Handler options
 */
export function createMutationHandler<T = any>(
  handler: ApiHandler<T>,
  options: {
    requirePermission: string;
  }
) {
  return async (request: NextRequest): Promise<NextResponse<T> | NextResponse<{ error: string }>> => {
    try {
      // Check authentication
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check edit permission (required for mutations)
      const permissionError = await requireEditPermission(options.requirePermission);
      if (permissionError) {
        return permissionError as NextResponse<{ error: string }>;
      }

      // Get tenant filter
      const tenantFilter = await getTenantFilter();

      // Parse search params
      const { searchParams } = new URL(request.url);

      // Create context
      const context: ApiHandlerContext = {
        request,
        user,
        tenantFilter,
        searchParams,
      };

      // Call handler
      return await handler(context);
    } catch (error) {
      console.error("API handler error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Parse JSON body with error handling
 */
export async function parseJsonBody<T = any>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error("Invalid JSON body");
  }
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

