// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for Request/Response APIs (for Node.js environment)
// Note: undici is included in Node.js 18+, but we import it explicitly for compatibility
if (typeof global.Request === 'undefined') {
  const { Request, Response, Headers } = require('undici');
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'test-secret-key'

