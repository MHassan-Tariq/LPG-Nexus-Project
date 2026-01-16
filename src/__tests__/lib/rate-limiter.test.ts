/**
 * Unit Tests for Rate Limiter
 */

import { createRateLimiter, RateLimitPresets, rateLimiter } from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  const mockRequest = (ip: string = '127.0.0.1'): Request => {
    return new Request('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': ip,
      },
    });
  };

  // Reset rate limiter state before each test
  beforeEach(() => {
    // Clear the rate limiter store
    rateLimiter.clear();
  });

  // Clean up after all tests
  afterAll(() => {
    rateLimiter.destroy();
  });

  it('should allow requests within limit', () => {
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 5,
    });

    const request = mockRequest(`127.0.0.1-${Date.now()}`);

    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = limiter(request);
      expect(result).toBeNull();
    }
  });

  it('should block requests exceeding limit', () => {
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 2,
    });

    const uniqueIP = `127.0.0.1-${Date.now()}`;
    const request = mockRequest(uniqueIP);

    // First 2 requests should be allowed
    const result1 = limiter(request);
    const result2 = limiter(request);
    expect(result1).toBeNull();
    expect(result2).toBeNull();

    // Third request should be blocked
    const result3 = limiter(request);
    expect(result3).not.toBeNull();
    expect(result3?.status).toBe(429);
  });

  it('should use different keys for different IPs', () => {
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 1,
    });

    // Use unique IPs with timestamp to ensure isolation
    const timestamp = Date.now();
    const request1 = mockRequest(`127.0.0.1-${timestamp}`);
    const request2 = mockRequest(`127.0.0.2-${timestamp}`);

    // Both should be allowed (different IPs)
    const result1 = limiter(request1);
    const result2 = limiter(request2);

    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  it('should work with presets', () => {
    const limiter = createRateLimiter(RateLimitPresets.strict);
    const request = mockRequest(`127.0.0.1-${Date.now()}`);

    // Should allow requests within strict limit
    const result = limiter(request);
    expect(result).toBeNull();
  });
});

