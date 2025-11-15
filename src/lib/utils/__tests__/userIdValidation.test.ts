import { validateUserId, isValidUserId } from '../userIdValidation'

describe('UserId Validation', () => {
  describe('validateUserId', () => {
    it('should return true for valid userId strings', () => {
      expect(validateUserId('abc123')).toBe(true)
      expect(validateUserId('user_123')).toBe(true)
      expect(validateUserId('firebase-user-id')).toBe(true)
      expect(validateUserId('1234567890')).toBe(true)
    })

    it('should return false for invalid userId values', () => {
      expect(validateUserId('')).toBe(false)
      expect(validateUserId(null)).toBe(false)
      expect(validateUserId(undefined)).toBe(false)
      expect(validateUserId('   ')).toBe(false) // whitespace only
    })

    it('should return false for non-string values', () => {
      expect(validateUserId(123)).toBe(false)
      expect(validateUserId({})).toBe(false)
      expect(validateUserId([])).toBe(false)
      expect(validateUserId(true)).toBe(false)
    })
  })

  describe('isValidUserId', () => {
    it('should return true for valid userId strings', () => {
      expect(isValidUserId('abc123')).toBe(true)
      expect(isValidUserId('user_123')).toBe(true)
      expect(isValidUserId('firebase-user-id')).toBe(true)
    })

    it('should return false for invalid userId values', () => {
      expect(isValidUserId('')).toBe(false)
      expect(isValidUserId(null)).toBe(false)
      expect(isValidUserId(undefined)).toBe(false)
      expect(isValidUserId('   ')).toBe(false)
    })

    it('should handle edge cases correctly', () => {
      expect(isValidUserId('a')).toBe(true) // single character
      expect(isValidUserId('very-long-user-id-with-many-characters-123456789')).toBe(true)
      expect(isValidUserId('user@email.com')).toBe(true) // email format is valid as userId
    })
  })
})