import type { LRUCache } from 'lru-cache';

export interface CacheSetOptions {
  /** Per-key time to live in milliseconds. Defaults to the plugin-wide `ttl` config. */
  ttlMs?: number;
}

export interface CacheProvider {
  init(): void;
  get(key: string): Promise<any | null>;
  set(key: string, val: any, options?: CacheSetOptions): Promise<any | null>;
  del(key: string): Promise<any | null>;
  keys(): Promise<string[] | null>;
  reset(): Promise<any | null>;
  readonly ready: boolean;
  clearByRegexp(regExps: RegExp[]): Promise<void>;
}

export interface CacheService {
  getCacheInstance(): CacheProvider;
}

export interface CloudFrontProvider {
  init(): void;
  readonly ready: boolean;
  invalidatePaths(paths: string[]): Promise<void>;
  queueInvalidations(paths: string[]): void;
}

export interface CloudFrontService {
  // CloudFront is not always available
  getCloudFrontInstance(): CloudFrontProvider | null;
}

export interface CacheInstance {
  initialized: boolean;
  provider: LRUCache<string, any>;
}
