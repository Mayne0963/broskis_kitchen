import { NextResponse } from 'next/server';
import tracksData from '@/data/tracks.json';

export async function GET() {
  try {
    return NextResponse.json(tracksData);
  } catch (error) {
    console.error('Error serving tracks:', error);
    return NextResponse.json(
      { error: 'Failed to load tracks' },
      { status: 500 }
    );
  }
}