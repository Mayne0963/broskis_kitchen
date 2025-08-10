"use client"

import Head from 'next/head'
import { usePathname } from 'next/navigation'

interface SEOProps {
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
}

const defaultSEO = {
  siteName: "Broski's Kitchen",
  title: "Broski's Kitchen - Home of Award-Winning Boosie Wings",
  description: "Experience the award-winning Boosie Wings at Broski's Kitchen. Authentic flavors, premium ingredients, and unforgettable taste. Order now for delivery or pickup.",
  keywords: [
    'Boosie Wings',
    'chicken wings',
    'restaurant',
    'food delivery',
    'Chicago food',
    'award winning wings',
    'Broskis Kitchen',
    'authentic flavors',
    'premium ingredients'
  ],
  image: '/images/broskis-gold-logo.png',
  locale: 'en_US',
  type: 'restaurant' as const
}

export default function SEOOptimizer({
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
  canonical
}: SEOProps) {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://broskiskitchen.com'
  
  const seo = {
    title: title ? `${title} | ${siteName}` : defaultSEO.title,
    description: description || defaultSEO.description,
    keywords: [...defaultSEO.keywords, ...keywords].join(', '),
    image: image ? `${baseUrl}${image}` : `${baseUrl}${defaultSEO.image}`,
    url: url || `${baseUrl}${pathname}`,
    canonical: canonical || `${baseUrl}${pathname}`
  }

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ')

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'restaurant' ? 'Restaurant' : 'WebSite',
    name: siteName,
    description: seo.description,
    url: seo.url,
    image: seo.image,
    ...(type === 'restaurant' && {
      '@type': 'Restaurant',
      servesCuisine: 'American',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Chicago',
        addressRegion: 'IL',
        addressCountry: 'US'
      },
      telephone: '+1-XXX-XXX-XXXX', // Replace with actual phone
      openingHours: [
        'Mo-Su 11:00-22:00' // Replace with actual hours
      ],
      hasMenu: `${baseUrl}/menu`,
      acceptsReservations: true
    }),
    ...(author && { author: { '@type': 'Person', name: author } }),
    ...(publishedTime && { datePublished: publishedTime }),
    ...(modifiedTime && { dateModified: modifiedTime })
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={seo.canonical} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      <meta name="twitter:url" content={seo.url} />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#FFD700" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="msapplication-TileImage" content="/images/broskis-gold-logo.png" />
      
      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      
      {/* Preload critical resources */}
      <link rel="preload" href="/images/broskis-gold-logo.png" as="image" type="image/png" />
      <link rel="preload" href="/images/HomePageHeroImage.png" as="image" type="image/png" />
    </Head>
  )
}

/**
 * Hook for dynamic SEO updates
 */
export function useSEO(seoData: SEOProps) {
  return {
    updateSEO: (newData: Partial<SEOProps>) => {
      // This would typically update the document head dynamically
      // For now, it returns the merged data
      return { ...seoData, ...newData }
    }
  }
}

/**
 * Generate sitemap data
 */
export function generateSitemapData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://broskiskitchen.com'
  
  const pages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/menu', priority: 0.9, changefreq: 'weekly' },
    { url: '/locations', priority: 0.8, changefreq: 'monthly' },
    { url: '/events', priority: 0.7, changefreq: 'weekly' },
    { url: '/rewards', priority: 0.6, changefreq: 'monthly' },
    { url: '/shop', priority: 0.6, changefreq: 'weekly' },
    { url: '/contact', priority: 0.5, changefreq: 'monthly' },
    { url: '/catering', priority: 0.7, changefreq: 'monthly' }
  ]
  
  return pages.map(page => ({
    ...page,
    url: `${baseUrl}${page.url}`,
    lastmod: new Date().toISOString()
  }))
}