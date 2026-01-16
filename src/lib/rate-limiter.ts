/**
 * Rate Limiter Utility
 * 
 * Provides rate limiting functionality to prevent abuse and DDoS attacks.
 * Uses in-memory storage (can be replaced with Redis for distributed systems).
 */

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    // Only start cleanup in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000);
    }
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(request: Request, keyGenerator?: (request: Request) => string): string {
    if (keyGenerator) {
      return keyGenerator(request);
    }

    // Default: Use IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return ip;
  }

  /**
   * Check if request should be rate limited
   * 
   * @param request - Request object
   * @param options - Rate limit options
   * @returns Object with allowed status and remaining requests
   */
  check(
    request: Request,
    options: RateLimitOptions
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(request, options.keyGenerator);
    const now = Date.now();
    const windowMs = options.windowMs;
    const maxRequests = options.maxRequests;

    // Get or create entry
    let entry = this.store[key];

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      this.store[key] = entry;
    }

    // Increment count
    entry.count++;

    const allowed = entry.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = entry.resetTime;

    return { allowed, remaining, resetTime };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    delete this.store[key];
  }

  /**
   * Cleanup interval (call on shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all rate limit entries (for testing)
   */
  clear(): void {
    this.store = {};
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Create rate limit middleware
 * 
 * @param options - Rate limit options
 * @returns Middleware function
 */
export function createRateLimiter(options: RateLimitOptions) {
    return (request: Request): Response | null => {
      const result = rateLimiter.check(request, options);

      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Too many requests',
            message: `Rate limit exceeded. Please try again after ${new Date(result.resetTime).toISOString()}`,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': options.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      // Add rate limit headers to response
      return null; // Continue processing
    };
  }

/**
 * Common rate limit presets
 */
export const RateLimitPresets = {
  // Strict: 10 requests per minute
  strict: { windowMs: 60 * 1000, maxRequests: 10 },
  // Standard: 100 requests per minute
  standard: { windowMs: 60 * 1000, maxRequests: 100 },
  // Lenient: 1000 requests per minute
  lenient: { windowMs: 60 * 1000, maxRequests: 1000 },
  // Per hour limits
  hourly: { windowMs: 60 * 60 * 1000, maxRequests: 1000 },
} as const;

// Export for testing purposes
export { rateLimiter };

