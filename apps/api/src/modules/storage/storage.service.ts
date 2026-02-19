import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

type StorageMode = 's3' | 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly mode: StorageMode;

  // S3 mode
  private readonly s3Bucket: string;
  private readonly s3Region: string;

  // MinIO mode
  private readonly minioEndpoint: string;
  private readonly minioPort: number;
  private readonly minioPublicEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    // Determine storage mode:
    // Explicit STORAGE_MODE env takes priority; fall back to presence of AWS_S3_BUCKET vs MINIO_ENDPOINT
    const explicitMode = this.configService.get<string>('STORAGE_MODE');
    if (explicitMode === 's3') {
      this.mode = 's3';
    } else if (explicitMode === 'minio') {
      this.mode = 'minio';
    } else if (this.configService.get<string>('AWS_S3_BUCKET')) {
      this.mode = 's3';
    } else {
      this.mode = 'minio';
    }

    if (this.mode === 's3') {
      this.s3Region = this.configService.get<string>('AWS_S3_REGION', 'us-east-1');
      this.s3Bucket = this.configService.get<string>('AWS_S3_BUCKET', 'plexo-uploads');

      // Credentials are sourced from the EC2 IAM role automatically by the SDK.
      // No explicit accessKeyId / secretAccessKey needed in production.
      this.client = new S3Client({ region: this.s3Region });

      this.logger.log(
        `StorageService initialised in S3 mode — bucket: ${this.s3Bucket}, region: ${this.s3Region}`,
      );
    } else {
      // MinIO — use the AWS SDK with a custom endpoint so the rest of the
      // upload/delete logic is identical between both modes.
      const connectEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
      this.minioPublicEndpoint = this.configService.get<string>(
        'MINIO_PUBLIC_ENDPOINT',
        connectEndpoint,
      );
      this.minioPort = this.configService.get<number>('MINIO_PORT', 9000);

      const accessKeyId = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
      const secretAccessKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin');

      this.client = new S3Client({
        region: 'us-east-1', // MinIO requires a region string; the actual value is ignored
        endpoint: `http://${connectEndpoint}:${this.minioPort}`,
        forcePathStyle: true, // Required for MinIO — virtual-hosted style doesn't work
        credentials: { accessKeyId, secretAccessKey },
      });

      this.logger.log(
        `StorageService initialised in MinIO mode — endpoint: ${connectEndpoint}:${this.minioPort}`,
      );
    }
  }

  async onModuleInit() {
    // Bucket creation is only needed for MinIO (local dev).
    // S3 buckets are pre-created in AWS and managed via IaC.
    if (this.mode !== 'minio') return;

    await this.ensureMinIoBucket(
      this.configService.get<string>('MINIO_BUCKET_PHOTOS', 'photos'),
    );
    await this.ensureMinIoBucket(
      this.configService.get<string>('MINIO_BUCKET_SIGNATURES', 'signatures'),
    );
  }

  private async ensureMinIoBucket(bucket: string) {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`Bucket already exists: ${bucket}`);
    } catch (err: any) {
      // HeadBucket throws when the bucket does not exist
      if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
        this.logger.log(`Created bucket: ${bucket}`);

        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        });

        await this.client.send(
          new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }),
        );
        this.logger.log(`Set public-read policy on bucket: ${bucket}`);
      } else {
        this.logger.error(`Error checking bucket "${bucket}": ${err.message}`);
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    bucket: string,
    folder?: string,
    orgId?: string,
  ): Promise<string> {
    const ext = path.extname(file.originalname) || '.bin';
    const parts = [orgId, folder, `${uuidv4()}${ext}`].filter(Boolean);
    const key = parts.join('/');

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    const url = this.buildUrl(bucket, key);
    this.logger.log(`Uploaded file: ${url}`);
    return url;
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const { bucket, key } = this.parseUrl(url);
      if (!bucket || !key) return;

      await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      this.logger.log(`Deleted file: ${url}`);
    } catch (error: any) {
      this.logger.error(`Error deleting file: ${error.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildUrl(bucket: string, key: string): string {
    if (this.mode === 's3') {
      return `https://${bucket}.s3.${this.s3Region}.amazonaws.com/${key}`;
    }
    // MinIO: http://host:port/bucket/key
    return `http://${this.minioPublicEndpoint}:${this.minioPort}/${bucket}/${key}`;
  }

  private parseUrl(url: string): { bucket: string; key: string } {
    const urlObj = new URL(url);

    if (this.mode === 's3') {
      // https://{bucket}.s3.{region}.amazonaws.com/{key}
      const hostname = urlObj.hostname; // e.g. plexo-uploads.s3.us-east-1.amazonaws.com
      const bucket = hostname.split('.')[0];
      const key = urlObj.pathname.replace(/^\//, '');
      return { bucket, key };
    }

    // MinIO: http://host:port/bucket/key
    const parts = urlObj.pathname.split('/').filter(Boolean);
    const bucket = parts[0] ?? '';
    const key = parts.slice(1).join('/');
    return { bucket, key };
  }
}
