import { Core } from '@strapi/strapi';
import { CacheProvider, CloudFrontProvider } from 'src/types/cache.types';
import { loggy } from './log';

const BASE_API_PATH = '/api';

const getCloudFrontPathToInvalidate = ({
  documentId,
  isSingleType,
  contentName,
}: {
  documentId?: string;
  isSingleType: boolean;
  contentName: string;
}): `${typeof BASE_API_PATH}/${string}*` | null => {
  if (isSingleType) {
    return `${BASE_API_PATH}/${contentName}*`;
  }

  if (documentId) {
    return `${BASE_API_PATH}/${contentName}/${documentId}*`;
  }

  return null;
};

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
    const isSingleType = contentType.kind === 'singleType';
    const contentName = isSingleType ? contentType.info.singularName : contentType.info.pluralName;
    const apiPath = `${BASE_API_PATH}/${contentName}` as const;
    const regex = new RegExp(`^.*:${apiPath}(/.*)?(\\?.*)?(:.*)?$`);

    const documentId = event?.result?.documentId;

    const promises = [cacheStore.clearByRegexp([regex])];
    if (cloudFrontStore?.ready) {
      const pathToInvalidate = getCloudFrontPathToInvalidate({
        documentId,
        isSingleType,
        contentName,
      });

      if (pathToInvalidate) {
        cloudFrontStore.queueInvalidations([pathToInvalidate]);
      }
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
