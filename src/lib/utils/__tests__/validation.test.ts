import { checkPasswordStrength } from '../validation'

describe('checkPasswordStrength', () => {
  it('returns "weak" for simple passwords', () => {
    expect(checkPasswordStrength('password')).toBe('weak')
  })

  it('returns "medium" for moderately complex passwords', () => {
    expect(checkPasswordStrength('Password1')).toBe('medium')
  })

  it('returns "strong" for strong passwords', () => {
    expect(checkPasswordStrength('Password1!')).toBe('strong')
  })

  it('returns "very-strong" for very strong passwords', () => {
    expect(checkPasswordStrength('StrongPassword1!')).toBe('very-strong')
  })
})
