export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500,
): Promise<T> {
  let attempt = 0;
  let lastErr: any;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const backoff = delayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
      attempt++;
    }
  }
  throw lastErr;
}
