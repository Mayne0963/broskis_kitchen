const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

console.log('🎵 Broski\'s Music - Royalty-Free Track Download & Conversion');
console.log('================================================================\n');

// Create directories
const audioDir = path.join(__dirname, '..', 'public', 'audio');
const imagesDir = path.join(__dirname, '..', 'public', 'images', 'music');
const dataDir = path.join(__dirname, '..', 'src', 'data');

[audioDir, imagesDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Sample tracks with publicly available audio (using test tones and samples)
const tracks = [
  {
    id: 'beat_01',
    title: 'Chill Abstract Intention',
    artist: 'Ambient Collective',
    provider: 'Public Domain',
    license_type: 'public_domain',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    license_file_url: '',
    duration: 180,
    gain_db: -1.5,
    genre: 'Ambient'
  },
  {
    id: 'beat_02',
    title: 'Tech House Vibes',
    artist: 'Electronic Dreams',
    provider: 'Public Domain',
    license_type: 'public_domain',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    license_file_url: '',
    duration: 225,
    gain_db: -2.0,
    genre: 'Electronic'
  },
  {
    id: 'beat_03',
    title: 'Lofi Study Session',
    artist: 'Study Beats',
    provider: 'Public Domain',
    license_type: 'public_domain',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    license_file_url: '',
    duration: 195,
    gain_db: -1.0,
    genre: 'Lo-Fi'
  },
  {
    id: 'beat_04',
    title: 'Uplifting Corporate',
    artist: 'Business Beats',
    provider: 'Public Domain',
    license_type: 'public_domain',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    license_file_url: '',
    duration: 210,
    gain_db: -1.8,
    genre: 'Corporate'
  },
  {
    id: 'beat_05',
    title: 'Smooth Jazz Cafe',
    artist: 'Jazz Collective',
    provider: 'Public Domain',
    license_type: 'public_domain',
    requires_attribution: false,
    attribution_text: '',
    source_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    license_file_url: '',
    duration: 240,
    gain_db: -1.2,
    genre: 'Jazz'
  }
];

// Function to generate a simple audio file using ffmpeg
function generateAudioFile(trackId, duration, frequency = 440) {
  const outputPath = path.join(audioDir, `${trackId}.m4a`);
  const mp3Path = path.join(audioDir, `${trackId}.mp3`);
  
  try {
    // Generate a simple sine wave tone for demonstration
    const command = `ffmpeg -f lavfi -i "sine=frequency=${frequency}:duration=${duration}" -c:a aac -b:a 128k "${outputPath}" -y`;
    execSync(command, { stdio: 'pipe' });
    
    // Also create MP3 version
    const mp3Command = `ffmpeg -i "${outputPath}" -c:a mp3 -b:a 128k "${mp3Path}" -y`;
    execSync(mp3Command, { stdio: 'pipe' });
    
    console.log(`✅ Generated audio: ${trackId}.m4a and ${trackId}.mp3`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to generate audio for ${trackId}: ${error.message}`);
    return false;
  }
}

// Function to generate cover art URL
function generateCoverArt(trackId, title, genre) {
  const prompt = `abstract music cover art for ${genre} track titled "${title}", modern minimalist design, vibrant colors, music themed`;
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedPrompt}&image_size=square`;
}

// Process tracks
const processedTracks = [];
let successCount = 0;

for (let i = 0; i < tracks.length; i++) {
  const track = tracks[i];
  console.log(`\n🎵 Processing Track ${i + 1}: ${track.title}`);
  
  // Generate different frequencies for variety
  const frequencies = [220, 330, 440, 550, 660];
  const frequency = frequencies[i];
  
  // Generate audio file
  const audioSuccess = generateAudioFile(track.id, track.duration, frequency);
  
  if (audioSuccess) {
    // Create track metadata
    const trackData = {
      ...track,
      src_m4a: `/audio/${track.id}.m4a`,
      src_mp3: `/audio/${track.id}.mp3`,
      cover: generateCoverArt(track.id, track.title, track.genre)
    };
    
    processedTracks.push(trackData);
    successCount++;
    console.log(`✅ Successfully processed: ${track.title}`);
  } else {
    console.log(`❌ Skipping track due to error: ${track.title}`);
  }
}

// Create tracks.json
if (processedTracks.length > 0) {
  const tracksJsonPath = path.join(dataDir, 'tracks.json');
  fs.writeFileSync(tracksJsonPath, JSON.stringify(processedTracks, null, 2));
  console.log(`\n📄 Created tracks.json with ${processedTracks.length} tracks`);
}

console.log(`\n✅ Successfully processed ${successCount} tracks`);
console.log(`📁 Audio files: ${audioDir}`);
console.log(`📄 Metadata: ${path.join(dataDir, 'tracks.json')}`);
console.log('\n🎉 Ready to integrate with Broski\'s Music Player!');
console.log('\n📝 Note: Generated sample audio files for demonstration.');
console.log('   Replace with actual royalty-free tracks as needed.');