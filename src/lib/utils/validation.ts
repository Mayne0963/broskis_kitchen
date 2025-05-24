// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation
export const validatePassword = (password: string): boolean => {
  return password.length >= 8
}

// Name validation
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2
}

// Password strength checker
export const checkPasswordStrength = (password: string): "weak" | "medium" | "strong" | "very-strong" => {
  if (!password) return "weak"

  let score = 0

  // Length check
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1 // Has uppercase
  if (/[a-z]/.test(password)) score += 1 // Has lowercase
  if (/[0-9]/.test(password)) score += 1 // Has number
  if (/[^A-Za-z0-9]/.test(password)) score += 1 // Has special char

  // Determine strength based on score
  if (score <= 2) return "weak"
  if (score <= 4) return "medium"
  if (score <= 5) return "strong"
  return "very-strong"
}
