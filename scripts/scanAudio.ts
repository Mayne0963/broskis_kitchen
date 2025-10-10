#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Track {
  id: string;
  title: string;
  artist: string;
  provider: string;
  license_type: string;
  requires_attribution: boolean;
  attribution_text: string;
  source_url: string;
  license_file_url: string;
  src_mp3: string;
  src_m4a: string;
  cover: string;
  duration: number;
  gain_db: number;
  genre: string;
}

interface Playlist {
  id: string;
  title: string;
  trackIds: string[];
}

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const TRACKS_FILE = path.join(process.cwd(), 'src', 'data', 'tracks.json');
const PLAYLISTS_FILE = path.join(process.cwd(), 'src', 'data', 'playlists.json');
const COVER_IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'music');

/**
 * Convert filename to slug (kebab-case)
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert filename to human-readable title
 */
function humanizeTitle(filename: string): string {
  // Remove file extension
  const nameWithoutExt = path.parse(filename).name;
  
  // Split by common separators and capitalize each word
  return nameWithoutExt
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\b(lofi|dj|mp3|m4a)\b/gi, match => match.toUpperCase());
}

/**
 * Convert folder name to genre
 */
function folderToGenre(folderName: string): string {
  if (!folderName || folderName === 'audio') {
    return 'Broski Mix';
  }
  
  return folderName
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Find existing cover image for a track
 */
function findCoverImage(trackId: string): string {
  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  for (const ext of extensions) {
    const coverPath = path.join(COVER_IMAGES_DIR, `${trackId}${ext}`);
    if (fs.existsSync(coverPath)) {
      return `/images/music/${trackId}${ext}`;
    }
  }
  
  // Return placeholder if no cover found
  return '/images/music/placeholder.jpg';
}

/**
 * Recursively find all audio files
 */
function findAudioFiles(dir: string): Array<{path: string, relativePath: string, folder: string}> {
  const audioFiles: Array<{path: string, relativePath: string, folder: string}> = [];
  const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac'];

  function scanDirectory(currentDir: string) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (audioExtensions.includes(ext)) {
            const relativePath = path.relative(AUDIO_DIR, fullPath);
            const folder = path.dirname(relativePath);
            audioFiles.push({
              path: fullPath,
              relativePath,
              folder: folder === '.' ? '' : folder
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${currentDir}:`, error);
    }
  }

  scanDirectory(dir);
  return audioFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/**
 * Extract audio metadata using music-metadata
 */
async function extractMetadata(filePath: string): Promise<{duration: number}> {
  try {
    const metadata = await parseFile(filePath);
    return {
      duration: Math.round(metadata.format.duration || 0)
    };
  } catch (error) {
    console.warn(`Warning: Could not extract metadata from ${filePath}:`, error);
    return {
      duration: 0
    };
  }
}

/**
 * Load existing tracks to preserve data
 */
function loadExistingTracks(): Map<string, Track> {
  const existingTracks = new Map<string, Track>();
  
  try {
    if (fs.existsSync(TRACKS_FILE)) {
      const tracksData = JSON.parse(fs.readFileSync(TRACKS_FILE, 'utf8'));
      if (Array.isArray(tracksData)) {
        tracksData.forEach((track: Track) => {
          existingTracks.set(track.id, track);
        });
      }
    }
  } catch (error) {
    console.warn('Warning: Could not load existing tracks:', error);
  }
  
  return existingTracks;
}

/**
 * Generate track metadata from audio file
 */
async function generateTrackMetadata(
  audioFile: {path: string, relativePath: string, folder: string},
  existingTracks: Map<string, Track>
): Promise<Track> {
  const filename = path.basename(audioFile.relativePath);
  const trackId = slugify(path.parse(filename).name);
  const genre = folderToGenre(audioFile.folder);
  
  // Check if track already exists
  const existingTrack = existingTracks.get(trackId);
  
  // Extract metadata
  const metadata = await extractMetadata(audioFile.path);
  
  // Determine file paths
  const publicPath = `/audio/${audioFile.relativePath}`;
  const ext = path.extname(filename).toLowerCase();
  
  const track: Track = {
    id: trackId,
    title: existingTrack?.title || humanizeTitle(filename),
    artist: existingTrack?.artist || 'Royalty-Free',
    provider: existingTrack?.provider || 'User Library',
    license_type: existingTrack?.license_type || 'royalty_free',
    requires_attribution: existingTrack?.requires_attribution || false,
    attribution_text: existingTrack?.attribution_text || '',
    source_url: existingTrack?.source_url || '',
    license_file_url: existingTrack?.license_file_url || '',
    src_mp3: ext === '.mp3' ? publicPath : (existingTrack?.src_mp3 || ''),
    src_m4a: ext === '.m4a' ? publicPath : (existingTrack?.src_m4a || ''),
    cover: existingTrack?.cover || findCoverImage(trackId),
    duration: metadata.duration || existingTrack?.duration || 0,
    gain_db: existingTrack?.gain_db || 0,
    genre: existingTrack?.genre || genre
  };
  
  return track;
}

/**
 * Generate playlists from folder structure
 */
function generatePlaylists(tracks: Track[]): Playlist[] {
  const playlists: Playlist[] = [];
  const genreGroups = new Map<string, string[]>();
  
  // Group tracks by genre
  tracks.forEach(track => {
    const genre = track.genre;
    if (!genreGroups.has(genre)) {
      genreGroups.set(genre, []);
    }
    genreGroups.get(genre)!.push(track.id);
  });
  
  // Create playlists for each genre
  genreGroups.forEach((trackIds, genre) => {
    const playlistId = `pl_${slugify(genre)}`;
    playlists.push({
      id: playlistId,
      title: genre,
      trackIds: trackIds
    });
  });
  
  return playlists.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Main scanning function
 */
async function scanAudio() {
  console.log('🎵 Scanning audio files for metadata...');
  
  if (!fs.existsSync(AUDIO_DIR)) {
    console.error(`❌ Audio directory not found: ${AUDIO_DIR}`);
    process.exit(1);
  }
  
  // Find all audio files
  const audioFiles = findAudioFiles(AUDIO_DIR);
  console.log(`📁 Found ${audioFiles.length} audio files`);
  
  if (audioFiles.length === 0) {
    console.log('⚠️  No audio files found');
    return;
  }
  
  // Load existing tracks
  const existingTracks = loadExistingTracks();
  console.log(`📚 Loaded ${existingTracks.size} existing tracks`);
  
  // Generate track metadata
  const tracks: Track[] = [];
  for (const audioFile of audioFiles) {
    console.log(`🎧 Processing: ${audioFile.relativePath}`);
    const track = await generateTrackMetadata(audioFile, existingTracks);
    tracks.push(track);
  }
  
  // Generate playlists
  console.log('📝 Generating playlists...');
  const playlists = generatePlaylists(tracks);
  
  // Ensure output directories exist
  const dataDir = path.dirname(TRACKS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Write tracks.json
  fs.writeFileSync(TRACKS_FILE, JSON.stringify(tracks, null, 2));
  console.log(`✅ Tracks saved to: ${TRACKS_FILE}`);
  console.log(`📊 Total tracks: ${tracks.length}`);
  
  // Write playlists.json
  fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
  console.log(`✅ Playlists saved to: ${PLAYLISTS_FILE}`);
  console.log(`📊 Total playlists: ${playlists.length}`);
  
  // Summary
  console.log('\n📋 Summary:');
  playlists.forEach(playlist => {
    console.log(`   ${playlist.title}: ${playlist.trackIds.length} tracks`);
  });
  
  console.log('\n🎉 Audio scanning complete!');
}

/**
 * Main function
 */
async function main() {
  try {
    await scanAudio();
  } catch (error) {
    console.error('❌ Error during audio scanning:', error);
    process.exit(1);
  }
}

// Run main function
main();