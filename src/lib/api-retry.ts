/**
 * API Retry Utility
 * 
 * Provides retry logic for failed API requests with exponential backoff.
 * Useful for handling transient network errors or temporary server issues.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Timeout, Too Many Requests, Server Errors
  onRetry: () => {},
};

/**
 * Check if an error is retryable based on status code
 */
function isRetryableError(status: number, retryableStatusCodes: number[]): boolean {
  return retryableStatusCodes.includes(status);
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a fetch request with exponential backoff
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param retryOptions - Retry configuration
 * @returns Promise that resolves with the response
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config = { ...DEFAULT_OPTIONS, ...retryOptions };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful or non-retryable error, return immediately
      if (response.ok || !isRetryableError(response.status, config.retryableStatusCodes)) {
        return response;
      }

      // If retryable error and we have retries left
      if (attempt < config.maxRetries) {
        const delay = calculateDelay(
          attempt,
          config.initialDelay,
          config.maxDelay,
          config.backoffMultiplier
        );

        lastError = new Error(`Request failed with status ${response.status}. Retrying...`);
        config.onRetry(attempt + 1, lastError);

        await sleep(delay);
        continue;
      }

      // No retries left, return the error response
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If network error and we have retries left
      if (attempt < config.maxRetries) {
        const delay = calculateDelay(
          attempt,
          config.initialDelay,
          config.maxDelay,
          config.backoffMultiplier
        );

        config.onRetry(attempt + 1, lastError);
        await sleep(delay);
        continue;
      }

      // No retries left, throw the error
      throw lastError;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Unknown error occurred");
}

/**
 * Wrapper for fetch that automatically retries on failure
 * 
 * @example
 * ```ts
 * const response = await apiFetch('/api/customers', {
 *   method: 'GET',
 *   headers: { 'Content-Type': 'application/json' }
 * });
 * ```
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  retryOptions?: RetryOptions
): Promise<Response> {
  return fetchWithRetry(url, options, retryOptions);
}

/**
 * Fetch JSON with retry logic
 * 
 * @example
 * ```ts
 * const data = await apiFetchJson<Customer[]>('/api/customers');
 * ```
 */
export async function apiFetchJson<T>(
  url: string,
  options: RequestInit = {},
  retryOptions?: RetryOptions
): Promise<T> {
  const response = await fetchWithRetry(url, options, retryOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

