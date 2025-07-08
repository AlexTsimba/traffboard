/**
 * Enhanced API client with circuit breaker pattern and exponential backoff
 * Prevents infinite retry loops that cause performance issues
 */

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

interface APIClientOptions {
  maxRetries?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
  baseDelay?: number;
}

export class APIClient {
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private options: Required<APIClientOptions>;

  constructor(options: APIClientOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      circuitBreakerThreshold: options.circuitBreakerThreshold ?? 5,
      circuitBreakerTimeout: options.circuitBreakerTimeout ?? 30_000, // 30 seconds
      baseDelay: options.baseDelay ?? 1000, // 1 second
    };
  }

  /**
   * Fetch with circuit breaker and exponential backoff
   */
  async fetchWithRetry(url: string, options: RequestInit = {}, customRetries?: number): Promise<Response> {
    const maxRetries = customRetries ?? this.options.maxRetries;
    this.checkCircuitBreaker(url);

    return this.executeRetryLoop(url, options, maxRetries);
  }

  private checkCircuitBreaker(url: string): void {
    const circuit = this.getOrCreateCircuit(url);
    if (circuit.isOpen && Date.now() - circuit.lastFailure < this.options.circuitBreakerTimeout) {
      throw new Error(`Circuit breaker open for ${url}. Too many recent failures.`);
    }
  }

  private async executeRetryLoop(url: string, options: RequestInit, maxRetries: number): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.attemptFetch(url, options);

        if (response.ok) {
          this.resetCircuit(url);
          return response;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = this.handleRetryError(error, url);

        if (this.shouldStopRetrying(lastError, attempt, maxRetries)) {
          break;
        }

        await this.waitForRetry(attempt);
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  private async attemptFetch(url: string, options: RequestInit): Promise<Response> {
    return fetch(url, {
      ...options,
      signal: options.signal, // Respect abort signals
    });
  }

  private handleRetryError(error: unknown, url: string): Error {
    const lastError = error instanceof Error ? error : new Error("Unknown error");
    this.recordFailure(url);
    return lastError;
  }

  private shouldStopRetrying(error: Error, attempt: number, maxRetries: number): boolean {
    // Don't retry on abort signal
    if (error.name === "AbortError") {
      throw error;
    }

    return attempt === maxRetries;
  }

  private async waitForRetry(attempt: number): Promise<void> {
    const delay = this.calculateDelay(attempt);
    await this.sleep(delay);
  }

  /**
   * Enhanced fetch for server actions and API routes
   */
  async safeAPICall<T>(
    url: string,
    options: RequestInit = {},
    parser: (response: Response) => Promise<T> = (r) => r.json() as Promise<T>,
  ): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
      const response = await this.fetchWithRetry(url, options);
      const data = await parser(response);
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.warn(`API call failed for ${url}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private getOrCreateCircuit(url: string): CircuitBreakerState {
    const existing = this.circuitBreakers.get(url);
    if (!existing) {
      const newCircuit = {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      };
      this.circuitBreakers.set(url, newCircuit);
      return newCircuit;
    }
    return existing;
  }

  private recordFailure(url: string): void {
    const circuit = this.getOrCreateCircuit(url);
    circuit.failures++;
    circuit.lastFailure = Date.now();

    // Open circuit if threshold exceeded
    if (circuit.failures >= this.options.circuitBreakerThreshold) {
      circuit.isOpen = true;
      console.warn(`Circuit breaker opened for ${url} after ${circuit.failures} failures`);
    }

    this.circuitBreakers.set(url, circuit);
  }

  private resetCircuit(url: string): void {
    const circuit = this.getOrCreateCircuit(url);
    circuit.failures = 0;
    circuit.isOpen = false;
    this.circuitBreakers.set(url, circuit);
  }

  private calculateDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    const exponentialDelay = this.options.baseDelay * Math.pow(2, attempt - 1);

    // Add jitter to prevent thundering herd
    // eslint-disable-next-line sonarjs/pseudo-random
    const jitter = Math.random() * 0.1 * exponentialDelay;

    return Math.min(exponentialDelay + jitter, 10_000); // Cap at 10 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitStatus(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  /**
   * Manually reset a specific circuit
   */
  resetSpecificCircuit(url: string): void {
    this.resetCircuit(url);
  }

  /**
   * Reset all circuits
   */
  resetAllCircuits(): void {
    this.circuitBreakers.clear();
  }
}

// Global instance for use across the application
export const apiClient = new APIClient({
  maxRetries: 1, // Reduce retries for auth calls
  baseDelay: 500, // Shorter delay for auth operations
});

// Specialized client for non-auth operations
export const dataApiClient = new APIClient({
  maxRetries: 3,
  baseDelay: 1000,
});

// Hook for React components to use the API client with proper cleanup
export function useAPIClient() {
  return apiClient;
}
