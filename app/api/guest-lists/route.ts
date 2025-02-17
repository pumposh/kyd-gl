import { NextResponse } from 'next/server';
import { createGuestList, generateShareToken } from '@/utils/db';

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      original_filename: string
      s3_key: string
      status: 'draft' | 'ready'
      event_date: string
    }
    
    // Generate a unique share token
    const shareToken = await generateShareToken();
    
    // Create guest list with share token
    const guestList = await createGuestList({
      ...body,
      share_token: shareToken,
    });
    
    return NextResponse.json(guestList);
  } catch (error) {
    console.error('Create guest list error:', error);
    return NextResponse.json(
      { error: 'Failed to create guest list' },
      { status: 500 }
    );
  }
} 