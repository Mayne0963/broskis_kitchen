#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner for BroskisKitchen.com
 * Includes 3-minute deployment delay and complete test coverage
 */

import { spawn, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

class TestRunner {
  constructor(options = {}) {
    this.options = {
      skipDelay: options.skipDelay || false,
      verbose: options.verbose || false,
      browsers: options.browsers || ['chromium', 'firefox', 'webkit'],
      devices: options.devices || ['desktop', 'mobile', 'tablet'],
      ...options
    }
    
    this.startTime = Date.now()
    this.logFile = path.join(process.cwd(), 'test-run.log')
    this.resultsDir = path.join(process.cwd(), 'test-results')
    
    this.ensureDirectories()
  }

  ensureDirectories() {
    const dirs = [
      this.resultsDir,
      path.join(this.resultsDir, 'screenshots'),
      path.join(this.resultsDir, 'videos'),
      path.join(this.resultsDir, 'traces')
    ]
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`
    
    console.log(logMessage)
    
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n')
    } catch (error) {
      console.error(`Failed to write to log file: ${error.message}`)
    }
  }

  async runDeploymentDelay() {
    if (this.options.skipDelay) {
      this.log('Skipping deployment delay as requested', 'info')
      return
    }

    this.log('Starting 3-minute deployment delay...', 'info')
    
    try {
      // Run the deployment delay script
      const delayScript = path.join(__dirname, 'deployment-delay.js')
      execSync(`node "${delayScript}" --verbose`, { stdio: 'inherit' })
      
      this.log('Deployment delay completed successfully', 'success')
    } catch (error) {
      this.log(`Deployment delay failed: ${error.message}`, 'error')
      throw error
    }
  }

  async runPlaywrightTests() {
    console.log('🎭 Running Playwright tests...')
    
    const projects = ['chromium', 'firefox', 'webkit', 'mobile-chrome', 'mobile-safari']
    const results = []
    
    for (const project of projects) {
      console.log(`🧪 Testing on ${project}...`)
      
      try {
        const result = await this.runPlaywrightProject(project)
        results.push({ project, status: 'passed', result })
        console.log(`✅ ${project} tests completed successfully`)
      } catch (error) {
        results.push({ project, status: 'failed', error: error.message })
        console.error(`❌ ${project} tests failed:`, error.message)
      }
    }
    
    // Generate test report
    console.log('📝 Generating test report...')
    try {
      await this.generateTestReport()
    } catch (error) {
      console.error('Failed to generate test report:', error.message)
    }
    
    return results
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ')
      const child = spawn(cmd, args, {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        shell: true,
        ...options
      })

      let output = ''
      let error = ''

      if (!this.options.verbose) {
        child.stdout?.on('data', (data) => {
          output += data.toString()
        })

        child.stderr?.on('data', (data) => {
          error += data.toString()
        })
      }

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          output,
          error,
          exitCode: code
        })
      })

      child.on('error', (err) => {
        resolve({
          success: false,
          error: err.message,
          output: ''
        })
      })
    })
  }

  async generateTestReport() {
    console.log('📝 Generating comprehensive test report...')
    
    try {
      // Import the report generator
      const { TestReportGenerator } = await import('./generate-test-report.js')
      const generator = new TestReportGenerator()
      
      const { jsonPath, htmlPath, reportData } = await generator.generateReport()
      
      console.log(`✅ Test report generated successfully:`)
      console.log(`   JSON: ${jsonPath}`)
      console.log(`   HTML: ${htmlPath}`)
      
      return { jsonPath, htmlPath, reportData }
    } catch (error) {
      console.error('Failed to generate test report:', error)
      throw error
    }
  }

  async collectPerformanceMetrics() {
    try {
      const metricsFile = path.join(process.cwd(), 'playwright-metrics.json')
      if (fs.existsSync(metricsFile)) {
        const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'))
        return {
          pageLoadTimes: metrics.filter(m => m.page),
          apiResponseTimes: metrics.filter(m => m.api),
          redirectTimes: metrics.filter(m => m.redirectTimeMs)
        }
      }
    } catch (error) {
      this.log(`Failed to collect performance metrics: ${error.message}`, 'warning')
    }
    
    return {}
  }

  async cleanup() {
    this.log('Cleaning up test artifacts...', 'info')
    
    // Move Playwright report to results directory
    const playwrightReportDir = path.join(process.cwd(), 'playwright-report')
    if (fs.existsSync(playwrightReportDir)) {
      const targetDir = path.join(this.resultsDir, 'playwright-report')
      
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true })
      }
      
      fs.renameSync(playwrightReportDir, targetDir)
    }
  }

  async run() {
    try {
      this.log('Starting comprehensive E2E testing for BroskisKitchen.com', 'info')
      
      // Step 1: Deployment delay
      await this.runDeploymentDelay()
      
      // Step 2: Run Playwright tests
      const testResults = await this.runPlaywrightTests()
      
      // Step 3: Generate report
      const report = await this.generateReport(testResults)
      
      // Step 4: Cleanup
      await this.cleanup()
      
      // Final summary
      const duration = Date.now() - this.startTime
      this.log(`Comprehensive testing completed in ${Math.round(duration / 1000)}s`, 'success')
      this.log(`Total tests: ${report.summary.total}, Passed: ${report.summary.passed}, Failed: ${report.summary.failed}`, 'info')
      
      // Exit with appropriate code
      const exitCode = report.summary.failed > 0 ? 1 : 0
      process.exit(exitCode)
      
    } catch (error) {
      this.log(`Test run failed: ${error.message}`, 'error')
      process.exit(1)
    }
  }
}

// CLI interface
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (import.meta.url === `file://${__filename}`) {
  const args = process.argv.slice(2)
  const options = {
    skipDelay: args.includes('--skip-delay') || args.includes('-s'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
  }

  if (options.help) {
    console.log(`
BroskisKitchen.com Comprehensive E2E Test Runner

Usage: node scripts/test-runner.js [options]

Options:
  --skip-delay, -s    Skip the 3-minute deployment delay
  --verbose, -v       Enable verbose output
  --help, -h          Show this help message

Examples:
  node scripts/test-runner.js                    # Run with deployment delay
  node scripts/test-runner.js --skip-delay       # Skip deployment delay
  node scripts/test-runner.js --verbose          # Verbose output
`)
    process.exit(0)
  }

  const runner = new TestRunner(options)
  
  runner.run().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { TestRunner }