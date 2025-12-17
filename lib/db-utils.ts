/**
 * Database utility functions with retry logic for handling
 * transient connection errors (common with serverless databases)
 *
 * @developer Jack Wullems
 * @contact jackwullems18@gmail.com
 */

/**
 * Retries a database operation with exponential backoff
 * Useful for handling "Server has closed the connection" errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 100,
    maxDelayMs = 2000,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if it's a retryable error (connection closed, timeout, etc.)
      const isRetryable = isRetryableError(error);

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(2, attempt - 1),
        maxDelayMs
      );

      if (onRetry) {
        onRetry(error, attempt);
      } else {
        console.warn(
          `Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
          error instanceof Error ? error.message : error
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Checks if an error is retryable (transient connection errors)
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const retryableMessages = [
    "Server has closed the connection",
    "Connection terminated unexpectedly",
    "Connection refused",
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "socket hang up",
    "Connection lost",
    "database system is starting up",
    "too many connections",
  ];

  const message = error.message.toLowerCase();
  return retryableMessages.some((msg) => message.includes(msg.toLowerCase()));
}




