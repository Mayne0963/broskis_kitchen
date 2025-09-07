"use client"

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: 'meta' | 'content' | 'technical' | 'performance' | 'accessibility'
  message: string
  element?: string
  recommendation?: string
}

interface SEOAuditResults {
  score: number
  issues: SEOIssue[]
  recommendations: string[]
  checkedElements: {
    title: boolean
    description: boolean
    keywords: boolean
    headings: boolean
    images: boolean
    links: boolean
    structured_data: boolean
  }
}

export default function SEOAudit() {
  const [auditResults, setAuditResults] = useState<SEOAuditResults | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [showAudit, setShowAudit] = useState(false)
  const pathname = usePathname()

  const runSEOAudit = () => {
    setIsAuditing(true)
    const issues: SEOIssue[] = []
    const checkedElements = {
      title: false,
      description: false,
      keywords: false,
      headings: false,
      images: false,
      links: false,
      structured_data: false
    }

    // Check title tag
    const title = document.title
    checkedElements.title = true
    if (!title) {
      issues.push({
        type: 'error',
        category: 'meta',
        message: 'Missing title tag',
        recommendation: 'Add a descriptive title tag (50-60 characters)'
      })
    } else if (title.length < 10) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Title too short',
        element: title,
        recommendation: 'Title should be at least 10 characters long'
      })
    } else if (title.length > 60) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Title too long',
        element: title,
        recommendation: 'Title should be under 60 characters for optimal display'
      })
    }

    // Check meta description
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')
    checkedElements.description = true
    if (!metaDescription) {
      issues.push({
        type: 'error',
        category: 'meta',
        message: 'Missing meta description',
        recommendation: 'Add a meta description (120-160 characters)'
      })
    } else if (metaDescription.length < 120) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Meta description too short',
        element: metaDescription,
        recommendation: 'Meta description should be at least 120 characters'
      })
    } else if (metaDescription.length > 160) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Meta description too long',
        element: metaDescription,
        recommendation: 'Meta description should be under 160 characters'
      })
    }

    // Check keywords
    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content')
    checkedElements.keywords = true
    if (!keywords) {
      issues.push({
        type: 'info',
        category: 'meta',
        message: 'No meta keywords found',
        recommendation: 'Consider adding relevant keywords (though less important for modern SEO)'
      })
    }

    // Check heading structure
    const h1Elements = document.querySelectorAll('h1')
    const h2Elements = document.querySelectorAll('h2')
    checkedElements.headings = true
    
    if (h1Elements.length === 0) {
      issues.push({
        type: 'error',
        category: 'content',
        message: 'Missing H1 tag',
        recommendation: 'Add exactly one H1 tag per page'
      })
    } else if (h1Elements.length > 1) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Multiple H1 tags found',
        element: `${h1Elements.length} H1 tags`,
        recommendation: 'Use only one H1 tag per page'
      })
    }

    if (h2Elements.length === 0) {
      issues.push({
        type: 'info',
        category: 'content',
        message: 'No H2 tags found',
        recommendation: 'Consider using H2 tags to structure your content'
      })
    }

    // Check images
    const images = document.querySelectorAll('img')
    const imagesWithoutAlt: Element[] = []
    checkedElements.images = true
    
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        imagesWithoutAlt.push(img)
      }
    })

    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'warning',
        category: 'accessibility',
        message: 'Images without alt text',
        element: `${imagesWithoutAlt.length} images`,
        recommendation: 'Add descriptive alt text to all images'
      })
    }

    // Check internal links
    const links = document.querySelectorAll('a[href]')
    const externalLinks: Element[] = []
    checkedElements.links = true
    
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (href && (href.startsWith('http') && !href.includes(window.location.hostname))) {
        if (!link.getAttribute('rel')?.includes('noopener')) {
          externalLinks.push(link)
        }
      }
    })

    if (externalLinks.length > 0) {
      issues.push({
        type: 'info',
        category: 'technical',
        message: 'External links without rel="noopener"',
        element: `${externalLinks.length} links`,
        recommendation: 'Add rel="noopener noreferrer" to external links for security'
      })
    }

    // Check structured data
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]')
    checkedElements.structured_data = true
    
    if (structuredData.length === 0) {
      issues.push({
        type: 'warning',
        category: 'technical',
        message: 'No structured data found',
        recommendation: 'Add JSON-LD structured data for better search engine understanding'
      })
    }

    // Check Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDescription = document.querySelector('meta[property="og:description"]')
    const ogImage = document.querySelector('meta[property="og:image"]')
    
    if (!ogTitle) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Missing Open Graph title',
        recommendation: 'Add og:title meta tag for social media sharing'
      })
    }
    
    if (!ogDescription) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Missing Open Graph description',
        recommendation: 'Add og:description meta tag for social media sharing'
      })
    }
    
    if (!ogImage) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: 'Missing Open Graph image',
        recommendation: 'Add og:image meta tag for social media sharing'
      })
    }

    // Check canonical URL
    const canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      issues.push({
        type: 'warning',
        category: 'technical',
        message: 'Missing canonical URL',
        recommendation: 'Add canonical link tag to prevent duplicate content issues'
      })
    }

    // Calculate score
    const totalChecks = Object.keys(checkedElements).length + 4 // +4 for OG tags and canonical
    const errorCount = issues.filter(issue => issue.type === 'error').length
    const warningCount = issues.filter(issue => issue.type === 'warning').length
    const score = Math.max(0, 100 - (errorCount * 15) - (warningCount * 5))

    // Generate recommendations
    const recommendations = [
      'Ensure all pages have unique, descriptive titles',
      'Write compelling meta descriptions for all pages',
      'Use proper heading hierarchy (H1, H2, H3, etc.)',
      'Add alt text to all images',
      'Implement structured data markup',
      'Optimize page loading speed',
      'Ensure mobile responsiveness',
      'Create an XML sitemap',
      'Set up Google Search Console',
      'Monitor Core Web Vitals'
    ]

    setAuditResults({
      score,
      issues,
      recommendations,
      checkedElements
    })
    
    setIsAuditing(false)
  }

  useEffect(() => {
    // Auto-run audit when component mounts or pathname changes
    if (typeof window !== 'undefined') {
      setTimeout(runSEOAudit, 1000) // Delay to ensure page is fully loaded
    }
  }, [pathname])

  if (process.env.NODE_ENV !== 'development') {
    return null // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setShowAudit(!showAudit)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
      >
        SEO Audit {auditResults && `(${auditResults.score}/100)`}
      </button>

      {/* Audit Panel */}
      {showAudit && (
        <div className="absolute bottom-12 right-0 w-96 max-h-96 overflow-y-auto bg-white text-black rounded-lg shadow-xl border">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">SEO Audit</h3>
              <button
                onClick={runSEOAudit}
                disabled={isAuditing}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                {isAuditing ? 'Auditing...' : 'Re-audit'}
              </button>
            </div>

            {auditResults && (
              <div>
                {/* Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">SEO Score</span>
                    <span className={`font-bold ${
                      auditResults.score >= 80 ? 'text-green-600' :
                      auditResults.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {auditResults.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        auditResults.score >= 80 ? 'bg-green-600' :
                        auditResults.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${auditResults.score}%` }}
                    ></div>
                  </div>
                </div>

                {/* Issues */}
                {auditResults.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Issues Found</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {auditResults.issues.map((issue, index) => (
                        <div key={index} className={`p-2 rounded text-sm ${
                          issue.type === 'error' ? 'bg-red-100 border-l-4 border-red-500' :
                          issue.type === 'warning' ? 'bg-yellow-100 border-l-4 border-yellow-500' :
                          'bg-blue-100 border-l-4 border-blue-500'
                        }`}>
                          <div className="font-medium">{issue.message}</div>
                          {issue.element && (
                            <div className="text-gray-600 text-xs mt-1">Element: {issue.element}</div>
                          )}
                          {issue.recommendation && (
                            <div className="text-gray-700 text-xs mt-1">{issue.recommendation}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="text-sm text-gray-600">
                  <div>Errors: {auditResults.issues.filter(i => i.type === 'error').length}</div>
                  <div>Warnings: {auditResults.issues.filter(i => i.type === 'warning').length}</div>
                  <div>Info: {auditResults.issues.filter(i => i.type === 'info').length}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}