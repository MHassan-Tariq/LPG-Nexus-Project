/**
 * Unit Tests for Pagination Utilities
 */

import { parsePaginationParams, getPaginationSkipTake } from '@/core/data/pagination';

describe('Pagination Utilities', () => {
  describe('parsePaginationParams', () => {
    it('should parse default pagination params', () => {
      const params = new URLSearchParams();
      const result = parsePaginationParams(params);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.q).toBeUndefined();
    });

    it('should parse custom page and pageSize', () => {
      const params = new URLSearchParams({
        page: '2',
        pageSize: '20',
      });
      const result = parsePaginationParams(params);

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(20);
    });

    it('should parse search query', () => {
      const params = new URLSearchParams({
        q: 'test search',
      });
      const result = parsePaginationParams(params);

      expect(result.q).toBe('test search');
    });

    it('should handle invalid page numbers by throwing error', () => {
      const params = new URLSearchParams({
        page: 'invalid',
      });
      
      // parsePaginationParams uses Zod which throws on invalid input
      // In actual usage, this would be caught and handled by error handling middleware
      expect(() => parsePaginationParams(params)).toThrow();
    });

    it('should handle invalid pageSize by throwing error', () => {
      const params = new URLSearchParams({
        pageSize: 'invalid',
      });
      
      // parsePaginationParams uses Zod which throws on invalid input
      // In actual usage, this would be caught and handled by error handling middleware
      expect(() => parsePaginationParams(params)).toThrow();
    });
  });

  describe('getPaginationSkipTake', () => {
    it('should calculate skip and take correctly', () => {
      const { skip, take } = getPaginationSkipTake(1, 10);
      expect(skip).toBe(0);
      expect(take).toBe(10);
    });

    it('should calculate skip for page 2', () => {
      const { skip, take } = getPaginationSkipTake(2, 10);
      expect(skip).toBe(10);
      expect(take).toBe(10);
    });

    it('should calculate skip for page 3 with pageSize 20', () => {
      const { skip, take } = getPaginationSkipTake(3, 20);
      expect(skip).toBe(40);
      expect(take).toBe(20);
    });
  });
});

