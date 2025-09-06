#!/usr/bin/env node

/**
 * Vercel Cache Clearing Script
 * 
 * This script provides programmatic methods to clear various types of cache
 * to prevent Vercel from using prebuilt artifacts.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${message}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Clear local Next.js cache
 */
function clearNextJsCache() {
  logInfo('Clearing Next.js cache...');
  
  const nextDir = path.join(process.cwd(), '.next');
  
  if (fs.existsSync(nextDir)) {
    try {
      // Clear specific cache directories
      const cacheDir = path.join(nextDir, 'cache');
      const traceDir = path.join(nextDir, 'trace');
      
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        logSuccess('Cleared .next/cache directory');
      }
      
      if (fs.existsSync(traceDir)) {
        fs.rmSync(traceDir, { recursive: true, force: true });
        logSuccess('Cleared .next/trace directory');
      }
      
      // Clear build manifest to force rebuild
      const buildManifest = path.join(nextDir, 'build-manifest.json');
      if (fs.existsSync(buildManifest)) {
        fs.unlinkSync(buildManifest);
        logSuccess('Cleared build manifest');
      }
      
      // Clear prerender manifest
      const prerenderManifest = path.join(nextDir, 'prerender-manifest.json');
      if (fs.existsSync(prerenderManifest)) {
        fs.unlinkSync(prerenderManifest);
        logSuccess('Cleared prerender manifest');
      }
      
    } catch (error) {
      logError(`Failed to clear Next.js cache: ${error.message}`);
      return false;
    }
  } else {
    logWarning('No .next directory found');
  }
  
  return true;
}

/**
 * Clear Vercel local cache
 */
function clearVercelCache() {
  logInfo('Clearing Vercel local cache...');
  
  const vercelDir = path.join(process.cwd(), '.vercel');
  
  if (fs.existsSync(vercelDir)) {
    try {
      // Keep project.json but clear cache
      const projectFile = path.join(vercelDir, 'project.json');
      let projectData = null;
      
      if (fs.existsSync(projectFile)) {
        projectData = fs.readFileSync(projectFile, 'utf8');
      }
      
      // Remove entire .vercel directory
      fs.rmSync(vercelDir, { recursive: true, force: true });
      
      // Recreate directory and restore project.json if it existed
      fs.mkdirSync(vercelDir, { recursive: true });
      
      if (projectData) {
        fs.writeFileSync(projectFile, projectData);
        logSuccess('Cleared Vercel cache (preserved project.json)');
      } else {
        logSuccess('Cleared Vercel cache');
      }
      
    } catch (error) {
      logError(`Failed to clear Vercel cache: ${error.message}`);
      return false;
    }
  } else {
    logWarning('No .vercel directory found');
  }
  
  return true;
}

/**
 * Clear npm/pnpm cache
 */
function clearPackageManagerCache() {
  logInfo('Clearing package manager cache...');
  
  try {
    // Check if pnpm is being used
    if (fs.existsSync('pnpm-lock.yaml')) {
      execSync('pnpm store prune', { stdio: 'pipe' });
      logSuccess('Cleared pnpm cache');
    } else if (fs.existsSync('package-lock.json')) {
      execSync('npm cache clean --force', { stdio: 'pipe' });
      logSuccess('Cleared npm cache');
    } else if (fs.existsSync('yarn.lock')) {
      execSync('yarn cache clean', { stdio: 'pipe' });
      logSuccess('Cleared yarn cache');
    }
  } catch (error) {
    logWarning(`Could not clear package manager cache: ${error.message}`);
    return false;
  }
  
  return true;
}

/**
 * Clear browser cache files (service worker, etc.)
 */
function clearBrowserCacheFiles() {
  logInfo('Clearing browser cache files...');
  
  const publicDir = path.join(process.cwd(), 'public');
  const swFile = path.join(publicDir, 'sw.js');
  
  // Update service worker to force cache invalidation
  if (fs.existsSync(swFile)) {
    try {
      let swContent = fs.readFileSync(swFile, 'utf8');
      
      // Add cache busting timestamp
      const timestamp = Date.now();
      const cacheBustComment = `// Cache bust: ${timestamp}\n`;
      
      if (!swContent.includes('// Cache bust:')) {
        swContent = cacheBustComment + swContent;
      } else {
        swContent = swContent.replace(/\/\/ Cache bust: \d+\n/, cacheBustComment);
      }
      
      fs.writeFileSync(swFile, swContent);
      logSuccess('Updated service worker with cache bust');
    } catch (error) {
      logWarning(`Could not update service worker: ${error.message}`);
    }
  }
  
  return true;
}

/**
 * Generate new build ID to force fresh deployment
 */
function generateNewBuildId() {
  logInfo('Generating new build ID...');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (fs.existsSync(nextConfigPath)) {
    try {
      let configContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Add or update generateBuildId function
      const buildIdFunction = `
  generateBuildId: async () => {
    // Force new build ID to prevent prebuilt artifacts
    return 'build-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  },`;
      
      if (configContent.includes('generateBuildId:')) {
        // Replace existing generateBuildId
        configContent = configContent.replace(
          /generateBuildId:[^,}]+[,}]/,
          buildIdFunction.trim() + (configContent.includes('generateBuildId:') && configContent.indexOf('}', configContent.indexOf('generateBuildId:')) > configContent.indexOf(',', configContent.indexOf('generateBuildId:')) ? ',' : '')
        );
      } else {
        // Add generateBuildId to the config
        configContent = configContent.replace(
          /module\.exports\s*=\s*{/,
          `module.exports = {${buildIdFunction}`
        );
      }
      
      fs.writeFileSync(nextConfigPath, configContent);
      logSuccess('Updated next.config.js with new build ID generator');
    } catch (error) {
      logWarning(`Could not update next.config.js: ${error.message}`);
    }
  }
  
  return true;
}

/**
 * Main cache clearing function
 */
function clearAllCaches(options = {}) {
  const {
    skipNextJs = false,
    skipVercel = false,
    skipPackageManager = false,
    skipBrowserCache = false,
    generateBuildId = true
  } = options;
  
  logHeader('VERCEL CACHE CLEARING SCRIPT');
  
  const results = [];
  
  if (!skipNextJs) {
    results.push({ name: 'Next.js Cache', success: clearNextJsCache() });
  }
  
  if (!skipVercel) {
    results.push({ name: 'Vercel Cache', success: clearVercelCache() });
  }
  
  if (!skipPackageManager) {
    results.push({ name: 'Package Manager Cache', success: clearPackageManagerCache() });
  }
  
  if (!skipBrowserCache) {
    results.push({ name: 'Browser Cache Files', success: clearBrowserCacheFiles() });
  }
  
  if (generateBuildId) {
    results.push({ name: 'Build ID Generation', success: generateNewBuildId() });
  }
  
  // Summary
  logHeader('CACHE CLEARING SUMMARY');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.success) {
      logSuccess(`${result.name}: Cleared successfully`);
    } else {
      logError(`${result.name}: Failed to clear`);
    }
  });
  
  log(`\n${colors.bold}Results: ${successful}/${total} operations completed successfully${colors.reset}`);
  
  if (successful === total) {
    logSuccess('All caches cleared successfully! Your next deployment will use fresh builds.');
    log('\nNext steps:');
    log('1. Run your build command to verify everything works');
    log('2. Deploy using: npm run deploy:force or vercel deploy --force');
    log('3. Monitor the deployment for any issues');
  } else {
    logWarning('Some cache clearing operations failed. Check the errors above.');
  }
  
  return successful === total;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Vercel Cache Clearing Script

Usage: node clear-vercel-cache.js [options]

Options:
  --skip-nextjs          Skip clearing Next.js cache
  --skip-vercel          Skip clearing Vercel cache
  --skip-package-manager Skip clearing package manager cache
  --skip-browser-cache   Skip clearing browser cache files
  --no-build-id          Skip generating new build ID
  --help, -h             Show this help message

Examples:
  node clear-vercel-cache.js                    # Clear all caches
  node clear-vercel-cache.js --skip-nextjs      # Clear all except Next.js cache
  node clear-vercel-cache.js --no-build-id      # Clear caches but don't generate new build ID
`);
    process.exit(0);
  }
  
  const options = {
    skipNextJs: args.includes('--skip-nextjs'),
    skipVercel: args.includes('--skip-vercel'),
    skipPackageManager: args.includes('--skip-package-manager'),
    skipBrowserCache: args.includes('--skip-browser-cache'),
    generateBuildId: !args.includes('--no-build-id')
  };
  
  const success = clearAllCaches(options);
  process.exit(success ? 0 : 1);
}

module.exports = {
  clearAllCaches,
  clearNextJsCache,
  clearVercelCache,
  clearPackageManagerCache,
  clearBrowserCacheFiles,
  generateNewBuildId
};