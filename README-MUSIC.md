# Broski's Music - Local Audio File Management

## Overview

This document provides information about the local audio file management system for Broski's Music, including automatic track discovery, playlist generation, and local file workflow.

## Current Audio Structure

The music system now uses local audio files organized in the following structure:

```
public/
├── audio/
│   ├── Acoustic-Guitar/
│   │   ├── acoustic-guitar-chill-instrumental-vibes-184837.mp3
│   │   └── instrumental-guitar-flow-acoustic-dreams-201149.mp3
│   ├── Chill-Lofi/
│   │   ├── good-night-lofi-cozy-chill-music-160166.mp3
│   │   └── lofi-study-beats-peaceful-chill-hop-191275.mp3
│   ├── beat_01.mp3          # Broski Mix tracks (root level)
│   ├── beat_02.mp3
│   ├── beat_03.mp3
│   ├── beat_04.mp3
│   └── beat_05.mp3
└── images/
    └── music/
        └── [cover images]   # Existing cover art

data/
├── tracks.json              # Auto-generated track metadata
└── playlists.json          # Auto-generated playlists
```

## Automatic Track Discovery

### Audio Scanning System

The system automatically scans `/public/audio/**` for audio files using the `scripts/scanAudio.ts` script:

- **Supported Formats**: `.mp3`, `.m4a`
- **Recursive Scanning**: Searches all subdirectories
- **Metadata Extraction**: Uses `music-metadata` library for duration and other properties
- **Genre Mapping**: Maps folder names to genres (e.g., "Chill-Lofi" → "Chill Lofi")
- **ID Generation**: Creates slugified IDs from filenames
- **Merge Strategy**: Preserves existing track data when rescanning

### Track Metadata Schema

Auto-generated tracks in `data/tracks.json` follow this structure:

```json
{
  "id": "good-night-lofi",
  "title": "Good Night Lofi",
  "artist": "Royalty-Free",
  "provider": "User Library",
  "license_type": "royalty_free",
  "requires_attribution": false,
  "attribution_text": "",
  "source_url": "",
  "license_file_url": "",
  "src_mp3": "/audio/Chill-Lofi/good-night-lofi-cozy-chill-music-160166.mp3",
  "src_m4a": "",
  "cover": "/images/music/good-night-lofi.jpg",
  "duration": 166,
  "gain_db": 0,
  "genre": "Chill Lofi"
}
```

## Playlist Auto-Generation

### Folder-Based Playlists

Playlists are automatically generated based on the folder structure:

```json
[
  {
    "id": "pl_chill_lofi",
    "title": "Chill Lofi",
    "trackIds": ["good-night-lofi", "lofi-study-beats"]
  },
  {
    "id": "pl_acoustic_guitar",
    "title": "Acoustic Guitar",
    "trackIds": ["acoustic-guitar-chill", "instrumental-guitar-flow"]
  },
  {
    "id": "pl_broski_mix",
    "title": "Broski Mix",
    "trackIds": ["beat_01", "beat_02", "beat_03", "beat_04", "beat_05"]
  }
]
```

### Genre Mapping Rules

- **Folder Name**: `Chill-Lofi` → **Genre**: `"Chill Lofi"`
- **Folder Name**: `Acoustic-Guitar` → **Genre**: `"Acoustic Guitar"`
- **Root Level**: Files in `/public/audio/` → **Genre**: `"Broski Mix"`

## Scripts and Workflow

### Available Scripts

Add these scripts to your workflow:

```bash
# Scan audio files and generate metadata
npm run music:scan

# Verify audio files haven't changed (checksums)
npm run music:verify

# Complete refresh: verify → scan → verify
npm run music:refresh
```

### Script Details

#### `scripts/scanAudio.ts`
- Recursively scans `/public/audio/**` for audio files
- Extracts metadata using `music-metadata` library
- Generates `data/tracks.json` and `data/playlists.json`
- Preserves existing track data (merge strategy)
- Maps folder structure to genres and playlists

#### `scripts/verifyAudioUnchanged.ts`
- Computes SHA256 checksums for all audio files
- Saves checksums to `audio_checksums.json`
- Verifies no audio files were modified during operations
- Provides integrity checking for audio assets

### Adding New Music

To add new songs to your music library:

1. **Drop files** in the appropriate genre folder:
   ```bash
   # For chill/lofi tracks
   cp new-track.mp3 public/audio/Chill-Lofi/
   
   # For acoustic tracks
   cp acoustic-song.mp3 public/audio/Acoustic-Guitar/
   
   # For broski mix (root level)
   cp beat_06.mp3 public/audio/
   ```

2. **Run the refresh script**:
   ```bash
   npm run music:refresh
   ```

3. **Deploy** your changes:
   ```bash
   git add . && git commit -m "Add new music tracks"
   git push
   ```

## Technical Implementation

### Local Sources Only

The music player now exclusively uses local audio sources:

- **Source Priority**: `src_m4a` → `src_mp3` (no external fallbacks)
- **Path Validation**: All sources must start with `/audio/`
- **Error Handling**: Tracks without local sources are skipped
- **External URL Removal**: No references to external providers (soundjay, etc.)

### Player Components

#### PlayerController
- Uses only local audio sources (`currentTrack?.src_m4a || currentTrack?.src_mp3`)
- Removes legacy `src` fallback to external URLs
- Warns when no local source is available

#### EnhancedMusicPlayer
- Loads playlists from `data/playlists.json` via API
- Uses actual playlist structure instead of virtual genre-based playlists
- Displays dev-only badges showing track paths for debugging

#### Music Store
- Loads tracks from `/api/tracks` (serves `data/tracks.json`)
- Loads playlists from `/api/playlists` (serves `data/playlists.json`)
- Manages playlist state and track queues

## Testing

### Automated Tests

The system includes comprehensive Playwright tests in `tests/music.sources.spec.ts`:

- **Local Source Verification**: Ensures all tracks use `/audio/` paths
- **Playlist Functionality**: Tests all three playlists (Chill Lofi, Acoustic Guitar, Broski Mix)
- **Playback Testing**: Verifies first 3 tracks in each playlist play successfully
- **Error Checking**: Confirms `audio.error === null` and time progression
- **iOS Compatibility**: Validates audio unlock overlay functionality
- **API Validation**: Checks that no external URLs exist in data files

### Running Tests

```bash
# Run all music tests
npm run test:e2e -- tests/music.sources.spec.ts

# Run with UI
npm run test:e2e:ui -- tests/music.sources.spec.ts
```

## Audio Verification

### Checksum Verification

The system maintains audio file integrity through SHA256 checksums:

```bash
# Generate initial checksums
npm run music:verify generate

# Verify files haven't changed
npm run music:verify

# Full workflow with verification
npm run music:refresh
```

### Verification Process

1. **Before Changes**: Run `npm run music:verify` to create baseline
2. **Make Changes**: Update code, not audio files
3. **After Changes**: Run `npm run music:verify` to confirm audio unchanged
4. **Continuous**: Use `npm run music:refresh` for complete workflow

## Browser Compatibility

### Audio Format Support

| Browser | MP3 | M4A | Local Files |
|---------|-----|-----|-------------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| iOS Safari | ✅ | ✅ | ✅ |
| Android Chrome | ✅ | ✅ | ✅ |

### iOS Considerations

- **Audio Unlock**: Preserved `AudioUnlockOverlay` functionality
- **Attributes**: Maintains `playsInline`, `preload="metadata"`, `crossOrigin="anonymous"`
- **User Interaction**: Required before audio playback on iOS devices

## File Organization Best Practices

### Folder Structure

```
public/audio/
├── Acoustic-Guitar/     # Acoustic and instrumental tracks
├── Chill-Lofi/         # Lo-fi, study, and chill tracks
├── Electronic/         # Electronic and synth tracks (future)
├── Classical/          # Classical and orchestral (future)
└── *.mp3              # Root level = "Broski Mix"
```

### Naming Conventions

- **Folders**: Use PascalCase with hyphens (e.g., `Chill-Lofi`, `Acoustic-Guitar`)
- **Files**: Keep original filenames for compatibility
- **IDs**: Auto-generated as slugified versions of filenames
- **Titles**: Auto-humanized from filenames

## Troubleshooting

### Common Issues

1. **Tracks Not Loading**
   - Run `npm run music:scan` to regenerate metadata
   - Check `data/tracks.json` exists and is valid JSON
   - Verify audio files exist in expected locations

2. **Playlists Missing**
   - Ensure folder structure follows naming conventions
   - Run `npm run music:refresh` to regenerate playlists
   - Check `data/playlists.json` for correct structure

3. **Audio Not Playing**
   - Verify tracks have local sources (`src_mp3` or `src_m4a`)
   - Check browser console for audio errors
   - Test with different audio formats

4. **iOS Playback Issues**
   - Ensure audio unlock overlay is functioning
   - Verify user interaction before playback
   - Check iOS Safari compatibility

### Debug Commands

```bash
# Check current audio files
find public/audio -name "*.mp3" -o -name "*.m4a"

# Validate JSON files
node -e "console.log(JSON.parse(require('fs').readFileSync('data/tracks.json')))"
node -e "console.log(JSON.parse(require('fs').readFileSync('data/playlists.json')))"

# Test API endpoints
curl http://localhost:3000/api/tracks
curl http://localhost:3000/api/playlists
```

## Development Workflow

### Daily Development

1. **Start Development**: `npm run dev`
2. **Add Music**: Drop files in appropriate folders
3. **Refresh Metadata**: `npm run music:refresh`
4. **Test Changes**: Visit `/music` page
5. **Run Tests**: `npm run test:e2e -- tests/music.sources.spec.ts`

### Production Deployment

1. **Verify Integrity**: `npm run music:verify`
2. **Update Metadata**: `npm run music:scan`
3. **Final Verification**: `npm run music:verify`
4. **Deploy**: Standard deployment process

## Future Enhancements

### Planned Features

1. **Cover Art Auto-Generation**: Automatic cover art for tracks without images
2. **Advanced Metadata**: BPM, key signature, mood detection
3. **Smart Playlists**: Auto-generated playlists based on metadata
4. **Bulk Operations**: Batch processing for large music libraries
5. **Format Conversion**: Automatic M4A generation from MP3 sources

### Extensibility

The system is designed to be easily extensible:

- **New Genres**: Add folders and they'll auto-generate playlists
- **Custom Metadata**: Extend track schema in `scanAudio.ts`
- **Additional Formats**: Add support for FLAC, OGG, etc.
- **External Sources**: Could be extended to support streaming APIs

## Support

For technical issues:

1. Check this documentation
2. Review browser console for errors
3. Run `npm run music:verify` to check file integrity
4. Test with `npm run music:refresh` to regenerate metadata
5. Verify folder structure and file permissions

---

**Last Updated**: January 2025  
**Version**: 2.0.0 (Local File System)  
**Maintainer**: Broski's Kitchen Development Team