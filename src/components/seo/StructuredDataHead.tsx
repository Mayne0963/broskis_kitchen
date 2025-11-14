import type React from "react"

type StructuredDataType = 'website'

export function StructuredDataHead({ type = 'website' as StructuredDataType, data = {} }: { type?: StructuredDataType; data?: Record<string, any> }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://broskiskitchen.com'
  const structured = type === 'website'
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: "Broski's Kitchen",
        description: "Experience luxury street gourmet with Broski's Kitchen - where flavor meets culture.",
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string'
        },
        sameAs: [
          'https://www.facebook.com/broskiskitchen',
          'https://www.instagram.com/broskiskitchen',
          'https://twitter.com/broskiskitchen'
        ],
        ...data
      }
    : data

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }}
    />
  )
}

export function OrganizationStructuredDataHead() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://broskiskitchen.com'
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "Broski's Kitchen",
    description: 'Luxury street gourmet restaurant chain',
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
    founders: [{ '@type': 'Person', name: 'Broski' }],
    numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 50, maxValue: 100 }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
    />
  )
}

export default StructuredDataHead