// Form validation utilities

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  email?: boolean
  phone?: boolean
  url?: boolean
  number?: boolean
  min?: number
  max?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateField(value: any, rules: ValidationRule): ValidationResult {
  const errors: string[] = []
  
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push('This field is required')
    return { isValid: false, errors }
  }
  
  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: true, errors: [] }
  }
  
  const stringValue = String(value).trim()
  
  // Length validations
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(`Must be at least ${rules.minLength} characters long`)
  }
  
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(`Must be no more than ${rules.maxLength} characters long`)
  }
  
  // Email validation
  if (rules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(stringValue)) {
      errors.push('Please enter a valid email address')
    }
  }
  
  // Phone validation
  if (rules.phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleanPhone = stringValue.replace(/[\s\-\(\)]/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Please enter a valid phone number')
    }
  }
  
  // URL validation
  if (rules.url) {
    try {
      new URL(stringValue)
    } catch {
      errors.push('Please enter a valid URL')
    }
  }
  
  // Number validation
  if (rules.number) {
    const numValue = Number(value)
    if (isNaN(numValue)) {
      errors.push('Please enter a valid number')
    } else {
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push(`Must be at least ${rules.min}`)
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push(`Must be no more than ${rules.max}`)
      }
    }
  }
  
  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push('Please enter a valid format')
  }
  
  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value)
    if (customError) {
      errors.push(customError)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): {
  isValid: boolean
  errors: Record<string, string[]>
  firstError?: string
} {
  const errors: Record<string, string[]> = {}
  let firstError: string | undefined
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const result = validateField(data[field], fieldRules)
    if (!result.isValid) {
      errors[field] = result.errors
      if (!firstError) {
        firstError = result.errors[0]
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError
  }
}

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    email: true,
    maxLength: 254
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (!/(?=.*[a-z])/.test(value)) return 'Must contain at least one lowercase letter'
      if (!/(?=.*[A-Z])/.test(value)) return 'Must contain at least one uppercase letter'
      if (!/(?=.*\d)/.test(value)) return 'Must contain at least one number'
      if (!/(?=.*[!@#$%^&*])/.test(value)) return 'Must contain at least one special character'
      return null
    }
  },
  confirmPassword: (password: string) => ({
    required: true,
    custom: (value: string) => {
      if (value !== password) return 'Passwords do not match'
      return null
    }
  }),
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  phone: {
    required: true,
    phone: true
  },
  address: {
    required: true,
    minLength: 10,
    maxLength: 200
  },
  zipCode: {
    required: true,
    pattern: /^\d{5}(-\d{4})?$/
  },
  creditCard: {
    required: true,
    pattern: /^\d{13,19}$/,
    custom: (value: string) => {
      // Luhn algorithm for credit card validation
      const digits = value.replace(/\D/g, '')
      let sum = 0
      let isEven = false
      
      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i])
        
        if (isEven) {
          digit *= 2
          if (digit > 9) {
            digit -= 9
          }
        }
        
        sum += digit
        isEven = !isEven
      }
      
      return sum % 10 === 0 ? null : 'Please enter a valid credit card number'
    }
  },
  cvv: {
    required: true,
    pattern: /^\d{3,4}$/
  },
  expiryDate: {
    required: true,
    pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
    custom: (value: string) => {
      const [month, year] = value.split('/').map(Number)
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear() % 100
      const currentMonth = currentDate.getMonth() + 1
      
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return 'Card has expired'
      }
      
      return null
    }
  }
}

// Sanitization utilities
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[char] || char
    })
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

// Format utilities
export function formatCreditCard(value: string): string {
  const digits = value.replace(/\D/g, '')
  const groups = digits.match(/.{1,4}/g) || []
  return groups.join(' ').substr(0, 19) // Max 16 digits + 3 spaces
}

export function formatExpiryDate(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 2) {
    return `${digits.substr(0, 2)}/${digits.substr(2, 2)}`
  }
  return digits
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.substr(0, 3)}) ${digits.substr(3, 3)}-${digits.substr(6, 4)}`
  }
  return value
}

// Real-time validation hook
import { useState, useCallback } from 'react'

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: Record<keyof T, ValidationRule>
) {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<Record<keyof T, string[]>>({})
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({})
  
  const validateField = useCallback((field: keyof T, value: any) => {
    const result = validateField(value, validationRules[field])
    setErrors(prev => ({
      ...prev,
      [field]: result.errors
    }))
    return result.isValid
  }, [validationRules])
  
  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    if (touched[field]) {
      validateField(field, value)
    }
  }, [touched, validateField])
  
  const touchField = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field, data[field])
  }, [data, validateField])
  
  const validateAll = useCallback(() => {
    const result = validateForm(data, validationRules)
    setErrors(result.errors as Record<keyof T, string[]>)
    setTouched(Object.keys(validationRules).reduce((acc, key) => {
      acc[key as keyof T] = true
      return acc
    }, {} as Record<keyof T, boolean>))
    return result
  }, [data, validationRules])
  
  const reset = useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouched({})
  }, [initialData])
  
  const isValid = Object.keys(errors).length === 0
  const hasErrors = Object.values(errors).some(fieldErrors => fieldErrors.length > 0)
  
  return {
    data,
    errors,
    touched,
    isValid,
    hasErrors,
    updateField,
    touchField,
    validateAll,
    reset
  }
}