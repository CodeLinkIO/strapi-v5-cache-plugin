import {
  CloudFrontClient,
  CloudFrontClientConfig,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront'; // ES Modules import
import type { Core } from '@strapi/strapi';
import { CloudFrontProvider as ICloudFrontProvider } from '../../types/cache.types';
import { loggy } from '../../utils/log';
import { Batcher } from '@tanstack/pacer';

export class CloudFrontProvider implements ICloudFrontProvider {
  private cloudFrontClient: CloudFrontClient | null = null;
  private distributionId: string | null = null;

  private initialized = false;

  private batcher: Batcher<string>;

  constructor(private strapi: Core.Strapi) {
    this.batcher = new Batcher<string>(this.invalidatePaths, {
      maxSize: 10,
      wait: 5000,
    });
  }
  queueInvalidations(paths: string[]): void {
    paths.forEach((path) => this.batcher.addItem(path));
  }

  public init(): void {
    if (this.initialized) {
      loggy.error('CloudFront provider already initialized');
      return;
    }

    const awsRegion = this.strapi.plugin('strapi-cache').config('cloudFrontAwsRegion');
    const distributionId = this.strapi.plugin('strapi-cache').config('cloudFrontDistributionId');

    if (!awsRegion || typeof awsRegion !== 'string') {
      loggy.error('CloudFront AWS Region is not configured properly');
      return;
    }
    if (!distributionId || typeof distributionId !== 'string') {
      loggy.error('CloudFront Distribution ID is not configured properly');
      return;
    }

    const config: CloudFrontClientConfig = {
      region: awsRegion,
    };
    this.cloudFrontClient = new CloudFrontClient(config);
    this.distributionId = distributionId;
    this.initialized = true;
    loggy.info('CloudFront provider initialized');
  }

  public get ready(): boolean {
    // In a real implementation, you might want to check if the client is properly configured
    return !!this.cloudFrontClient && !!this.distributionId;
  }

  private createCloudFrontCallerReference(): string {
    return `invalidate-${Date.now()}`;
  }

  async invalidatePaths(paths: string[]): Promise<void> {
    const cloudFrontCallerReference = this.createCloudFrontCallerReference();

    const createInvalidationCommand = new CreateInvalidationCommand({
      DistributionId: this.distributionId,
      InvalidationBatch: {
        CallerReference: cloudFrontCallerReference,
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    });
    try {
      const result = await this.cloudFrontClient.send(createInvalidationCommand);
      loggy.info(`CloudFront invalidation created: ${JSON.stringify(result)}`);
    } catch (e) {
      loggy.error(`Error creating CloudFront invalidation: ${e}`);
    }
  }
}
