type CacheEntry<T> = {
  data: T;
  expiresAt: number;
  updatedAt: number;
};

const responseCache = new Map<string, CacheEntry<unknown>>();

export const withTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 15000, label = "operation"): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const getCachedValue = <T>(key: string): T | null => {
  const cached = responseCache.get(key) as CacheEntry<T> | undefined;
  if (!cached || cached.expiresAt < Date.now()) return null;
  return cached.data;
};

export const getStaleCachedValue = <T>(key: string): T | null => {
  const cached = responseCache.get(key) as CacheEntry<T> | undefined;
  return cached?.data || null;
};

export const setCachedValue = <T>(key: string, data: T, ttlMs = 30000) => {
  responseCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    updatedAt: Date.now(),
  });
};

export const clearCachedValue = (prefix: string) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) responseCache.delete(key);
  }
};

export const sendResilientJson = async <T>(
  res: any,
  cacheKey: string,
  producer: () => Promise<T>,
  options: { ttlMs?: number; timeoutMs?: number; label?: string; fallback?: T; retries?: number; retryDelayMs?: number } = {},
) => {
  const fresh = getCachedValue<T>(cacheKey);
  if (fresh) {
    return res.json({ success: true, data: fresh, cached: true });
  }

  try {
    const maxAttempts = Math.max(1, (options.retries ?? 1) + 1);
    const retryDelayMs = options.retryDelayMs ?? 300;
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const data = await withTimeout(
          producer(),
          options.timeoutMs || 12000,
          `${options.label || cacheKey} attempt ${attempt}`,
        );
        setCachedValue(cacheKey, data, options.ttlMs || 30000);
        return res.json({ success: true, data });
      } catch (error: any) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    throw lastError;
  } catch (error: any) {
    const stale = getStaleCachedValue<T>(cacheKey);
    if (stale) {
      console.warn(`[API Resilience] ${cacheKey} failed, serving stale cache:`, error?.message || error);
      return res.json({ success: true, data: stale, cached: true, stale: true });
    }

    if (options.fallback !== undefined) {
      console.warn(`[API Resilience] ${cacheKey} failed, serving fallback:`, error?.message || error);
      return res.json({ success: true, data: options.fallback, fallback: true });
    }

    console.error(`[API Resilience] ${cacheKey} failed:`, error?.message || error);
    return res.status(503).json({
      success: false,
      error: "Service is busy. Please try again in a moment.",
    });
  }
};
