import type { Core } from '@strapi/strapi';
import { Context } from 'koa';
import { CacheService, CloudFrontService } from 'src/types/cache.types';
import { loggy } from '../utils/log';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async purgeCache(ctx: Context) {
    try {
      const service = strapi.plugin('strapi-cache').service('service') as CacheService;

      await service.getCacheInstance().reset();

      ctx.body = {
        message: 'Cache purged successfully',
      };
      loggy.info(`Invalidated cache for all keys`);
    } catch (error) {
      loggy.error('Cache invalidation error:');
      loggy.error(error);
    }
  },
  async purgeCacheByKey(ctx: Context) {
    try {
      const { key } = ctx.params;

      const cacheService = strapi.plugin('strapi-cache').service('service') as CacheService;
      const cacheStore = cacheService.getCacheInstance();

      const cloudFrontService = strapi
        .plugin('strapi-cache')
        .service('cloudFrontService') as CloudFrontService;
      const cloudFrontStore = cloudFrontService.getCloudFrontInstance();

      const apiPath = `/api(/.*)?${key}`;
      const regex = new RegExp(`^.*:${apiPath}(/.*)?(\\?.*)?(:.*)?$`);

      const promises = [cacheStore.clearByRegexp([regex])];

      const pathToInvalidate = ctx.body?.['path'] ?? ctx.request?.body?.['path'];

      if (!!pathToInvalidate && typeof pathToInvalidate === 'string' && cloudFrontStore?.ready) {
        promises.push(cloudFrontStore.invalidatePaths([pathToInvalidate]));
      }

      await Promise.allSettled(promises);

      ctx.body = {
        message: `Cache purged successfully for key: ${key}`,
      };
      loggy.info(`Invalidated cache for ${key}`);
    } catch (error) {
      loggy.error('Cache invalidation error:');
      loggy.error(error);
    }
  },

  async cacheableRoutes(ctx: Context) {
    const cacheableRoutes = strapi.plugin('strapi-cache').config('cacheableRoutes');
    ctx.body = cacheableRoutes;
  },
});

export default controller;
