/**
 * CSRF Protection Utility
 * 
 * Provides CSRF token generation and validation to prevent Cross-Site Request Forgery attacks.
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get or create CSRF token from cookies
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();
    cookieStore.set(CSRF_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return token;
}

/**
 * Validate CSRF token from request
 * 
 * @param request - Request object
 * @returns True if token is valid, false otherwise
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

/**
 * CSRF protection middleware
 * 
 * Use this for state-changing operations (POST, PUT, DELETE, PATCH)
 */
export async function requireCsrfToken(request: Request): Promise<Response | null> {
  // Skip CSRF check for GET, HEAD, OPTIONS
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    return new Response(
      JSON.stringify({
        error: 'Invalid CSRF token',
        message: 'CSRF token validation failed. Please refresh the page and try again.',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null; // Continue processing
}

/**
 * Get CSRF token for client-side use
 * 
 * This should be called from a server component or API route
 * to expose the token to the client
 */
export async function getCsrfTokenForClient(): Promise<string> {
  return await getCsrfToken();
}

