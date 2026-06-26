import type { Core } from '@strapi/strapi';
import { invalidateCache, invalidateGraphqlCache } from './utils/invalidateCache';
import { CacheService, CloudFrontService } from './types/cache.types';
import { loggy } from './utils/log';
import { actions } from './permissions';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  loggy.info('Initializing');
  try {
    // Cache
    const cacheService = strapi.plugin('strapi-cache').services.service as CacheService;
    const cacheStore = cacheService.getCacheInstance();
    cacheStore.init();

    // CloudFront
    const cloudFrontService = strapi.plugin('strapi-cache').services
      .cloudFrontService as CloudFrontService;
    const cloudFrontStore = cloudFrontService.getCloudFrontInstance();
    cloudFrontStore.init();

    strapi.db.lifecycles.subscribe({
      async afterCreate(event) {
        await invalidateCache(event, { cacheStore, cloudFrontStore }, strapi);
        await invalidateGraphqlCache(event, cacheStore, strapi);
      },
      async afterUpdate(event) {
        await invalidateCache(event, { cacheStore, cloudFrontStore }, strapi);
        await invalidateGraphqlCache(event, cacheStore, strapi);
      },
      async afterDelete(event) {
        await invalidateCache(event, { cacheStore, cloudFrontStore }, strapi);
        await invalidateGraphqlCache(event, cacheStore, strapi);
      },
    });

    if (!cacheStore) {
      loggy.error('Plugin could not be initialized');
      return;
    }
  } catch (error) {
    loggy.error('Plugin could not be initialized');
    return;
  }
  loggy.info('Plugin initialized');

  try {
    strapi.service('admin::permission').actionProvider.registerMany(actions);
    loggy.info('Plugin registered');
  } catch (e) {
    loggy.error('Plugin could not be registered: ' + JSON.stringify(e));
  }
};

export default bootstrap;
