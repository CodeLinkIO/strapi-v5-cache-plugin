/**
 * Application methods
 */
import bootstrap from './bootstrap';
import register from './register';

/**
 * Plugin server methods
 */
import config from './config';
import contentTypes from './content-types';
import controllers from './controllers';
import middlewares from './middlewares';
import policies from './policies';
import routes from './routes';
import services from './services';

import type { CloudFrontProvider } from './services/cloudfront/provider';
import type { RedisCacheProvider } from './services/redis/provider';
import type { CacheProvider, CacheSetOptions } from './types/cache.types';
export type { CloudFrontProvider, RedisCacheProvider, CacheProvider, CacheSetOptions };

export default {
  register,
  bootstrap,
  destroy() {},
  config,
  controllers,
  routes,
  services,
  contentTypes,
  policies,
  middlewares,
};
