'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

interface AccessibilityIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  element?: string
  suggestion: string
}

interface AccessibilityAuditProps {
  enabled?: boolean
  showInProduction?: boolean
}

export function AccessibilityAudit({ 
  enabled = process.env.NODE_ENV === 'development', 
  showInProduction = false 
}: AccessibilityAuditProps) {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  const shouldShow = enabled || (process.env.NODE_ENV === 'production' && showInProduction)

  const runAccessibilityAudit = () => {
    if (!shouldShow) return
    
    setIsScanning(true)
    const foundIssues: AccessibilityIssue[] = []

    // Check for missing alt text on images
    const images = document.querySelectorAll('img')
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-hidden')) {
        foundIssues.push({
          id: `img-alt-${index}`,
          type: 'error',
          message: 'Image missing alt text',
          element: `img[src="${img.src}"]`,
          suggestion: 'Add descriptive alt text or aria-hidden="true" for decorative images'
        })
      }
    })

    // Check for missing form labels
    const inputs = document.querySelectorAll('input, textarea, select')
    inputs.forEach((input, index) => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`) || 
                      input.getAttribute('aria-label') || 
                      input.getAttribute('aria-labelledby')
      
      if (!hasLabel && input.type !== 'hidden') {
        foundIssues.push({
          id: `input-label-${index}`,
          type: 'error',
          message: 'Form input missing label',
          element: `${input.tagName.toLowerCase()}[type="${input.getAttribute('type')}"]`,
          suggestion: 'Add a label element, aria-label, or aria-labelledby attribute'
        })
      }
    })

    // Check for missing heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let previousLevel = 0
    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.charAt(1))
      if (currentLevel > previousLevel + 1 && previousLevel !== 0) {
        foundIssues.push({
          id: `heading-hierarchy-${index}`,
          type: 'warning',
          message: `Heading level skipped from h${previousLevel} to h${currentLevel}`,
          element: heading.tagName.toLowerCase(),
          suggestion: 'Use heading levels in sequential order (h1, h2, h3, etc.)'
        })
      }
      previousLevel = currentLevel
    })

    // Check for buttons without accessible names
    const buttons = document.querySelectorAll('button')
    buttons.forEach((button, index) => {
      const hasAccessibleName = button.textContent?.trim() || 
                               button.getAttribute('aria-label') || 
                               button.getAttribute('aria-labelledby')
      
      if (!hasAccessibleName) {
        foundIssues.push({
          id: `button-name-${index}`,
          type: 'error',
          message: 'Button missing accessible name',
          element: 'button',
          suggestion: 'Add text content, aria-label, or aria-labelledby attribute'
        })
      }
    })

    // Check for links without accessible names
    const links = document.querySelectorAll('a')
    links.forEach((link, index) => {
      const hasAccessibleName = link.textContent?.trim() || 
                               link.getAttribute('aria-label') || 
                               link.getAttribute('aria-labelledby')
      
      if (!hasAccessibleName) {
        foundIssues.push({
          id: `link-name-${index}`,
          type: 'error',
          message: 'Link missing accessible name',
          element: 'a',
          suggestion: 'Add descriptive text content, aria-label, or aria-labelledby attribute'
        })
      }
    })

    // Check for missing focus indicators
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    let missingFocusCount = 0
    focusableElements.forEach((element) => {
      const styles = window.getComputedStyle(element, ':focus')
      if (styles.outline === 'none' && !styles.boxShadow.includes('ring')) {
        missingFocusCount++
      }
    })

    if (missingFocusCount > 0) {
      foundIssues.push({
        id: 'focus-indicators',
        type: 'warning',
        message: `${missingFocusCount} elements may be missing focus indicators`,
        suggestion: 'Ensure all interactive elements have visible focus indicators'
      })
    }

    // Check for color contrast (basic check)
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button')
    let lowContrastCount = 0
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element)
      const color = styles.color
      const backgroundColor = styles.backgroundColor
      
      // Basic check for very low contrast (this is simplified)
      if (color === 'rgb(128, 128, 128)' || color === '#808080') {
        lowContrastCount++
      }
    })

    if (lowContrastCount > 0) {
      foundIssues.push({
        id: 'color-contrast',
        type: 'warning',
        message: `${lowContrastCount} elements may have low color contrast`,
        suggestion: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)'
      })
    }

    // Check for missing page title
    if (!document.title || document.title.trim() === '') {
      foundIssues.push({
        id: 'page-title',
        type: 'error',
        message: 'Page missing title',
        suggestion: 'Add a descriptive page title'
      })
    }

    // Check for missing lang attribute
    if (!document.documentElement.lang) {
      foundIssues.push({
        id: 'lang-attribute',
        type: 'error',
        message: 'HTML element missing lang attribute',
        suggestion: 'Add lang="en" or appropriate language code to html element'
      })
    }

    setIssues(foundIssues)
    setIsScanning(false)
  }

  useEffect(() => {
    if (shouldShow) {
      // Run audit after page load
      const timer = setTimeout(runAccessibilityAudit, 1000)
      return () => clearTimeout(timer)
    }
  }, [shouldShow])

  if (!shouldShow) return null

  const errorCount = issues.filter(issue => issue.type === 'error').length
  const warningCount = issues.filter(issue => issue.type === 'warning').length
  const infoCount = issues.filter(issue => issue.type === 'info').length

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label={`Accessibility audit: ${errorCount} errors, ${warningCount} warnings. ${isVisible ? 'Hide' : 'Show'} details`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">A11y</span>
          {(errorCount > 0 || warningCount > 0) && (
            <div className="flex gap-1">
              {errorCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {errorCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {warningCount}
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Audit Panel */}
      {isVisible && (
        <div className="absolute bottom-16 right-0 w-96 max-h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Accessibility Audit</h3>
              <div className="flex gap-2">
                <button
                  onClick={runAccessibilityAudit}
                  disabled={isScanning}
                  className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
                >
                  {isScanning ? 'Scanning...' : 'Rescan'}
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close audit panel"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-red-400">{errorCount} errors</span>
              <span className="text-yellow-400">{warningCount} warnings</span>
              <span className="text-blue-400">{infoCount} info</span>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {issues.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                {isScanning ? 'Scanning for accessibility issues...' : 'No accessibility issues found! 🎉'}
              </div>
            ) : (
              <div className="p-2">
                {issues.map((issue) => (
                  <div key={issue.id} className="p-3 border-b border-gray-700 last:border-b-0">
                    <div className="flex items-start gap-2">
                      {getIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{issue.message}</p>
                        {issue.element && (
                          <p className="text-gray-400 text-xs mt-1 font-mono">{issue.element}</p>
                        )}
                        <p className="text-gray-300 text-xs mt-1">{issue.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AccessibilityAudit