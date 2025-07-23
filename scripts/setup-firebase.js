#!/usr/bin/env node

/**
 * Firebase Setup Script
 * 
 * This script helps set up Firebase services for Broski's Kitchen
 * including Firestore, Storage, and Authentication configuration.
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

function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function installFirebaseCLI() {
  logStep('1', 'Installing Firebase CLI...');
  try {
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    logSuccess('Firebase CLI installed successfully');
  } catch (error) {
    logError('Failed to install Firebase CLI');
    process.exit(1);
  }
}

function loginToFirebase() {
  logStep('2', 'Logging into Firebase...');
  try {
    execSync('firebase login', { stdio: 'inherit' });
    logSuccess('Logged into Firebase successfully');
  } catch (error) {
    logError('Failed to login to Firebase');
    process.exit(1);
  }
}

function initializeFirebase() {
  logStep('3', 'Initializing Firebase project...');
  
  if (fs.existsSync('.firebaserc')) {
    logWarning('Firebase project already initialized');
    return;
  }
  
  try {
    execSync('firebase init', { stdio: 'inherit' });
    logSuccess('Firebase project initialized successfully');
  } catch (error) {
    logError('Failed to initialize Firebase project');
    process.exit(1);
  }
}

function deploySecurityRules() {
  logStep('4', 'Deploying security rules...');
  
  // Check if rules files exist
  const rulesFiles = ['firestore.rules', 'storage.rules'];
  const missingFiles = rulesFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    logError(`Missing rules files: ${missingFiles.join(', ')}`);
    return;
  }
  
  try {
    execSync('firebase deploy --only firestore:rules,storage', { stdio: 'inherit' });
    logSuccess('Security rules deployed successfully');
  } catch (error) {
    logError('Failed to deploy security rules');
    logWarning('You can deploy them later with: firebase deploy --only firestore:rules,storage');
  }
}

function createEnvironmentFile() {
  logStep('5', 'Setting up environment variables...');
  
  const envFile = '.env.local';
  const templateFile = 'api-keys-template.md';
  
  if (fs.existsSync(envFile)) {
    logWarning('.env.local already exists');
    return;
  }
  
  if (!fs.existsSync(templateFile)) {
    logError('api-keys-template.md not found');
    return;
  }
  
  try {
    // Read template and extract environment variables
    const template = fs.readFileSync(templateFile, 'utf8');
    const envVars = template.match(/^[A-Z_]+=.*/gm) || [];
    
    // Create .env.local with template values
    const envContent = envVars.join('\n') + '\n';
    fs.writeFileSync(envFile, envContent);
    
    logSuccess('.env.local created from template');
    logWarning('Please update .env.local with your actual API keys');
  } catch (error) {
    logError('Failed to create .env.local');
  }
}

function setupFirebaseEmulators() {
  logStep('6', 'Setting up Firebase emulators...');
  
  try {
    // Check if emulators are configured
    const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    
    if (!firebaseJson.emulators) {
      logWarning('Emulators not configured in firebase.json');
      return;
    }
    
    // Install emulator dependencies
    execSync('firebase setup:emulators:firestore', { stdio: 'inherit' });
    execSync('firebase setup:emulators:storage', { stdio: 'inherit' });
    
    logSuccess('Firebase emulators set up successfully');
    log('\nTo start emulators, run: firebase emulators:start', 'blue');
  } catch (error) {
    logWarning('Could not set up emulators automatically');
    log('You can set them up later with: firebase setup:emulators:firestore', 'blue');
  }
}

function validateSetup() {
  logStep('7', 'Validating setup...');
  
  const requiredFiles = [
    'firebase.json',
    'firestore.rules',
    'storage.rules',
    '.env.local'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length === 0) {
    logSuccess('All required files are present');
  } else {
    logWarning(`Missing files: ${missingFiles.join(', ')}`);
  }
  
  // Check if Firebase project is configured
  try {
    const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
    if (firebaserc.projects && firebaserc.projects.default) {
      logSuccess(`Firebase project configured: ${firebaserc.projects.default}`);
    }
  } catch (error) {
    logWarning('Firebase project not configured');
  }
}

function printNextSteps() {
  log('\n' + '='.repeat(50), 'bright');
  log('🎉 Firebase Setup Complete!', 'green');
  log('='.repeat(50), 'bright');
  
  log('\nNext steps:', 'bright');
  log('1. Update .env.local with your actual API keys', 'blue');
  log('2. Configure Firebase Authentication providers', 'blue');
  log('3. Set up Stripe webhook endpoints', 'blue');
  log('4. Test the application with: npm run dev', 'blue');
  log('5. Start Firebase emulators: firebase emulators:start', 'blue');
  
  log('\nUseful commands:', 'bright');
  log('• Deploy rules: firebase deploy --only firestore:rules,storage', 'cyan');
  log('• Start emulators: firebase emulators:start', 'cyan');
  log('• View Firebase console: firebase open', 'cyan');
  log('• Check project status: firebase projects:list', 'cyan');
  
  log('\nDocumentation:', 'bright');
  log('• Setup Guide: ./SETUP_GUIDE.md', 'magenta');
  log('• Firebase Security: ./FIREBASE_SECURITY_SETUP.md', 'magenta');
  log('• API Keys Template: ./api-keys-template.md', 'magenta');
}

function main() {
  log('🔥 Broski\'s Kitchen Firebase Setup', 'bright');
  log('=====================================\n', 'bright');
  
  // Check if Firebase CLI is installed
  if (!checkFirebaseCLI()) {
    installFirebaseCLI();
  } else {
    logSuccess('Firebase CLI is already installed');
  }
  
  // Run setup steps
  loginToFirebase();
  initializeFirebase();
  deploySecurityRules();
  createEnvironmentFile();
  setupFirebaseEmulators();
  validateSetup();
  
  // Show next steps
  printNextSteps();
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

// Run the setup
if (require.main === module) {
  main();
}

module.exports = {
  checkFirebaseCLI,
  installFirebaseCLI,
  loginToFirebase,
  initializeFirebase,
  deploySecurityRules,
  createEnvironmentFile,
  setupFirebaseEmulators,
  validateSetup
};