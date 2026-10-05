import { CacheProvider } from 'src/types/cache.types';
import { sleepAsync } from './sleep';
import { withTimeout } from './withTimeout';
import { loggy } from './log';

async function _getCacheEntry(
  cancelRef: { cancel: boolean },
  cacheStore: CacheProvider,
  key,
  delayMs
) {
  const cacheEntry = await cacheStore.get(key);
  if (cacheEntry) {
    if (!cacheEntry.init) return cacheEntry;
    if (!cancelRef.cancel) {
      await sleepAsync(delayMs);
      await _getCacheEntry(cancelRef, cacheStore, key, delayMs);
    }
  }
}

export async function getCacheEntry(
  cacheStore: CacheProvider,
  key,
  delayMs = 100
) {
  const initCacheTimeoutInMs = strapi
    .plugin('strapi-cache')
    .config('initCacheTimeoutInMs') as number;
  try {
    return await withTimeout(
      (cancelRef) => _getCacheEntry(cancelRef, cacheStore, key, delayMs),
      initCacheTimeoutInMs
    );
  } catch (e) {
    loggy.error(e);
  }
}

export function statusIsCachable(ctx) {
  return (ctx.status >= 200 && ctx.status < 300) || ctx.status === 404;
}

// A controller opts a single response out of the cache with
// `Cache-Control: no-store`. The request-side `no-cache` bypass is separate.
export function responseIsCachable(ctx) {
  const cacheControl = String(ctx.response.get('Cache-Control') ?? '').toLowerCase();
  return statusIsCachable(ctx) && !cacheControl.includes('no-store');
}
