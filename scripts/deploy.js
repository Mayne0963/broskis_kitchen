#!/usr/bin/env node

/**
 * Production Deployment Script
 * 
 * This script handles the complete deployment process for Broski's Kitchen,
 * including building, testing, and deploying to production.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
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

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

function checkPrerequisites() {
  logStep('1', 'Checking prerequisites...');
  
  const requirements = [
    { command: 'node --version', name: 'Node.js' },
    { command: 'npm --version', name: 'npm' },
    { command: 'git --version', name: 'Git' },
    { command: 'firebase --version', name: 'Firebase CLI' }
  ];
  
  let allGood = true;
  
  for (const req of requirements) {
    const result = execCommand(req.command, { silent: true });
    if (result.success) {
      logSuccess(`${req.name} is installed`);
    } else {
      logError(`${req.name} is not installed or not in PATH`);
      allGood = false;
    }
  }
  
  if (!allGood) {
    logError('Please install missing prerequisites before deploying');
    process.exit(1);
  }
}

function checkEnvironmentVariables() {
  logStep('2', 'Checking environment variables...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_ADMIN_PROJECT_ID',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];
  
  // Check .env.local for development
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const missingVars = requiredEnvVars.filter(varName => {
      return !envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`);
    });
    
    if (missingVars.length > 0) {
      logWarning(`Missing or placeholder values in .env.local: ${missingVars.join(', ')}`);
      logWarning('Make sure to set these in your deployment platform');
    } else {
      logSuccess('Environment variables look good');
    }
  } else {
    logWarning('.env.local not found - make sure environment variables are set in your deployment platform');
  }
}

function runTests() {
  logStep('3', 'Running tests...');
  
  // Check if test script exists
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.test) {
    const result = execCommand('npm test');
    if (result.success) {
      logSuccess('All tests passed');
    } else {
      logError('Tests failed');
      process.exit(1);
    }
  } else {
    logWarning('No test script found in package.json');
  }
}

function runLinting() {
  logStep('4', 'Running linting...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts.lint) {
    const result = execCommand('npm run lint');
    if (result.success) {
      logSuccess('Linting passed');
    } else {
      logError('Linting failed');
      process.exit(1);
    }
  } else {
    logWarning('No lint script found in package.json');
  }
}

function runTypeCheck() {
  logStep('5', 'Running type check...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts['type-check']) {
    const result = execCommand('npm run type-check');
    if (result.success) {
      logSuccess('Type check passed');
    } else {
      logError('Type check failed');
      process.exit(1);
    }
  } else if (fs.existsSync('tsconfig.json')) {
    const result = execCommand('npx tsc --noEmit');
    if (result.success) {
      logSuccess('Type check passed');
    } else {
      logError('Type check failed');
      process.exit(1);
    }
  } else {
    logWarning('No TypeScript configuration found');
  }
}

function buildProject() {
  logStep('6', 'Building project...');
  
  const result = execCommand('npm run build');
  if (result.success) {
    logSuccess('Build completed successfully');
  } else {
    logError('Build failed');
    process.exit(1);
  }
}

function deployFirebaseRules() {
  logStep('7', 'Deploying Firebase security rules...');
  
  const rulesFiles = ['firestore.rules', 'storage.rules'];
  const missingFiles = rulesFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    logWarning(`Missing rules files: ${missingFiles.join(', ')}`);
    return;
  }
  
  const result = execCommand('firebase deploy --only firestore:rules,storage');
  if (result.success) {
    logSuccess('Firebase rules deployed successfully');
  } else {
    logError('Failed to deploy Firebase rules');
    logWarning('Continuing with deployment...');
  }
}

function deployToVercel() {
  logStep('8', 'Deploying to Vercel...');
  
  // Check if vercel.json exists
  if (!fs.existsSync('vercel.json')) {
    logWarning('vercel.json not found - using default Vercel configuration');
  }
  
  const result = execCommand('vercel --prod');
  if (result.success) {
    logSuccess('Deployed to Vercel successfully');
  } else {
    logError('Failed to deploy to Vercel');
    process.exit(1);
  }
}

function deployToNetlify() {
  logStep('8', 'Deploying to Netlify...');
  
  // Check if netlify.toml exists
  if (!fs.existsSync('netlify.toml')) {
    logWarning('netlify.toml not found - using default Netlify configuration');
  }
  
  const result = execCommand('netlify deploy --prod');
  if (result.success) {
    logSuccess('Deployed to Netlify successfully');
  } else {
    logError('Failed to deploy to Netlify');
    process.exit(1);
  }
}

function deployToFirebaseHosting() {
  logStep('8', 'Deploying to Firebase Hosting...');
  
  const result = execCommand('firebase deploy --only hosting');
  if (result.success) {
    logSuccess('Deployed to Firebase Hosting successfully');
  } else {
    logError('Failed to deploy to Firebase Hosting');
    process.exit(1);
  }
}

function updateDatabase() {
  logStep('9', 'Running database migrations...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts['db:migrate']) {
    const result = execCommand('npm run db:migrate');
    if (result.success) {
      logSuccess('Database migrations completed');
    } else {
      logError('Database migrations failed');
      process.exit(1);
    }
  } else {
    logWarning('No database migration script found');
  }
}

function runPostDeploymentTests() {
  logStep('10', 'Running post-deployment tests...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.scripts && packageJson.scripts['test:e2e']) {
    logWarning('Post-deployment tests available but not run automatically');
    log('Run them manually with: npm run test:e2e', 'blue');
  } else {
    logWarning('No end-to-end tests configured');
  }
}

function createDeploymentSummary() {
  const timestamp = new Date().toISOString();
  const gitHash = execCommand('git rev-parse HEAD', { silent: true });
  const gitBranch = execCommand('git rev-parse --abbrev-ref HEAD', { silent: true });
  
  const summary = {
    timestamp,
    gitHash: gitHash.success ? gitHash.output.trim() : 'unknown',
    gitBranch: gitBranch.success ? gitBranch.output.trim() : 'unknown',
    nodeVersion: process.version,
    platform: process.platform
  };
  
  fs.writeFileSync('deployment-summary.json', JSON.stringify(summary, null, 2));
  logSuccess('Deployment summary created');
}

function printDeploymentSummary() {
  log('\n' + '='.repeat(50), 'bright');
  log('🚀 Deployment Complete!', 'green');
  log('='.repeat(50), 'bright');
  
  const summary = JSON.parse(fs.readFileSync('deployment-summary.json', 'utf8'));
  
  log('\nDeployment Details:', 'bright');
  log(`• Timestamp: ${summary.timestamp}`, 'blue');
  log(`• Git Branch: ${summary.gitBranch}`, 'blue');
  log(`• Git Hash: ${summary.gitHash.substring(0, 8)}`, 'blue');
  log(`• Node Version: ${summary.nodeVersion}`, 'blue');
  
  log('\nNext Steps:', 'bright');
  log('1. Test the deployed application', 'cyan');
  log('2. Monitor application logs', 'cyan');
  log('3. Check error tracking dashboard', 'cyan');
  log('4. Verify all integrations are working', 'cyan');
  
  log('\nUseful Commands:', 'bright');
  log('• View logs: vercel logs <deployment-url>', 'magenta');
  log('• Rollback: vercel rollback <deployment-url>', 'magenta');
  log('• Check status: firebase hosting:sites:list', 'magenta');
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'vercel'; // Default to Vercel
  
  log('🚀 Broski\'s Kitchen Deployment Script', 'bright');
  log(`Platform: ${platform}`, 'bright');
  log('==========================================\n', 'bright');
  
  // Pre-deployment checks
  checkPrerequisites();
  checkEnvironmentVariables();
  
  // Quality checks
  runTests();
  runLinting();
  runTypeCheck();
  
  // Build
  buildProject();
  
  // Deploy Firebase rules
  deployFirebaseRules();
  
  // Deploy to platform
  switch (platform.toLowerCase()) {
    case 'vercel':
      deployToVercel();
      break;
    case 'netlify':
      deployToNetlify();
      break;
    case 'firebase':
      deployToFirebaseHosting();
      break;
    default:
      logError(`Unknown platform: ${platform}`);
      log('Supported platforms: vercel, netlify, firebase', 'blue');
      process.exit(1);
  }
  
  // Post-deployment
  updateDatabase();
  runPostDeploymentTests();
  
  // Summary
  createDeploymentSummary();
  printDeploymentSummary();
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the deployment
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  checkEnvironmentVariables,
  runTests,
  runLinting,
  runTypeCheck,
  buildProject,
  deployFirebaseRules,
  deployToVercel,
  deployToNetlify,
  deployToFirebaseHosting
};