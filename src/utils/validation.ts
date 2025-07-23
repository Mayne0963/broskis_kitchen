// Validation utilities for Broski's Kitchen
import { config } from './config';

// Regular expressions for validation
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
export const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
export const SLUG_REGEX = /^[a-z0-9-]+$/;
export const ZIP_CODE_REGEX = /^[0-9]{5}(-[0-9]{4})?$/;
export const CREDIT_CARD_REGEX = /^[0-9]{13,19}$/;
export const CVV_REGEX = /^[0-9]{3,4}$/;

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Generic validation function
export function validate(value: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.validator(value)) {
      errors.push(rule.message);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Validation rule interface
export interface ValidationRule {
  validator: (value: any) => boolean;
  message: string;
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validator: (value: any) => value !== null && value !== undefined && value !== '',
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value: string) => value && value.length >= min,
    message: message || `Must be at least ${min} characters long`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value: string) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters long`
  }),
  
  email: (message = 'Must be a valid email address'): ValidationRule => ({
    validator: (value: string) => !value || EMAIL_REGEX.test(value),
    message
  }),
  
  phone: (message = 'Must be a valid phone number'): ValidationRule => ({
    validator: (value: string) => !value || PHONE_REGEX.test(value),
    message
  }),
  
  min: (min: number, message?: string): ValidationRule => ({
    validator: (value: number) => value >= min,
    message: message || `Must be at least ${min}`
  }),
  
  max: (max: number, message?: string): ValidationRule => ({
    validator: (value: number) => value <= max,
    message: message || `Must be no more than ${max}`
  }),
  
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validator: (value: string) => !value || regex.test(value),
    message
  }),
  
  oneOf: (options: any[], message?: string): ValidationRule => ({
    validator: (value: any) => options.includes(value),
    message: message || `Must be one of: ${options.join(', ')}`
  })
};

// User validation
export function validateUser(userData: any): ValidationResult {
  const rules: ValidationRule[] = [
    validationRules.required('Name is required'),
    validationRules.maxLength(config.validation.maxNameLength, `Name must be no more than ${config.validation.maxNameLength} characters`),
    validationRules.email('Valid email is required')
  ];
  
  const nameValidation = validate(userData.name, [
    validationRules.required('Name is required'),
    validationRules.maxLength(config.validation.maxNameLength)
  ]);
  
  const emailValidation = validate(userData.email, [
    validationRules.required('Email is required'),
    validationRules.email()
  ]);
  
  const errors = [...nameValidation.errors, ...emailValidation.errors];
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Address validation
export function validateAddress(addressData: any): ValidationResult {
  const streetValidation = validate(addressData.street, [
    validationRules.required('Street address is required'),
    validationRules.maxLength(config.validation.maxAddressLength)
  ]);
  
  const cityValidation = validate(addressData.city, [
    validationRules.required('City is required'),
    validationRules.maxLength(100)
  ]);
  
  const stateValidation = validate(addressData.state, [
    validationRules.required('State is required'),
    validationRules.minLength(2, 'State must be 2 characters'),
    validationRules.maxLength(2, 'State must be 2 characters')
  ]);
  
  const zipValidation = validate(addressData.zipCode, [
    validationRules.required('ZIP code is required'),
    validationRules.pattern(ZIP_CODE_REGEX, 'Invalid ZIP code format')
  ]);
  
  const errors = [
    ...streetValidation.errors,
    ...cityValidation.errors,
    ...stateValidation.errors,
    ...zipValidation.errors
  ];
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Payment method validation
export function validatePaymentMethod(paymentData: any): ValidationResult {
  const typeValidation = validate(paymentData.type, [
    validationRules.required('Payment type is required'),
    validationRules.oneOf(['card', 'bank'], 'Payment type must be card or bank')
  ]);
  
  const last4Validation = validate(paymentData.last4, [
    validationRules.required('Last 4 digits are required'),
    validationRules.pattern(/^[0-9]{4}$/, 'Last 4 digits must be exactly 4 numbers')
  ]);
  
  const errors = [...typeValidation.errors, ...last4Validation.errors];
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Order validation
export function validateOrder(orderData: any): ValidationResult {
  const userIdValidation = validate(orderData.userId, [
    validationRules.required('User ID is required')
  ]);
  
  const itemsValidation = validate(orderData.items, [
    validationRules.required('Order items are required')
  ]);
  
  const totalValidation = validate(orderData.total, [
    validationRules.required('Order total is required'),
    validationRules.min(config.business.minOrderTotal, `Minimum order total is $${config.business.minOrderTotal}`),
    validationRules.max(config.business.maxOrderTotal, `Maximum order total is $${config.business.maxOrderTotal}`)
  ]);
  
  const statusValidation = validate(orderData.status, [
    validationRules.required('Order status is required'),
    validationRules.oneOf(
      ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      'Invalid order status'
    )
  ]);
  
  const errors = [
    ...userIdValidation.errors,
    ...itemsValidation.errors,
    ...totalValidation.errors,
    ...statusValidation.errors
  ];
  
  // Additional validation for items array
  if (orderData.items && Array.isArray(orderData.items)) {
    if (orderData.items.length === 0) {
      errors.push('Order must contain at least one item');
    }
    if (orderData.items.length > 50) {
      errors.push('Order cannot contain more than 50 items');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Product validation
export function validateProduct(productData: any): ValidationResult {
  const nameValidation = validate(productData.name, [
    validationRules.required('Product name is required'),
    validationRules.maxLength(200, 'Product name must be no more than 200 characters')
  ]);
  
  const priceValidation = validate(productData.price, [
    validationRules.required('Product price is required'),
    validationRules.min(0.01, 'Price must be greater than 0'),
    validationRules.max(1000, 'Price cannot exceed $1000')
  ]);
  
  const categoryValidation = validate(productData.category, [
    validationRules.required('Product category is required')
  ]);
  
  const errors = [
    ...nameValidation.errors,
    ...priceValidation.errors,
    ...categoryValidation.errors
  ];
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Booking validation
export function validateBooking(bookingData: any): ValidationResult {
  const eventIdValidation = validate(bookingData.eventId, [
    validationRules.required('Event ID is required')
  ]);
  
  const userIdValidation = validate(bookingData.userId, [
    validationRules.required('User ID is required')
  ]);
  
  const partySizeValidation = validate(bookingData.partySize, [
    validationRules.required('Party size is required'),
    validationRules.min(1, 'Party size must be at least 1'),
    validationRules.max(config.business.maxPartySize, `Party size cannot exceed ${config.business.maxPartySize}`)
  ]);
  
  const timeValidation = validate(bookingData.time, [
    validationRules.required('Time is required'),
    validationRules.pattern(TIME_REGEX, 'Time must be in HH:MM format')
  ]);
  
  const errors = [
    ...eventIdValidation.errors,
    ...userIdValidation.errors,
    ...partySizeValidation.errors,
    ...timeValidation.errors
  ];
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Event validation
export function validateEvent(eventData: any): ValidationResult {
  const nameValidation = validate(eventData.name, [
    validationRules.required('Event name is required'),
    validationRules.maxLength(200, 'Event name must be no more than 200 characters')
  ]);
  
  const maxAttendeesValidation = validate(eventData.maxAttendees, [
    validationRules.required('Maximum attendees is required'),
    validationRules.min(1, 'Maximum attendees must be at least 1'),
    validationRules.max(500, 'Maximum attendees cannot exceed 500')
  ]);
  
  const errors = [
    ...nameValidation.errors,
    ...maxAttendeesValidation.errors
  ];
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Loyalty validation
export function validateLoyalty(loyaltyData: any): ValidationResult {
  const pointsValidation = validate(loyaltyData.points, [
    validationRules.required('Points are required'),
    validationRules.min(0, 'Points cannot be negative'),
    validationRules.max(100000, 'Points cannot exceed 100,000')
  ]);
  
  const tierValidation = validate(loyaltyData.tier, [
    validationRules.required('Tier is required'),
    validationRules.oneOf(['bronze', 'silver', 'gold', 'platinum'], 'Invalid tier')
  ]);
  
  const errors = [
    ...pointsValidation.errors,
    ...tierValidation.errors
  ];
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Reward validation
export function validateReward(rewardData: any): ValidationResult {
  const nameValidation = validate(rewardData.name, [
    validationRules.required('Reward name is required'),
    validationRules.maxLength(200, 'Reward name must be no more than 200 characters')
  ]);
  
  const pointsCostValidation = validate(rewardData.pointsCost, [
    validationRules.required('Points cost is required'),
    validationRules.min(1, 'Points cost must be at least 1'),
    validationRules.max(10000, 'Points cost cannot exceed 10,000')
  ]);
  
  const descriptionValidation = validate(rewardData.description, [
    validationRules.maxLength(1000, 'Description must be no more than 1000 characters')
  ]);
  
  const errors = [
    ...nameValidation.errors,
    ...pointsCostValidation.errors,
    ...descriptionValidation.errors
  ];
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>"'&]/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^+0-9]/g, '');
}

// Helper functions
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function isValidZipCode(zipCode: string): boolean {
  return ZIP_CODE_REGEX.test(zipCode);
}

export function isValidTime(time: string): boolean {
  return TIME_REGEX.test(time);
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}