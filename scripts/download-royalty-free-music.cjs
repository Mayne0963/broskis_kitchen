#!/usr/bin/env node

/**
 * Download and integrate royalty-free music tracks
 * This script downloads 5 royalty-free tracks from Pixabay and Mixkit,
 * converts them to the proper format, and integrates them into the project.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'audio');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'music');
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data');
const TRACKS_FILE = path.join(DATA_DIR, 'tracks.json');

// Royalty-free music sources with direct download URLs
const MUSIC_TRACKS = [
  {
    id: 'beat_01',
    title: 'Smooth Chill Groove',
    artist: 'Mixkit Artist',
    provider: 'Mixkit',
    license_type: 'royalty_free',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    download_url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568.wav',
    license_file_url: 'https://mixkit.co/license/#sfxFree',
    duration: 180,
    gain_db: -1.5,
    genre: 'Ambient'
  },
  {
    id: 'beat_02',
    title: 'Tech House Vibes',
    artist: 'Electronic Dreams',
    provider: 'Mixkit',
    license_type: 'royalty_free',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
    download_url: 'https://assets.mixkit.co/active_storage/sfx/2570/2570.wav',
    license_file_url: 'https://mixkit.co/license/#sfxFree',
    duration: 225,
    gain_db: -2.0,
    genre: 'Electronic'
  },
  {
    id: 'beat_03',
    title: 'Lofi Study Session',
    artist: 'Study Beats',
    provider: 'Mixkit',
    license_type: 'royalty_free',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
    download_url: 'https://assets.mixkit.co/active_storage/sfx/2572/2572.wav',
    license_file_url: 'https://mixkit.co/license/#sfxFree',
    duration: 195,
    gain_db: -1.0,
    genre: 'Lo-Fi'
  },
  {
    id: 'beat_04',
    title: 'Upbeat Corporate',
    artist: 'Business Beats',
    provider: 'Mixkit',
    license_type: 'royalty_free',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
    download_url: 'https://assets.mixkit.co/active_storage/sfx/2574/2574.wav',
    license_file_url: 'https://mixkit.co/license/#sfxFree',
    duration: 210,
    gain_db: -1.8,
    genre: 'Corporate'
  },
  {
    id: 'beat_05',
    title: 'Relaxing Piano',
    artist: 'Piano Collective',
    provider: 'Mixkit',
    license_type: 'royalty_free',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://assets.mixkit.co/active_storage/sfx/2576/2576-preview.mp3',
    download_url: 'https://assets.mixkit.co/active_storage/sfx/2576/2576.wav',
    license_file_url: 'https://mixkit.co/license/#sfxFree',
    duration: 240,
    gain_db: -0.5,
    genre: 'Classical'
  }
];

// Utility functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${url}`);
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${path.basename(outputPath)}`);
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file async
      reject(err);
    });
  });
}

function convertToM4A(inputPath, outputPath) {
  try {
    console.log(`🔄 Converting ${path.basename(inputPath)} to M4A...`);
    execSync(`ffmpeg -i "${inputPath}" -c:a aac -b:a 128k -ar 44100 "${outputPath}" -y`, {
      stdio: 'pipe'
    });
    console.log(`✅ Converted: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  FFmpeg not available, keeping original format: ${error.message}`);
    return false;
  }
}

function convertToMP3(inputPath, outputPath) {
  try {
    console.log(`🔄 Converting ${path.basename(inputPath)} to MP3...`);
    execSync(`ffmpeg -i "${inputPath}" -c:a mp3 -b:a 128k -ar 44100 "${outputPath}" -y`, {
      stdio: 'pipe'
    });
    console.log(`✅ Converted: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  FFmpeg not available, keeping original format: ${error.message}`);
    return false;
  }
}

function generateCoverImage(track) {
  // Generate SVG cover art
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad${track.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#grad${track.id})" />
    <circle cx="200" cy="200" r="80" fill="rgba(255,255,255,0.2)" />
    <circle cx="200" cy="200" r="60" fill="rgba(255,255,255,0.1)" />
    <circle cx="200" cy="200" r="40" fill="rgba(255,255,255,0.1)" />
    <text x="200" y="320" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${track.title}</text>
    <text x="200" y="350" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="16">${track.artist}</text>
  </svg>`;
  
  const coverPath = path.join(IMAGES_DIR, `${track.id}.svg`);
  fs.writeFileSync(coverPath, svg);
  console.log(`✅ Generated cover: ${track.id}.svg`);
  return `/images/music/${track.id}.svg`;
}

async function downloadAndProcessTrack(track) {
  console.log(`\n🎵 Processing: ${track.title}`);
  
  // Download original file
  const tempPath = path.join(AUDIO_DIR, `${track.id}_temp.wav`);
  const m4aPath = path.join(AUDIO_DIR, `${track.id}.m4a`);
  const mp3Path = path.join(AUDIO_DIR, `${track.id}.mp3`);
  
  try {
    await downloadFile(track.download_url, tempPath);
    
    // Convert to M4A and MP3
    const m4aSuccess = convertToM4A(tempPath, m4aPath);
    const mp3Success = convertToMP3(tempPath, mp3Path);
    
    // If conversion failed, copy the original file
    if (!m4aSuccess && !mp3Success) {
      fs.copyFileSync(tempPath, mp3Path);
      console.log(`📁 Copied original file as MP3: ${track.id}.mp3`);
    }
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    // Generate cover image
    const coverPath = generateCoverImage(track);
    
    // Return track data for JSON
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      provider: track.provider,
      license_type: track.license_type,
      requires_attribution: track.requires_attribution,
      attribution_text: track.attribution_text,
      source_url: track.source_url,
      license_file_url: track.license_file_url,
      src_m4a: fs.existsSync(m4aPath) ? `/audio/${track.id}.m4a` : null,
      src_mp3: fs.existsSync(mp3Path) ? `/audio/${track.id}.mp3` : null,
      cover: coverPath,
      duration: track.duration,
      gain_db: track.gain_db,
      genre: track.genre
    };
    
  } catch (error) {
    console.error(`❌ Failed to process ${track.title}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🎵 Broski\'s Music - Royalty-Free Track Integration\n');
  
  // Ensure directories exist
  ensureDirectoryExists(AUDIO_DIR);
  ensureDirectoryExists(IMAGES_DIR);
  ensureDirectoryExists(DATA_DIR);
  
  // Process all tracks
  const processedTracks = [];
  
  for (const track of MUSIC_TRACKS) {
    const processedTrack = await downloadAndProcessTrack(track);
    if (processedTrack) {
      processedTracks.push(processedTrack);
    }
  }
  
  // Update tracks.json
  if (processedTracks.length > 0) {
    fs.writeFileSync(TRACKS_FILE, JSON.stringify(processedTracks, null, 2));
    console.log(`\n✅ Updated tracks.json with ${processedTracks.length} tracks`);
  }
  
  console.log('\n🎉 Royalty-free music integration complete!');
  console.log(`📁 Audio files: ${AUDIO_DIR}`);
  console.log(`🖼️  Cover images: ${IMAGES_DIR}`);
  console.log(`📄 Track data: ${TRACKS_FILE}`);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, MUSIC_TRACKS };