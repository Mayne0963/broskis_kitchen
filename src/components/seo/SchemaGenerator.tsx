"use client"

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface RestaurantSchema {
  "@context": string
  "@type": string
  name: string
  description: string
  url: string
  telephone: string
  address: {
    "@type": string
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  geo: {
    "@type": string
    latitude: number
    longitude: number
  }
  openingHours: string[]
  servesCuisine: string[]
  priceRange: string
  acceptsReservations: boolean
  hasMenu: string
  image: string[]
  sameAs: string[]
}

interface MenuSchema {
  "@context": string
  "@type": string
  name: string
  description: string
  hasMenuSection: {
    "@type": string
    name: string
    hasMenuItem: {
      "@type": string
      name: string
      description: string
      offers: {
        "@type": string
        price: string
        priceCurrency: string
      }
    }[]
  }[]
}

interface WebSiteSchema {
  "@context": string
  "@type": string
  name: string
  url: string
  description: string
  potentialAction: {
    "@type": string
    target: {
      "@type": string
      urlTemplate: string
    }
    "query-input": string
  }
}

interface BreadcrumbSchema {
  "@context": string
  "@type": string
  itemListElement: {
    "@type": string
    position: number
    name: string
    item: string
  }[]
}

interface LocalBusinessSchema {
  "@context": string
  "@type": string
  name: string
  description: string
  url: string
  telephone: string
  email: string
  address: {
    "@type": string
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  geo: {
    "@type": string
    latitude: number
    longitude: number
  }
  openingHours: string[]
  image: string[]
  sameAs: string[]
}

const baseUrl = process.env.BASE_URL || 'https://broskiskitchen.com'

const generateRestaurantSchema = (): RestaurantSchema => ({
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Broski's Kitchen",
  description: "Authentic Caribbean cuisine with a modern twist. Experience the flavors of the islands with our fresh, locally-sourced ingredients and traditional recipes.",
  url: baseUrl,
  telephone: "+1-555-BROSKI",
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Caribbean Street",
    addressLocality: "Miami",
    addressRegion: "FL",
    postalCode: "33101",
    addressCountry: "US"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 25.7617,
    longitude: -80.1918
  },
  openingHours: [
    "Mo-Th 11:00-22:00",
    "Fr-Sa 11:00-23:00",
    "Su 12:00-21:00"
  ],
  servesCuisine: ["Caribbean", "Jamaican", "Fusion"],
  priceRange: "$$",
  acceptsReservations: true,
  hasMenu: `${baseUrl}/menu`,
  image: [
    `${baseUrl}/images/restaurant-exterior.jpg`,
    `${baseUrl}/images/restaurant-interior.jpg`,
    `${baseUrl}/images/signature-dish.jpg`
  ],
  sameAs: [
    "https://www.facebook.com/broskiskitchen",
    "https://www.instagram.com/broskiskitchen",
    "https://www.twitter.com/broskiskitchen"
  ]
})

const generateMenuSchema = (): MenuSchema => ({
  "@context": "https://schema.org",
  "@type": "Menu",
  name: "Broski's Kitchen Menu",
  description: "Our full menu featuring authentic Caribbean dishes, appetizers, mains, and desserts.",
  hasMenuSection: [
    {
      "@type": "MenuSection",
      name: "Appetizers",
      hasMenuItem: [
        {
          "@type": "MenuItem",
          name: "Jerk Chicken Wings",
          description: "Spicy jerk-seasoned chicken wings with cooling mango dip",
          offers: {
            "@type": "Offer",
            price: "12.99",
            priceCurrency: "USD"
          }
        },
        {
          "@type": "MenuItem",
          name: "Plantain Chips",
          description: "Crispy plantain chips served with spicy aioli",
          offers: {
            "@type": "Offer",
            price: "8.99",
            priceCurrency: "USD"
          }
        }
      ]
    },
    {
      "@type": "MenuSection",
      name: "Main Courses",
      hasMenuItem: [
        {
          "@type": "MenuItem",
          name: "Jerk Chicken",
          description: "Traditional jerk chicken with rice and peas",
          offers: {
            "@type": "Offer",
            price: "18.99",
            priceCurrency: "USD"
          }
        },
        {
          "@type": "MenuItem",
          name: "Curry Goat",
          description: "Tender goat meat in aromatic curry sauce",
          offers: {
            "@type": "Offer",
            price: "22.99",
            priceCurrency: "USD"
          }
        }
      ]
    }
  ]
})

const generateWebSiteSchema = (): WebSiteSchema => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Broski's Kitchen",
  url: baseUrl,
  description: "Authentic Caribbean cuisine with a modern twist. Order online or visit our restaurant for an unforgettable dining experience.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}/menu?search={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
})

const generateBreadcrumbSchema = (pathname: string): BreadcrumbSchema => {
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl
    }
  ]

  let currentPath = baseUrl
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    breadcrumbs.push({
      "@type": "ListItem",
      position: index + 2,
      name,
      item: currentPath
    })
  })

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs
  }
}

const generateLocalBusinessSchema = (): LocalBusinessSchema => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Broski's Kitchen",
  description: "Authentic Caribbean cuisine with a modern twist. Experience the flavors of the islands.",
  url: baseUrl,
  telephone: "+1-555-BROSKI",
  email: "info@broskiskitchen.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Caribbean Street",
    addressLocality: "Miami",
    addressRegion: "FL",
    postalCode: "33101",
    addressCountry: "US"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 25.7617,
    longitude: -80.1918
  },
  openingHours: [
    "Mo-Th 11:00-22:00",
    "Fr-Sa 11:00-23:00",
    "Su 12:00-21:00"
  ],
  image: [
    `${baseUrl}/images/restaurant-exterior.jpg`,
    `${baseUrl}/images/restaurant-interior.jpg`
  ],
  sameAs: [
    "https://www.facebook.com/broskiskitchen",
    "https://www.instagram.com/broskiskitchen",
    "https://www.twitter.com/broskiskitchen"
  ]
})

interface SchemaGeneratorProps {
  type?: 'restaurant' | 'menu' | 'website' | 'breadcrumb' | 'local-business' | 'all'
}

export default function SchemaGenerator({ type = 'all' }: SchemaGeneratorProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Remove existing schema scripts
    const existingSchemas = document.querySelectorAll('script[data-schema]')
    existingSchemas.forEach(script => script.remove())

    const schemas: any[] = []

    // Determine which schemas to include based on page and type
    if (type === 'all' || type === 'website') {
      schemas.push(generateWebSiteSchema())
    }

    if (type === 'all' || type === 'breadcrumb') {
      if (pathname !== '/') {
        schemas.push(generateBreadcrumbSchema(pathname))
      }
    }

    if (type === 'all' || type === 'restaurant') {
      if (pathname === '/' || pathname === '/about') {
        schemas.push(generateRestaurantSchema())
      }
    }

    if (type === 'all' || type === 'menu') {
      if (pathname === '/menu') {
        schemas.push(generateMenuSchema())
      }
    }

    if (type === 'all' || type === 'local-business') {
      if (pathname === '/contact' || pathname === '/locations') {
        schemas.push(generateLocalBusinessSchema())
      }
    }

    // Add schemas to document head
    schemas.forEach((schema, index) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-schema', 'true')
      script.textContent = JSON.stringify(schema, null, 2)
      document.head.appendChild(script)
    })

    return () => {
      // Cleanup on unmount
      const schemaScripts = document.querySelectorAll('script[data-schema]')
      schemaScripts.forEach(script => script.remove())
    }
  }, [pathname, type])

  return null // This component doesn't render anything visible
}

// Export individual schema generators for use in other components
export {
  generateRestaurantSchema,
  generateMenuSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateLocalBusinessSchema
}