'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useCallback } from 'react'

interface EnhancedSEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product' | 'restaurant'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  locale?: string
  siteName?: string
  noindex?: boolean
  nofollow?: boolean
  canonical?: string
  breadcrumbs?: Array<{ name: string; url: string }>
  businessInfo?: {
    name: string
    address: string
    phone: string
    email: string
    hours: string[]
    priceRange: string
    cuisine: string
  }
}

const defaultSEO = {
  siteName: "Broski's Kitchen",
  title: "Broski's Kitchen - Luxury Street Gourmet",
  description: "Experience luxury street gourmet with Broski's Kitchen - where flavor meets culture. Order online for delivery, catering, and exclusive dining experiences.",
  keywords: [
    'luxury street food',
    'gourmet food',
    'food delivery',
    'catering',
    'restaurant',
    'street gourmet',
    'Boosie Wings',
    'online ordering',
    'premium ingredients'
  ],
  image: '/images/og-image.jpg',
  locale: 'en_US',
  type: 'restaurant' as const
}

export default function EnhancedSEO({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  locale = defaultSEO.locale,
  siteName = defaultSEO.siteName,
  noindex = false,
  nofollow = false,
  canonical,
  breadcrumbs,
  businessInfo
}: EnhancedSEOProps) {
  const pathname = usePathname()
  const baseUrl = process.env.SITE_URL || 'https://broskiskitchen.com'
  
  const seo = useMemo(() => ({
    title: title ? `${title} | ${siteName}` : defaultSEO.title,
    description: description || defaultSEO.description,
    keywords: [...defaultSEO.keywords, ...keywords].join(', '),
    image: image ? `${baseUrl}${image}` : `${baseUrl}${defaultSEO.image}`,
    url: url || `${baseUrl}${pathname}`,
    canonical: canonical || `${baseUrl}${pathname}`
  }), [title, siteName, description, keywords, image, baseUrl, pathname, url, canonical])

  // Generate structured data
  const generateStructuredData = useCallback(() => {
    const baseStructuredData = {
      '@context': 'https://schema.org',
      '@type': type === 'restaurant' ? 'Restaurant' : 'WebSite',
      name: siteName,
      description: seo.description,
      url: seo.url,
      image: seo.image,
      ...(author && { author: { '@type': 'Person', name: author } }),
      ...(publishedTime && { datePublished: publishedTime }),
      ...(modifiedTime && { dateModified: modifiedTime })
    }

    // Add restaurant-specific data
    if (type === 'restaurant' && businessInfo) {
      return {
        ...baseStructuredData,
        '@type': 'Restaurant',
        servesCuisine: businessInfo.cuisine,
        priceRange: businessInfo.priceRange,
        address: {
          '@type': 'PostalAddress',
          streetAddress: businessInfo.address,
          addressLocality: 'Los Angeles',
          addressRegion: 'CA',
          addressCountry: 'US'
        },
        telephone: businessInfo.phone,
        email: businessInfo.email,
        openingHours: businessInfo.hours,
        hasMenu: `${baseUrl}/menu`,
        acceptsReservations: false,
        paymentAccepted: 'Cash, Credit Card, Debit Card',
        currenciesAccepted: 'USD'
      }
    }

    // Add breadcrumb data
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbList = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: `${baseUrl}${crumb.url}`
        }))
      }
      
      return [baseStructuredData, breadcrumbList]
    }

    return baseStructuredData
  }, [type, siteName, seo, author, publishedTime, modifiedTime, businessInfo, breadcrumbs, baseUrl])

  // Update document head dynamically
  useEffect(() => {
    // Update title
    document.title = seo.title
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', seo.description)
    }
    
    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', seo.canonical)
    
    // Update Open Graph tags
    const updateMetaTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`)
      if (!metaTag) {
        metaTag = document.createElement('meta')
        metaTag.setAttribute('property', property)
        document.head.appendChild(metaTag)
      }
      metaTag.setAttribute('content', content)
    }
    
    updateMetaTag('og:title', seo.title)
    updateMetaTag('og:description', seo.description)
    updateMetaTag('og:image', seo.image)
    updateMetaTag('og:url', seo.url)
    updateMetaTag('og:type', type)
    
    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`)
      if (!metaTag) {
        metaTag = document.createElement('meta')
        metaTag.setAttribute('name', name)
        document.head.appendChild(metaTag)
      }
      metaTag.setAttribute('content', content)
    }
    
    updateTwitterTag('twitter:title', seo.title)
    updateTwitterTag('twitter:description', seo.description)
    updateTwitterTag('twitter:image', seo.image)
    
    // Update structured data
    const structuredData = generateStructuredData()
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]')
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script')
      structuredDataScript.setAttribute('type', 'application/ld+json')
      document.head.appendChild(structuredDataScript)
    }
    structuredDataScript.textContent = JSON.stringify(structuredData)
    
  }, [seo, type, breadcrumbs, businessInfo, generateStructuredData])

  return null // This component doesn't render anything
}

// Hook for easy SEO management
export function useSEO() {
  const pathname = usePathname()
  
  const updateSEO = (seoData: Partial<EnhancedSEOProps>) => {
    // This would trigger a re-render of the EnhancedSEO component
    // In a real implementation, you might use a context or state management
    return seoData
  }
  
  const generatePageSEO = (pageType: string) => {
    const seoConfigs = {
      home: {
        title: "Home",
        description: "Experience luxury street gourmet with Broski's Kitchen - where flavor meets culture.",
        keywords: ['home', 'luxury street food', 'gourmet', 'restaurant']
      },
      menu: {
        title: "Menu",
        description: "Explore our award-winning Boosie Wings and luxury street gourmet menu.",
        keywords: ['menu', 'Boosie Wings', 'food', 'dishes']
      },
      contact: {
        title: "Contact",
        description: "Get in touch with Broski's Kitchen for catering, events, and inquiries.",
        keywords: ['contact', 'catering', 'events', 'phone']
      },
      about: {
        title: "About",
        description: "Learn about Broski's Kitchen story and mission.",
        keywords: ['about', 'story', 'mission', 'history']
      }
    }
    
    return seoConfigs[pageType as keyof typeof seoConfigs] || seoConfigs.home
  }
  
  return {
    updateSEO,
    generatePageSEO,
    currentPath: pathname
  }
}

// SEO validation utility
export function validateSEO(seoData: EnhancedSEOProps) {
  const issues: string[] = []
  
  if (!seoData.title || seoData.title.length < 10 || seoData.title.length > 60) {
    issues.push('Title should be between 10-60 characters')
  }
  
  if (!seoData.description || seoData.description.length < 120 || seoData.description.length > 160) {
    issues.push('Description should be between 120-160 characters')
  }
  
  if (!seoData.keywords || seoData.keywords.length < 3) {
    issues.push('Should have at least 3 keywords')
  }
  
  if (!seoData.image) {
    issues.push('Should have an Open Graph image')
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}