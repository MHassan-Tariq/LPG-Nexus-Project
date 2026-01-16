/**
 * Example API Route with Rate Limiting
 * 
 * This demonstrates how to use rate limiting in API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, RateLimitPresets } from '@/lib/rate-limiter';
import { createSecureResponse } from '@/lib/security-headers';

// Create rate limiter for this route
const rateLimiter = createRateLimiter(RateLimitPresets.standard);

export async function GET(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = rateLimiter(request);
  if (rateLimitResponse) {
    return createSecureResponse(rateLimitResponse.body, {
      status: rateLimitResponse.status,
      headers: rateLimitResponse.headers,
    });
  }

  // Process request
  return createSecureResponse({
    message: 'Success',
    timestamp: new Date().toISOString(),
  });
}

