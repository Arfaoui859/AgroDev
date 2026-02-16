import { retryWithBackoff } from './retry';

export interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Enhanced fetch wrapper with:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Better error messages
 * - Graceful degradation
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retries = 2,
    retryDelay = 500,
    timeout = 15000,
    onRetry,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchFn = async () => {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Only retry on network errors, not on HTTP errors
      if (error instanceof TypeError || error instanceof DOMException) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms: ${url}`);
        }
        throw new Error(`Network error fetching ${url}: ${error.message}`);
      }
      
      throw error;
    }
  };

  try {
    return await retryWithBackoff(
      fetchFn,
      retries,
      retryDelay
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to fetch ${url} after ${retries} retries:`, errorMessage);
    
    // Return a proper error response instead of throwing
    // This allows the UI to handle it gracefully
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: errorMessage,
        url: url,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Wrap fetch calls to handle common errors gracefully
 */
export async function safeFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data?: T; error?: string; isOffline: boolean }> {
  try {
    // Check if we're offline
    if (!navigator.onLine) {
      console.warn('⚠️ App is offline, requests will fail');
      return {
        error: 'Application is offline',
        isOffline: true,
      };
    }

    const response = await fetchWithRetry(url, {
      timeout: 10000,
      retries: 2,
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
        isOffline: false,
      };
    }

    const data = await response.json();
    return { data, isOffline: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Safe fetch error:', errorMessage);
    return {
      error: errorMessage,
      isOffline: !navigator.onLine,
    };
  }
}

// Global error handler for unhandled fetch failures
if (typeof window !== 'undefined') {
  // Listen for offline/online events
  window.addEventListener('offline', () => {
    console.warn('📱 Browser went offline');
  });

  window.addEventListener('online', () => {
    console.info('📱 Browser is back online');
  });
}
