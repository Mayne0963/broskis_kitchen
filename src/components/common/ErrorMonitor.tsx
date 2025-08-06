'use client'

import { useEffect } from 'react'
import { logError } from '@/lib/utils/errorLogger'

// Global error monitoring component
export default function ErrorMonitor() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        logError(new Error(event.reason), {
          type: 'unhandledRejection',
          reason: event.reason
        })
      } catch (error) {
        console.error('Error in handleUnhandledRejection:', error)
      }
    }

    // Handle global JavaScript errors
    const handleError = (event: ErrorEvent) => {
      try {
        logError(new Error(event.message), {
          type: 'globalError',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      } catch (error) {
        console.error('Error in handleError:', error)
      }
    }

    // Handle resource loading errors
    const handleResourceError = (event: Event) => {
      try {
        const target = event.target as HTMLElement
        if (target) {
          logError(new Error(`Resource failed to load: ${target.tagName}`), {
            type: 'resourceError',
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
            outerHTML: target.outerHTML
          })
        }
      } catch (error) {
        console.error('Error in handleResourceError:', error)
      }
    }

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)
    window.addEventListener('error', handleResourceError, true) // Capture phase for resource errors

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
      window.removeEventListener('error', handleResourceError, true)
    }
  }, [])

  // Monitor Next.js specific errors
  useEffect(() => {
    // Check for Next.js hydration errors
    const checkForHydrationErrors = () => {
      const hydrationErrors = document.querySelectorAll('[data-nextjs-hydration-error]')
      if (hydrationErrors.length > 0) {
        hydrationErrors.forEach((element, index) => {
          logError(new Error('Next.js hydration error detected'), {
            type: 'hydrationError',
            element: element.outerHTML,
            index
          })
        })
      }
    }

    // Check for hydration errors after a short delay
    const timeoutId = setTimeout(checkForHydrationErrors, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  // Monitor for 404 image errors specifically
  useEffect(() => {
    const images = document.querySelectorAll('img')
    
    const handleImageError = (event: Event) => {
      const img = event.target as HTMLImageElement
      logError(new Error(`Image failed to load: ${img.src}`), {
        type: 'imageError',
        src: img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      })
    }

    images.forEach(img => {
      img.addEventListener('error', handleImageError)
    })

    // Observer for dynamically added images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            const newImages = element.querySelectorAll('img')
            newImages.forEach(img => {
              img.addEventListener('error', handleImageError)
            })
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      images.forEach(img => {
        img.removeEventListener('error', handleImageError)
      })
      observer.disconnect()
    }
  }, [])

  return null // This component doesn't render anything
}