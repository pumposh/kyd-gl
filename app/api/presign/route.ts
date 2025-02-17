import { NextResponse } from 'next/server';
import { S3Service } from '@/utils/s3';

export async function POST(req: Request) {
  try {
    const { filename, operation = 'write' } = await req.json() as {
      filename: string
      operation?: 'write' | 'read'
    }
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    const { url, key } = await S3Service.getSignedUrl(filename, operation);
    
    return NextResponse.json({ url, key });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
} 