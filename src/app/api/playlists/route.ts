import { NextResponse } from 'next/server';
import playlistsData from '@/data/playlists.json';

export async function GET() {
  try {
    return NextResponse.json(playlistsData);
  } catch (error) {
    console.error('Error serving playlists:', error);
    return NextResponse.json(
      { error: 'Failed to load playlists' },
      { status: 500 }
    );
  }
}