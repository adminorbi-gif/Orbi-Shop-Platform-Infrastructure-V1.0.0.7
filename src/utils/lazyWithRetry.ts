import { lazy } from 'react';

const LEGACY_RETRY_KEY = 'page-has-been-force-refreshed';
const CHUNK_RETRY_KEY = 'orbi-shop-chunk-recovery';
const RETRY_WINDOW_MS = 30_000;

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; name?: unknown; type?: unknown; reason?: unknown };
    return [
      typeof candidate.name === 'string' ? candidate.name : '',
      typeof candidate.message === 'string' ? candidate.message : '',
      typeof candidate.type === 'string' ? candidate.type : '',
      candidate.reason ? getErrorMessage(candidate.reason) : '',
    ].join(' ');
  }
  return '';
};

export const isDynamicImportError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('load failed') ||
    message.includes('chunkloaderror') ||
    message.includes('loading chunk') ||
    message.includes('failed to fetch')
  );
};

export const recoverFromDynamicImportError = () => {
  if (typeof window === 'undefined') return false;

  try {
    const retryState = JSON.parse(window.sessionStorage.getItem(CHUNK_RETRY_KEY) || '{}') as {
      path?: string;
      lastRetryAt?: number;
    };
    const now = Date.now();
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const alreadyRetriedRecently =
      retryState.path === currentPath &&
      typeof retryState.lastRetryAt === 'number' &&
      now - retryState.lastRetryAt < RETRY_WINDOW_MS;

    if (alreadyRetriedRecently) {
      return false;
    }

    window.sessionStorage.setItem(
      CHUNK_RETRY_KEY,
      JSON.stringify({ path: currentPath, lastRetryAt: now })
    );
    window.sessionStorage.removeItem(LEGACY_RETRY_KEY);

    window.location.replace(window.location.href);
    return true;
  } catch {
    window.location.reload();
    return true;
  }
};

export const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return lazy(async () => {
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem(LEGACY_RETRY_KEY);
      return component;
    } catch (error: any) {
      if (isDynamicImportError(error) && recoverFromDynamicImportError()) {
        return new Promise(() => {}); // Keep Suspense active while the fresh bundle loads.
      }

      throw error;
    }
  });
};
