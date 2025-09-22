import { menuItems } from '../data/menu-data'

/**
 * Filters menu items to include test items only when appropriate
 * Test items are shown when:
 * - NODE_ENV === 'development' OR
 * - ?test=1 query parameter is present
 */
export function getVisibleMenuItems(searchParams?: URLSearchParams): typeof menuItems {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const hasTestParam = searchParams?.get('test') === '1'
  const showTestItems = isDevelopment || hasTestParam

  if (showTestItems) {
    // Show all items including test items
    return menuItems
  } else {
    // Filter out test items in production
    return menuItems.filter(item => !item.isTestItem)
  }
}

/**
 * Checks if test items should be visible based on environment and query params
 */
export function shouldShowTestItems(searchParams?: URLSearchParams): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const hasTestParam = searchParams?.get('test') === '1'
  return isDevelopment || hasTestParam
}

/**
 * Gets only test items for testing purposes
 */
export function getTestItems(): typeof menuItems {
  return menuItems.filter(item => item.isTestItem)
}