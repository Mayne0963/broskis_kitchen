#!/usr/bin/env node

/**
 * Deployment Delay Script
 * Implements a 3-minute delay after deployment completion to ensure all services are fully initialized
 * Usage: node scripts/deployment-delay.js [--wait-only] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEPLOYMENT_DELAY_MS = 3 * 60 * 1000; // 3 minutes
const CHECK_INTERVAL_MS = 5000; // 5 seconds

class DeploymentDelay {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.waitOnly = options.waitOnly || false;
    this.startTime = Date.now();
    this.logFile = path.join(process.cwd(), 'deployment-test.log');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (error) {
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  async checkServiceHealth() {
    try {
      // Check if the development server is responding
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        timeout: 5000,
        headers: {
          'User-Agent': 'Deployment-Health-Check/1.0'
        }
      });

      if (response.ok) {
        this.log('Health check passed - service is responding', 'success');
        return true;
      } else {
        this.log(`Health check failed - HTTP ${response.status}`, 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Health check error: ${error.message}`, 'warning');
      return false;
    }
  }

  async waitForDeployment() {
    this.log('Starting deployment delay mechanism...', 'info');
    this.log(`Waiting ${DEPLOYMENT_DELAY_MS / 1000} seconds for services to stabilize`, 'info');

    const endTime = this.startTime + DEPLOYMENT_DELAY_MS;
    let lastHealthCheck = 0;

    while (Date.now() < endTime) {
      const remainingTime = endTime - Date.now();
      const minutesRemaining = Math.floor(remainingTime / 60000);
      const secondsRemaining = Math.floor((remainingTime % 60000) / 1000);

      if (this.verbose) {
        this.log(`Time remaining: ${minutesRemaining}m ${secondsRemaining}s`, 'info');
      }

      // Perform health check every 30 seconds
      if (Date.now() - lastHealthCheck > 30000) {
        await this.checkServiceHealth();
        lastHealthCheck = Date.now();
      }

      // Wait for the check interval
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
    }

    this.log('Deployment delay completed - services should be stable', 'success');
  }

  async runPostDelayChecks() {
    this.log('Running post-delay health checks...', 'info');

    const checks = [
      {
        name: 'Main page accessibility',
        url: 'http://localhost:3000',
        timeout: 10000
      },
      {
        name: 'API endpoints',
        url: 'http://localhost:3000/api/health',
        timeout: 5000
      },
      {
        name: 'Static assets',
        url: 'http://localhost:3000/favicon.ico',
        timeout: 5000
      }
    ];

    for (const check of checks) {
      try {
        const response = await fetch(check.url, {
          method: 'GET',
          timeout: check.timeout,
          headers: {
            'User-Agent': 'Post-Deployment-Check/1.0'
          }
        });

        if (response.ok) {
          this.log(`✓ ${check.name} - OK (${response.status})`, 'success');
        } else {
          this.log(`✗ ${check.name} - Failed (${response.status})`, 'error');
        }
      } catch (error) {
        this.log(`✗ ${check.name} - Error: ${error.message}`, 'error');
      }
    }
  }

  async run() {
    try {
      if (!this.waitOnly) {
        await this.waitForDeployment();
        await this.runPostDelayChecks();
      } else {
        this.log('Wait-only mode - skipping health checks', 'info');
        await this.waitForDeployment();
      }

      const totalTime = Date.now() - this.startTime;
      this.log(`Deployment delay process completed in ${totalTime / 1000}s`, 'success');

      return 0;
    } catch (error) {
      this.log(`Deployment delay failed: ${error.message}`, 'error');
      return 1;
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    waitOnly: args.includes('--wait-only') || args.includes('-w')
  };

  const delay = new DeploymentDelay(options);
  
  delay.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { DeploymentDelay };