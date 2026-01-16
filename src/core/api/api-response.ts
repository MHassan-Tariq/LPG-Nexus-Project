/**
 * Core API Response Utilities
 * 
 * Standardized response formatting for consistent API responses.
 */

import { NextResponse } from "next/server";
import { createPaginatedResponse, PaginatedResponse } from "@/core/data/pagination";

/**
 * Create standard success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json(createPaginatedResponse(data, page, pageSize, total));
}

/**
 * Create created response (201)
 */
export function createdResponse<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Create no content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

