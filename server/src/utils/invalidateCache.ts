import { Core } from '@strapi/strapi';
import { CacheProvider, CloudFrontProvider } from 'src/types/cache.types';
import { loggy } from './log';

export async function invalidateCache(
  event: any,
  {
    cacheStore,
    cloudFrontStore,
  }: { cacheStore: CacheProvider; cloudFrontStore?: CloudFrontProvider },
  strapi: Core.Strapi
) {
  const { model } = event;
  const uid = model.uid;

  try {
    const contentType = strapi.contentType(uid);

    if (!contentType || !contentType.kind) {
      loggy.info(`Content type ${uid} not found`);
      return;
    }

    const pluralName =
      contentType.kind === 'singleType'
        ? contentType.info.singularName
        : contentType.info.pluralName;
    const apiPath = `/api/${pluralName}`;
    const regex = new RegExp(`^.*:${apiPath}(/.*)?(\\?.*)?(:.*)?$`);

    const documentId = event?.result?.documentId;

    const promises = [cacheStore.clearByRegexp([regex])];
    if (cloudFrontStore?.ready && !!documentId) {
      const pathToInvalidate = `${apiPath}/${documentId}*`;
      promises.push(cloudFrontStore.invalidatePaths([pathToInvalidate]));
    }
    await Promise.allSettled(promises);

    loggy.info(`Invalidated cache for ${apiPath}`);
  } catch (error) {
    loggy.error('Cache invalidation error:');
    loggy.error(error);
  }
}

export async function invalidateGraphqlCache(
  event: any,
  cacheStore: CacheProvider,
  strapi: Core.Strapi
) {
  try {
    const graphqlRegex = new RegExp(`^POST:\/graphql(:.*)?$`);

    await cacheStore.clearByRegexp([graphqlRegex]);
    loggy.info(`Invalidated cache for ${graphqlRegex}`);
  } catch (error) {
    loggy.error('Cache invalidation error:');
    loggy.error(error);
  }
}
