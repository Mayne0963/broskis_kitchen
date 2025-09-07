#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script
 * 
 * This script provides instructions and commands to set up the required
 * environment variables for Broski's Kitchen Vercel deployment.
 * 
 * Usage: node scripts/setup-vercel-env.js
 */

import { execSync } from 'child_process';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Helper functions for colored output
const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`;
const bold = (text) => `${colors.bright}${text}${colors.reset}`;
const red = (text) => colorize(text, 'red');
const green = (text) => colorize(text, 'green');
const yellow = (text) => colorize(text, 'yellow');
const blue = (text) => colorize(text, 'blue');
const cyan = (text) => colorize(text, 'cyan');
const white = (text) => colorize(text, 'white');
const gray = (text) => colorize(text, 'gray');

// Required environment variables for the project
const REQUIRED_ENV_VARS = [
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    description: 'Stripe publishable key for payment processing',
    placeholder: 'pk_test_...',
    required: true
  },
  {
    name: 'GOOGLE_MAPS_API_KEY',
    description: 'Google Maps API key for location services',
    placeholder: 'AIzaSy...',
    required: true
  },
  {
    name: 'ADMIN_EMAILS',
    description: 'Comma-separated list of admin email addresses',
    placeholder: 'admin@broskiskitchen.com,manager@broskiskitchen.com',
    required: true
  },
  {
    name: 'NEXTAUTH_URL',
    description: 'NextAuth.js URL (must use HTTPS in production)',
    placeholder: 'https://broskiskitchen.com',
    required: true,
    production: 'https://broskiskitchen.com',
    preview: 'https://your-preview-url.vercel.app',
    development: 'http://localhost:3000'
  }
];

function displayHeader() {
  console.log(blue(bold('\n🚀 Vercel Environment Variables Setup')));
  console.log(blue('='.repeat(50)));
  console.log(yellow('Setting up required environment variables for Broski\'s Kitchen deployment\n'));
}

function displayRequiredVariables() {
  console.log(green(bold('📋 Required Environment Variables:')));
  console.log(gray('-'.repeat(50)));
  
  REQUIRED_ENV_VARS.forEach((envVar, index) => {
    console.log(white(`${index + 1}. ${cyan(bold(envVar.name))}`));
    console.log(gray(`   Description: ${envVar.description}`));
    console.log(gray(`   Example: ${envVar.placeholder}`));
    
    if (envVar.name === 'NEXTAUTH_URL') {
      console.log(yellow(`   Production: ${envVar.production}`));
      console.log(yellow(`   Preview: ${envVar.preview}`));
      console.log(yellow(`   Development: ${envVar.development}`));
    }
    console.log('');
  });
}

function displayVercelCommands() {
  console.log(green(bold('🔧 Vercel CLI Commands:')));
  console.log(gray('-'.repeat(50)));
  console.log(yellow('If you have Vercel CLI installed, you can use these commands:\n'));
  
  // Commands for setting environment variables
  REQUIRED_ENV_VARS.forEach(envVar => {
    if (envVar.name === 'NEXTAUTH_URL') {
      console.log(cyan(`# Set ${envVar.name} for different environments`));
      console.log(white(`vercel env add ${envVar.name} production`));
      console.log(gray(`# Enter: ${envVar.production}`));
      console.log(white(`vercel env add ${envVar.name} preview`));
      console.log(gray(`# Enter: ${envVar.preview}`));
      console.log(white(`vercel env add ${envVar.name} development`));
      console.log(gray(`# Enter: ${envVar.development}\n`));
    } else {
      console.log(cyan(`# Set ${envVar.name} for all environments`));
      console.log(white(`vercel env add ${envVar.name}`));
      console.log(gray(`# Enter your ${envVar.description.toLowerCase()}`));
      console.log(gray(`# Example: ${envVar.placeholder}\n`));
    }
  });
}

function displayManualInstructions() {
  console.log(green(bold('🌐 Manual Setup via Vercel Dashboard:')));
  console.log(gray('-'.repeat(50)));
  console.log(white('1. Go to https://vercel.com/dashboard'));
  console.log(white('2. Select your Broski\'s Kitchen project'));
  console.log(white('3. Navigate to Settings → Environment Variables'));
  console.log(white('4. Add each variable listed above'));
  console.log(white('5. Select appropriate environments (Development, Preview, Production)'));
  console.log(white('6. Save and trigger a new deployment\n'));
}

function displayDeploymentInstructions() {
  console.log(green(bold('🚀 Trigger New Deployment:')));
  console.log(gray('-'.repeat(50)));
  console.log(white('After setting all environment variables:'));
  console.log(cyan('vercel --prod'));
  console.log(gray('or'));
  console.log(white('Push a new commit to trigger automatic deployment\n'));
}

function displayValidationScript() {
  console.log(green(bold('✅ Validate Environment Variables:')));
  console.log(gray('-'.repeat(50)));
  console.log(white('Run the validation script to check your setup:'));
  console.log(cyan('npm run validate:env'));
  console.log(gray('or'));
  console.log(cyan('node scripts/validate-env.js\n'));
}

function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function displayCLIInstallation() {
  console.log(red(bold('⚠️  Vercel CLI Not Found')));
  console.log(gray('-'.repeat(50)));
  console.log(white('Install Vercel CLI for easier environment variable management:'));
  console.log(cyan('npm install -g vercel'));
  console.log(gray('or'));
  console.log(cyan('pnpm install -g vercel\n'));
}

function main() {
  displayHeader();
  
  // Check if Vercel CLI is available
  const hasVercelCLI = checkVercelCLI();
  
  if (!hasVercelCLI) {
    displayCLIInstallation();
  }
  
  displayRequiredVariables();
  
  if (hasVercelCLI) {
    displayVercelCommands();
  }
  
  displayManualInstructions();
  displayDeploymentInstructions();
  displayValidationScript();
  
  console.log(green(bold('🎉 Setup Complete!')));
  console.log(yellow('After setting all environment variables, your Vercel deployment should succeed.\n'));
}

// Main execution
// In ES modules, we can directly call the main function
main();

export {
  REQUIRED_ENV_VARS,
  main,
  displayHeader,
  displayRequiredVariables,
  displayVercelCommands,
  displayManualInstructions,
  displayDeploymentInstructions,
  displayValidationScript
};