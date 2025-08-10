import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://broskiskitchen.com'
  
  // Static pages
  const staticPages = [
    '',
    '/menu',
    '/about',
    '/contact',
    '/locations',
    '/catering',
    '/rewards',
    '/loyalty',
    '/shop',
    '/events',
    '/volunteer',
    '/careers',
    '/privacy',
    '/terms',
    '/accessibility',
    '/auth/login',
    '/auth/register',
    '/track-order',
  ]
  
  const currentDate = new Date()
  
  return staticPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: currentDate,
    changeFrequency: getChangeFrequency(page),
    priority: getPriority(page),
  }))
}

function getChangeFrequency(page: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  // High-frequency pages
  if (page === '' || page === '/menu' || page === '/events') {
    return 'daily'
  }
  
  // Medium-frequency pages
  if (page === '/rewards' || page === '/loyalty' || page === '/shop' || page === '/locations') {
    return 'weekly'
  }
  
  // Low-frequency pages
  if (page === '/privacy' || page === '/terms' || page === '/accessibility') {
    return 'monthly'
  }
  
  // Default
  return 'weekly'
}

function getPriority(page: string): number {
  // Homepage gets highest priority
  if (page === '') {
    return 1.0
  }
  
  // Important business pages
  if (page === '/menu' || page === '/catering' || page === '/locations') {
    return 0.9
  }
  
  // Secondary business pages
  if (page === '/about' || page === '/contact' || page === '/rewards' || page === '/events') {
    return 0.8
  }
  
  // Utility pages
  if (page === '/shop' || page === '/loyalty' || page === '/volunteer' || page === '/careers') {
    return 0.7
  }
  
  // Auth and tracking pages
  if (page.startsWith('/auth') || page === '/track-order') {
    return 0.6
  }
  
  // Legal pages
  if (page === '/privacy' || page === '/terms' || page === '/accessibility') {
    return 0.5
  }
  
  // Default
  return 0.6
}