'use client'

import { usePathname } from 'next/navigation'

interface StructuredDataProps {
  type?: 'website' | 'restaurant' | 'product' | 'article'
  data?: Record<string, any>
}

export default function StructuredData({ type = 'website', data = {} }: StructuredDataProps) {
  const pathname = usePathname()
  
  const getStructuredData = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://broskiskitchen.com'
    
    switch (type) {
      case 'restaurant':
        return {
          '@context': 'https://schema.org',
          '@type': 'Restaurant',
          name: "Broski's Kitchen",
          description: "Luxury street gourmet restaurant offering delivery, catering, and exclusive dining experiences.",
          url: baseUrl,
          logo: `${baseUrl}/images/logo.svg`,
          image: `${baseUrl}/images/og-image.jpg`,
          telephone: '+1-555-BROSKI',
          email: 'info@broskiskitchen.com',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '123 Gourmet Street',
            addressLocality: 'Los Angeles',
            addressRegion: 'CA',
            postalCode: '90210',
            addressCountry: 'US'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: '34.0522',
            longitude: '-118.2437'
          },
          openingHours: [
            'Mo-Su 11:00-22:00'
          ],
          servesCuisine: ['Street Food', 'Gourmet', 'American', 'Fusion'],
          priceRange: '$$',
          acceptsReservations: true,
          hasMenu: `${baseUrl}/menu`,
          paymentAccepted: ['Cash', 'Credit Card', 'Apple Pay', 'CashApp'],
          currenciesAccepted: 'USD',
          sameAs: [
            'https://www.facebook.com/broskiskitchen',
            'https://www.instagram.com/broskiskitchen',
            'https://twitter.com/broskiskitchen'
          ],
          ...data
        }
        
      case 'product':
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name || 'Gourmet Food Item',
          description: data.description || 'Premium gourmet food from Broski\'s Kitchen',
          image: data.image || `${baseUrl}/images/default-product.jpg`,
          brand: {
            '@type': 'Brand',
            name: "Broski's Kitchen"
          },
          offers: {
            '@type': 'Offer',
            price: data.price || '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: "Broski's Kitchen"
            }
          },
          ...data
        }
        
      case 'article':
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: data.title || 'Broski\'s Kitchen News',
          description: data.description || 'Latest news and updates from Broski\'s Kitchen',
          image: data.image || `${baseUrl}/images/og-image.jpg`,
          author: {
            '@type': 'Organization',
            name: "Broski's Kitchen"
          },
          publisher: {
            '@type': 'Organization',
            name: "Broski's Kitchen",
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/images/logo.svg`
            }
          },
          datePublished: data.datePublished || new Date().toISOString(),
          dateModified: data.dateModified || new Date().toISOString(),
          ...data
        }
        
      default: // website
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: "Broski's Kitchen",
          description: "Experience luxury street gourmet with Broski's Kitchen - where flavor meets culture.",
          url: baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/search?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          },
          sameAs: [
            'https://www.facebook.com/broskiskitchen',
            'https://www.instagram.com/broskiskitchen',
            'https://twitter.com/broskiskitchen'
          ],
          ...data
        }
    }
  }
  
  const structuredData = getStructuredData()
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}

// Organization structured data for the company
export function OrganizationStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://broskiskitchen.com'
  
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "Broski's Kitchen",
    description: "Luxury street gourmet restaurant chain",
    url: baseUrl,
    logo: `${baseUrl}/images/logo.svg`,
    image: `${baseUrl}/images/og-image.jpg`,
    telephone: '+1-555-BROSKI',
    email: 'info@broskiskitchen.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Gourmet Street',
      addressLocality: 'Los Angeles',
      addressRegion: 'CA',
      postalCode: '90210',
      addressCountry: 'US'
    },
    sameAs: [
      'https://www.facebook.com/broskiskitchen',
      'https://www.instagram.com/broskiskitchen',
      'https://twitter.com/broskiskitchen'
    ],
    foundingDate: '2020',
    founders: [
      {
        '@type': 'Person',
        name: 'Broski'
      }
    ],
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: 50,
      maxValue: 100
    }
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationData, null, 2)
      }}
    />
  )
}