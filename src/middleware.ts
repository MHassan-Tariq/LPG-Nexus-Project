import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders } from '@/lib/security-headers';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers to all responses
  applySecurityHeaders(response);

  // Add rate limiting headers (actual rate limiting should be done in API routes)
  response.headers.set('X-RateLimit-Policy', '1000;w=60');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
