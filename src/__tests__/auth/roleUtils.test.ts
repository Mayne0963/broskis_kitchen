import { describe, it, expect } from 'vitest'
import { isUserAdmin } from '@/lib/auth/roleUtils'

describe('isUserAdmin', () => {
  it('returns false for null user', () => {
    expect(isUserAdmin(null)).toBe(false)
  })

  it('returns true when role is admin', () => {
    expect(isUserAdmin({ role: 'admin' })).toBe(true)
  })

  it('returns true when admin claim is true', () => {
    expect(isUserAdmin({ role: 'user', admin: true })).toBe(true)
  })

  it('returns false otherwise', () => {
    expect(isUserAdmin({ role: 'user', admin: false })).toBe(false)
  })
})
