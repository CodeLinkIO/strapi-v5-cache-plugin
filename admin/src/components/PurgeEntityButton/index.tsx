import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import PurgeModal from '../PurgeModal';
import { useIntl } from 'react-intl';
import { useMemo } from 'react';

export const getCloudFrontPathToInvalidate = ({
  documentId,
  isSingleType,
  contentTypeName,
  baseApiPath = '/api',
}: {
  documentId?: string;
  isSingleType: boolean;
  contentTypeName?: string;
  baseApiPath?: string;
}): string | null => {
  if (!contentTypeName) {
    return null;
  }

  if (isSingleType) {
    return `${baseApiPath}/${contentTypeName}*`;
  }

  if (documentId) {
    return `${baseApiPath}/${contentTypeName}/${documentId}*`;
  }

  return null;
};

function PurgeEntityButton() {
  const { formatMessage } = useIntl();
  const { id, isSingleType, contentType } = useContentManagerContext();
  const keyToUse = isSingleType ? contentType?.info.singularName : id;
  const contentTypeName = isSingleType
    ? contentType?.info.singularName
    : contentType?.info.pluralName;

  const pathToInvalidate = useMemo(() => {
    return getCloudFrontPathToInvalidate({
      documentId: id,
      isSingleType,
      contentTypeName,
    });
  }, [id, isSingleType, contentTypeName]);

  return (
    <PurgeModal
      buttonWidth="100%"
      buttonText={formatMessage({
        id: 'strapi-cache.cache.purge.entity',
        defaultMessage: 'Purge Entity Cache',
      })}
      pathToInvalidate={pathToInvalidate ?? undefined}
      keyToUse={keyToUse}
      contentTypeName={contentTypeName}
    ></PurgeModal>
  );
}

export default PurgeEntityButton;
