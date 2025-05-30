// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password validation - Firebase recommends at least 6 characters, but we enforce 8 for better security
export const validatePassword = (password: string): boolean => {
  return password.length >= 8
}

// Enhanced password validation with specific requirements
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
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
