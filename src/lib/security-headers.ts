/**
 * Security Headers Utility
 * 
 * Provides security headers for API routes and pages to prevent common attacks.
 */

export interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Get security headers for API responses
 */
export function getSecurityHeaders(): SecurityHeaders {
  return {
    // Prevent XSS attacks
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent clickjacking
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
    
    // Force HTTPS in production
    'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
      ? 'max-age=31536000; includeSubDomains; preload' 
      : '',
    
    // Prevent MIME type sniffing
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

/**
 * Apply security headers to a Response
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = getSecurityHeaders();
  
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });
  
  return response;
}

/**
 * Create a Response with security headers
 */
export function createSecureResponse(
  body: any,
  init?: ResponseInit
): Response {
  const response = new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    }
  );
  
  return applySecurityHeaders(response);
}

