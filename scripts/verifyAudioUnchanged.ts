#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AudioChecksum {
  path: string;
  size: number;
  sha256: string;
  lastModified: number;
}

interface AudioChecksums {
  timestamp: string;
  files: AudioChecksum[];
}

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');
const CHECKSUMS_FILE = path.join(process.cwd(), 'audio_checksums.json');

/**
 * Recursively find all audio files in the directory
 */
function findAudioFiles(dir: string): string[] {
  const audioFiles: string[] = [];
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
            audioFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${currentDir}:`, error);
    }
  }

  scanDirectory(dir);
  return audioFiles.sort();
}

/**
 * Calculate SHA256 hash of a file
 */
function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Generate checksums for all audio files
 */
function generateChecksums(): AudioChecksums {
  console.log('🔍 Scanning for audio files...');
  
  if (!fs.existsSync(AUDIO_DIR)) {
    console.error(`❌ Audio directory not found: ${AUDIO_DIR}`);
    process.exit(1);
  }

  const audioFiles = findAudioFiles(AUDIO_DIR);
  console.log(`📁 Found ${audioFiles.length} audio files`);

  const checksums: AudioChecksum[] = [];

  for (const filePath of audioFiles) {
    try {
      const stat = fs.statSync(filePath);
      const relativePath = path.relative(process.cwd(), filePath);
      
      console.log(`🔐 Computing checksum for: ${relativePath}`);
      
      const checksum: AudioChecksum = {
        path: relativePath,
        size: stat.size,
        sha256: calculateFileHash(filePath),
        lastModified: stat.mtime.getTime()
      };
      
      checksums.push(checksum);
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
      process.exit(1);
    }
  }

  return {
    timestamp: new Date().toISOString(),
    files: checksums
  };
}

/**
 * Compare two checksum sets
 */
function compareChecksums(oldChecksums: AudioChecksums, newChecksums: AudioChecksums): boolean {
  const oldFiles = new Map(oldChecksums.files.map(f => [f.path, f]));
  const newFiles = new Map(newChecksums.files.map(f => [f.path, f]));

  let hasChanges = false;

  // Check for removed files
  for (const [path] of oldFiles) {
    if (!newFiles.has(path)) {
      console.log(`❌ File removed: ${path}`);
      hasChanges = true;
    }
  }

  // Check for added files
  for (const [path] of newFiles) {
    if (!oldFiles.has(path)) {
      console.log(`➕ File added: ${path}`);
      hasChanges = true;
    }
  }

  // Check for modified files
  for (const [path, newFile] of newFiles) {
    const oldFile = oldFiles.get(path);
    if (oldFile) {
      if (oldFile.sha256 !== newFile.sha256) {
        console.log(`🔄 File modified: ${path}`);
        console.log(`   Old SHA256: ${oldFile.sha256}`);
        console.log(`   New SHA256: ${newFile.sha256}`);
        hasChanges = true;
      } else if (oldFile.size !== newFile.size) {
        console.log(`📏 File size changed: ${path}`);
        console.log(`   Old size: ${oldFile.size} bytes`);
        console.log(`   New size: ${newFile.size} bytes`);
        hasChanges = true;
      }
    }
  }

  return !hasChanges;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';

  switch (command) {
    case 'generate':
    case 'save':
      console.log('🎵 Generating audio file checksums...');
      const checksums = generateChecksums();
      fs.writeFileSync(CHECKSUMS_FILE, JSON.stringify(checksums, null, 2));
      console.log(`✅ Checksums saved to: ${CHECKSUMS_FILE}`);
      console.log(`📊 Total files: ${checksums.files.length}`);
      break;

    case 'verify':
    case 'check':
      console.log('🔍 Verifying audio files are unchanged...');
      
      if (!fs.existsSync(CHECKSUMS_FILE)) {
        console.error(`❌ Checksums file not found: ${CHECKSUMS_FILE}`);
        console.log('💡 Run "npm run music:verify" first to generate baseline checksums');
        process.exit(1);
      }

      const oldChecksums: AudioChecksums = JSON.parse(fs.readFileSync(CHECKSUMS_FILE, 'utf8'));
      const newChecksums = generateChecksums();
      
      console.log(`📅 Baseline from: ${oldChecksums.timestamp}`);
      console.log(`📅 Current scan: ${newChecksums.timestamp}`);
      
      const unchanged = compareChecksums(oldChecksums, newChecksums);
      
      if (unchanged) {
        console.log('✅ All audio files are unchanged!');
        process.exit(0);
      } else {
        console.log('❌ Audio files have been modified!');
        process.exit(1);
      }
      break;

    case 'help':
    default:
      console.log('🎵 Audio File Verification Tool');
      console.log('');
      console.log('Usage:');
      console.log('  npm run music:verify [command]');
      console.log('');
      console.log('Commands:');
      console.log('  generate, save    Generate and save checksums');
      console.log('  verify, check     Verify files against saved checksums');
      console.log('  help             Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  npm run music:verify generate');
      console.log('  npm run music:verify verify');
      break;
  }
}

// Run main function if this file is executed directly
main();