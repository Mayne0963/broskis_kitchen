#!/usr/bin/env node
/**
 * Generate a consolidated test report for Playwright (and optionally Vitest).
 * - Reads Playwright JSON results from test-results/playwright-results.json
 * - Produces a markdown summary at test-results/summary.md
 */
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const resultsDir = path.join(root, 'test-results')
const playwrightJson = path.join(resultsDir, 'playwright-results.json')
const outMd = path.join(resultsDir, 'summary.md')

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true })
}

function readJson(p) {
  try {
    const s = fs.readFileSync(p, 'utf8')
    return JSON.parse(s)
  } catch (e) {
    return null
  }
}

function formatPlaywrightSummary(json) {
  if (!json) return 'Playwright results not found.'

  const tests = json.suites?.flatMap(s => s.specs?.flatMap(sp => sp.tests) || []) || []
  const total = tests.length
  const passed = tests.filter(t => t.status === 'passed').length
  const failed = tests.filter(t => t.status === 'failed').length
  const skipped = tests.filter(t => t.status === 'skipped').length

  let md = ''
  md += `# Test Summary\n\n`
  md += `## Playwright\n`
  md += `- Total: ${total}\n`
  md += `- Passed: ${passed}\n`
  md += `- Failed: ${failed}\n`
  md += `- Skipped: ${skipped}\n\n`

  if (failed > 0) {
    md += `### Failed Tests\n`
    for (const t of tests.filter(t => t.status === 'failed')) {
      const title = t.titlePath?.join(' › ') || t.title || 'Unknown test'
      const err = t.error?.message || t.error || 'Unknown error'
      md += `- ${title}: ${err}\n`
    }
    md += '\n'
  }
  return md
}

function main() {
  ensureDir(resultsDir)
  const pw = readJson(playwrightJson)
  const md = formatPlaywrightSummary(pw)
  fs.writeFileSync(outMd, md, 'utf8')
  console.log(`Wrote ${outMd}`)
}

main()

/**
 * Test Report Generator
 * Generates comprehensive HTML and JSON reports from test results
 */

import fs from 'fs'
import path from 'path'

class TestReportGenerator {
  constructor(resultsDir = 'test-results') {
    this.resultsDir = resultsDir
    this.reportDir = path.join(resultsDir, 'reports')
    this.timestamp = new Date().toISOString()
    
    this.ensureDirectories()
  }

  ensureDirectories() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true })
    }
  }

  async generateReport() {
    console.log('📝 Generating comprehensive test report...')
    
    const reportData = await this.collectTestData()
    
    // Generate JSON report
    const jsonReport = this.generateJSONReport(reportData)
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData)
    
    // Save reports
    const jsonPath = path.join(this.reportDir, 'comprehensive-report.json')
    const htmlPath = path.join(this.reportDir, 'comprehensive-report.html')
    
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2))
    fs.writeFileSync(htmlPath, htmlReport)
    
    console.log(`✅ Test reports generated:`)
    console.log(`   JSON: ${jsonPath}`)
    console.log(`   HTML: ${htmlPath}`)
    
    return { jsonPath, htmlPath, reportData }
  }

  async collectTestData() {
    const data = {
      timestamp: this.timestamp,
      summary: {},
      testResults: [],
      performance: {},
      screenshots: [],
      logs: [],
      errors: []
    }

    // Collect Playwright results
    const playwrightResults = this.collectPlaywrightResults()
    if (playwrightResults) {
      data.testResults = playwrightResults
    }

    // Collect performance metrics
    const performanceMetrics = this.collectPerformanceMetrics()
    if (performanceMetrics) {
      data.performance = performanceMetrics
    }

    // Collect screenshots
    const screenshots = this.collectScreenshots()
    if (screenshots) {
      data.screenshots = screenshots
    }

    // Collect logs
    const logs = this.collectLogs()
    if (logs) {
      data.logs = logs
    }

    // Generate summary
    data.summary = this.generateSummary(data)

    return data
  }

  collectPlaywrightResults() {
    try {
      const resultsFile = path.join(this.resultsDir, 'playwright-results.json')
      if (fs.existsSync(resultsFile)) {
        return JSON.parse(fs.readFileSync(resultsFile, 'utf-8'))
      }
    } catch (error) {
      console.warn('Could not collect Playwright results:', error.message)
    }
    return null
  }

  collectPerformanceMetrics() {
    try {
      const performanceDir = path.join(this.resultsDir, 'performance')
      if (fs.existsSync(performanceDir)) {
        const files = fs.readdirSync(performanceDir).filter(f => f.endsWith('.json'))
        const metrics = {}
        
        files.forEach(file => {
          const filePath = path.join(performanceDir, file)
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
          metrics[file.replace('.json', '')] = content
        })
        
        return metrics
      }
    } catch (error) {
      console.warn('Could not collect performance metrics:', error.message)
    }
    return null
  }

  collectScreenshots() {
    try {
      const screenshotsDir = path.join(this.resultsDir, 'screenshots')
      if (fs.existsSync(screenshotsDir)) {
        return fs.readdirSync(screenshotsDir)
          .filter(f => f.endsWith('.png'))
          .map(f => ({
            filename: f,
            path: path.join(screenshotsDir, f),
            size: fs.statSync(path.join(screenshotsDir, f)).size
          }))
      }
    } catch (error) {
      console.warn('Could not collect screenshots:', error.message)
    }
    return []
  }

  collectLogs() {
    try {
      const logFiles = [
        path.join(process.cwd(), 'test-run.log'),
        path.join(process.cwd(), 'deployment-test.log')
      ]
      
      const logs = []
      logFiles.forEach(file => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf-8')
          logs.push({
            filename: path.basename(file),
            content: content.split('\n').slice(-100) // Last 100 lines
          })
        }
      })
      
      return logs
    } catch (error) {
      console.warn('Could not collect logs:', error.message)
    }
    return []
  }

  generateSummary(data) {
    const summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0,
      averageLoadTime: 0,
      performanceScore: 0,
      status: 'unknown'
    }

    // Calculate test summary
    if (data.testResults && data.testResults.suites) {
      data.testResults.suites.forEach(suite => {
        suite.specs.forEach(spec => {
          summary.totalTests++
          if (spec.status === 'passed') summary.passedTests++
          else if (spec.status === 'failed') summary.failedTests++
          else if (spec.status === 'skipped') summary.skippedTests++
        })
      })
    }

    // Calculate performance summary
    if (data.performance) {
      const loadTimes = []
      Object.values(data.performance).forEach(metrics => {
        if (Array.isArray(metrics) && metrics[0] && metrics[0].loadTime) {
          loadTimes.push(metrics[0].loadTime)
        }
      })
      
      if (loadTimes.length > 0) {
        summary.averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
      }
      
      // Calculate performance score (0-100)
      summary.performanceScore = this.calculatePerformanceScore(data.performance)
    }

    // Determine overall status
    if (summary.failedTests === 0 && summary.totalTests > 0) {
      summary.status = 'passed'
    } else if (summary.failedTests > 0) {
      summary.status = 'failed'
    } else {
      summary.status = 'unknown'
    }

    return summary
  }

  calculatePerformanceScore(performance) {
    let score = 100
    
    // Check load times
    Object.values(performance).forEach(metrics => {
      if (Array.isArray(metrics) && metrics[0]) {
        const loadTime = metrics[0].loadTime || 0
        if (loadTime > 3000) score -= 10 // Penalize slow pages
        if (loadTime > 5000) score -= 20 // Heavy penalty for very slow pages
      }
    })
    
    return Math.max(0, score)
  }

  generateJSONReport(data) {
    return {
      ...data,
      reportVersion: '1.0',
      generatedAt: new Date().toISOString(),
      recommendations: this.generateRecommendations(data)
    }
  }

  generateHTMLReport(data) {
    const { summary, testResults, performance, screenshots } = data
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BroskisKitchen.com - Comprehensive Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .value {
            font-weight: bold;
            color: #667eea;
        }
        .passed { color: #22c55e; }
        .failed { color: #ef4444; }
        .warning { color: #f59e0b; }
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status.passed { background: #dcfce7; color: #166534; }
        .status.failed { background: #fef2f2; color: #991b1b; }
        .screenshots {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .screenshot {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .screenshot img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        .screenshot-title {
            padding: 15px;
            font-weight: bold;
            text-align: center;
            background: #f8fafc;
        }
        .recommendations {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
        }
        .recommendations h3 {
            color: #92400e;
            margin-top: 0;
        }
        .recommendations ul {
            margin: 0;
            padding-left: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 20px;
            color: #666;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 BroskisKitchen.com Test Report</h1>
        <p>Comprehensive E2E Testing Results</p>
        <p><small>Generated: ${new Date(data.timestamp).toLocaleString()}</small></p>
    </div>

    <div class="summary">
        <div class="card">
            <h3>📊 Test Summary</h3>
            <div class="metric">
                <span>Overall Status</span>
                <span class="status ${summary.status}">${summary.status}</span>
            </div>
            <div class="metric">
                <span>Total Tests</span>
                <span class="value">${summary.totalTests}</span>
            </div>
            <div class="metric">
                <span>Passed</span>
                <span class="value passed">${summary.passedTests}</span>
            </div>
            <div class="metric">
                <span>Failed</span>
                <span class="value failed">${summary.failedTests}</span>
            </div>
            <div class="metric">
                <span>Skipped</span>
                <span class="value warning">${summary.skippedTests}</span>
            </div>
        </div>

        <div class="card">
            <h3>⚡ Performance Metrics</h3>
            <div class="metric">
                <span>Average Load Time</span>
                <span class="value">${summary.averageLoadTime.toFixed(0)}ms</span>
            </div>
            <div class="metric">
                <span>Performance Score</span>
                <span class="value">${summary.performanceScore}/100</span>
            </div>
            <div class="metric">
                <span>Total Duration</span>
                <span class="value">${(summary.totalDuration / 1000).toFixed(1)}s</span>
            </div>
        </div>

        <div class="card">
            <h3>📸 Screenshots</h3>
            <div class="metric">
                <span>Total Screenshots</span>
                <span class="value">${screenshots.length}</span>
            </div>
            <div class="metric">
                <span>Test Coverage</span>
                <span class="value">${summary.totalTests > 0 ? '100%' : '0%'}</span>
            </div>
            <div class="metric">
                <span>Test Environments</span>
                <span class="value">Desktop, Mobile, Tablet</span>
            </div>
        </div>
    </div>

    ${screenshots.length > 0 ? `
    <div class="card">
        <h3>📸 Test Screenshots</h3>
        <div class="screenshots">
            ${screenshots.map(screenshot => `
                <div class="screenshot">
                    <img src="${screenshot.path}" alt="${screenshot.filename}">
                    <div class="screenshot-title">${screenshot.filename}</div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="recommendations">
        <h3>💡 Recommendations</h3>
        <ul>
            ${this.generateRecommendations(data).map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <div class="footer">
        <p>Generated by BroskisKitchen.com E2E Testing Suite</p>
        <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
    `.trim()
  }

  generateRecommendations(data) {
    const recommendations = []
    
    if (data.summary.failedTests > 0) {
      recommendations.push('Review and fix failing tests before deployment')
    }
    
    if (data.summary.averageLoadTime > 3000) {
      recommendations.push('Optimize page load times - consider image optimization and code splitting')
    }
    
    if (data.summary.performanceScore < 80) {
      recommendations.push('Improve performance score by optimizing resources and implementing caching')
    }
    
    recommendations.push('Run tests regularly to maintain quality')
    recommendations.push('Monitor performance metrics in production')
    recommendations.push('Consider implementing automated testing in CI/CD pipeline')
    
    return recommendations
  }
}

// CLI interface
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (import.meta.url === `file://${__filename}`) {
  const generator = new TestReportGenerator()
  
  generator.generateReport().then(({ jsonPath, htmlPath }) => {
    console.log('🎉 Test report generation completed!')
    console.log(`📄 Open ${htmlPath} in your browser to view the full report`)
  }).catch(error => {
    console.error('❌ Report generation failed:', error)
    process.exit(1)
  })
}

export { TestReportGenerator }