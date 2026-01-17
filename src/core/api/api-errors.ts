/**
 * Core API Error Utilities
 * 
 * Standardized error responses and error handling.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

/**
 * Create validation error response from Zod error
 */
export function createValidationErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: "Invalid payload",
      details: error.flatten(),
    },
    { status: 400 }
  );
}

/**
 * Create not found error response
 */
export function createNotFoundResponse(resource: string = "Resource"): NextResponse {
  return NextResponse.json(
    {
      error: `${resource} not found`,
      code: "NOT_FOUND",
    },
    { status: 404 }
  );
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    },
    { status: 401 }
  );
}

/**
 * Create forbidden error response
 */
export function createForbiddenResponse(message?: string): NextResponse {
  return NextResponse.json(
    {
      error: message || "You do not have permission to perform this action.",
      code: "FORBIDDEN",
    },
    { status: 403 }
  );
}

/**
 * Create internal server error response
 */
export function createInternalErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Create a generic error response with custom message and status code
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

