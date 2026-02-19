import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Minio.Client;
  private readonly publicEndpoint: string;
  private readonly port: number;

  constructor(private configService: ConfigService) {
    const connectEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    this.publicEndpoint = this.configService.get<string>('MINIO_PUBLIC_ENDPOINT', connectEndpoint);
    this.port = this.configService.get<number>('MINIO_PORT', 9000);

    this.client = new Minio.Client({
      endPoint: connectEndpoint,
      port: this.port,
      useSSL: false,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    await this.ensureBucket(
      this.configService.get<string>('MINIO_BUCKET_PHOTOS', 'photos'),
    );
    await this.ensureBucket(
      this.configService.get<string>('MINIO_BUCKET_SIGNATURES', 'signatures'),
    );
  }

  private async ensureBucket(bucket: string) {
    try {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket);
        this.logger.log(`Created bucket: ${bucket}`);

        // Set public-read policy so uploaded files are accessible via URL
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(bucket, JSON.stringify(policy));
        this.logger.log(`Set public-read policy on bucket: ${bucket}`);
      } else {
        this.logger.log(`Bucket already exists: ${bucket}`);
      }
    } catch (error) {
      this.logger.error(`Error ensuring bucket "${bucket}": ${error.message}`);
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
    const objectName = parts.join('/');

    await this.client.putObject(bucket, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const url = `http://${this.publicEndpoint}:${this.port}/${bucket}/${objectName}`;
    this.logger.log(`Uploaded file: ${url}`);
    return url;
  }

  async deleteFile(url: string): Promise<void> {
    try {
      // Parse URL: http://host:port/bucket/objectName
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return;

      const bucket = parts[0];
      const objectName = parts.slice(1).join('/');
      await this.client.removeObject(bucket, objectName);
      this.logger.log(`Deleted file: ${url}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
    }
  }
}
