/**
 * User ID validation utilities
 * Provides functions to validate Firebase user IDs and prevent uninitialized variable access
 */

/**
 * Validates if a value is a valid user ID string
 * @param userId - The value to validate
 * @returns true if the userId is a valid non-empty string, false otherwise
 */
export function validateUserId(userId: any): userId is string {
  return typeof userId === 'string' && userId.trim().length > 0
}

/**
 * Alias for validateUserId for better readability in some contexts
 * @param userId - The value to validate
 * @returns true if the userId is a valid non-empty string, false otherwise
 */
export function isValidUserId(userId: any): userId is string {
  return validateUserId(userId)
}

/**
 * Validates user object and extracts user ID
 * @param user - The user object to validate
 * @returns The user ID if valid, null otherwise
 */
export function getValidUserId(user: any): string | null {
  if (!user) return null
  if (validateUserId(user.id)) return user.id
  if (validateUserId(user.uid)) return user.uid
  return null
}

/**
 * Asserts that a user ID is valid, throws error if not
 * @param userId - The user ID to validate
 * @param context - Optional context for error message
 * @throws Error if userId is invalid
 */
export function assertValidUserId(userId: any, context?: string): asserts userId is string {
  if (!validateUserId(userId)) {
    const message = context ? `Invalid userId in ${context}` : 'Invalid userId'
    throw new Error(message)
  }
}

/**
 * Safely gets user ID with fallback value
 * @param user - The user object
 * @param fallback - Fallback value if user ID is invalid
 * @returns The user ID if valid, fallback otherwise
 */
export function safeGetUserId(user: any, fallback: string = ''): string {
  const userId = getValidUserId(user)
  return userId || fallback
}