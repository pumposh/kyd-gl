import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

export type PresignedUpload = {
  url: string;
  key: string;
};

export class S3Service {
  static async getPresignedUploadUrl(filename: string): Promise<PresignedUpload> {
    const key = `guest-lists/${uuidv4()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: 'text/csv',
    });

    const url = await awsGetSignedUrl(s3Client, command, { expiresIn: 3600 });
    return { url, key };
  }

  static async deleteFile(key: string): Promise<void> {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
  }

  static async getSignedUrl(key: string, operation: 'read' | 'write' = 'write') {
    const command = operation === 'write' 
      ? new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key })
      : new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    
    const url = await awsGetSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    return { url, key };
  }
} 