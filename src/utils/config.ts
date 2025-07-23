// Configuration utilities for Broski's Kitchen

// Helper functions for environment variables
function getEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
}

function getEnvArray(key: string, defaultValue: string[]): string[] {
  const value = process.env[key];
  return value ? value.split(',').map(item => item.trim()) : defaultValue;
}

// Configuration interfaces
export interface SecurityConfig {
  maxOrdersPerDay: number;
  maxAddressesPerUser: number;
  maxPaymentMethodsPerUser: number;
  maxBookingsPerUser: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
}

export interface AdminConfig {
  emails: string[];
  roles: string[];
  permissions: string[];
}

export interface BusinessConfig {
  maxOrderTotal: number;
  minOrderTotal: number;
  maxPartySize: number;
  deliveryRadius: number;
  operatingHours: {
    open: string;
    close: string;
  };
}

export interface ValidationConfig {
  maxNameLength: number;
  maxDescriptionLength: number;
  maxAddressLength: number;
  phoneRegex: string;
  emailRegex: string;
}

export interface FileUploadConfig {
  maxFileSize: number;
  allowedImageTypes: string[];
  maxImagesPerProduct: number;
}

export interface SessionConfig {
  timeoutMinutes: number;
  refreshThresholdMinutes: number;
  maxConcurrentSessions: number;
}

export interface NotificationConfig {
  enableEmail: boolean;
  enablePush: boolean;
  enableSMS: boolean;
  retryAttempts: number;
}

export interface FeatureFlagConfig {
  enableLoyaltyProgram: boolean;
  enableRewards: boolean;
  enableEvents: boolean;
  enableCatering: boolean;
  enableDelivery: boolean;
  enablePickup: boolean;
}

export interface ApiLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

export interface DatabaseConfig {
  connectionTimeout: number;
  queryTimeout: number;
  maxConnections: number;
  retryAttempts: number;
}

export interface CacheConfig {
  ttlSeconds: number;
  redisUrl: string;
}

export interface MonitoringConfig {
  logLevel: string;
  performanceMonitoring: boolean;
  errorTracking: boolean;
}

export interface EnvironmentConfig {
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

export interface AppConfig {
  security: SecurityConfig;
  admin: AdminConfig;
  business: BusinessConfig;
  validation: ValidationConfig;
  fileUpload: FileUploadConfig;
  session: SessionConfig;
  notifications: NotificationConfig;
  features: FeatureFlagConfig;
  apiLimits: ApiLimitConfig;
  database: DatabaseConfig;
  cache: CacheConfig;
  monitoring: MonitoringConfig;
  environment: EnvironmentConfig;
}

// Create the configuration object
export const config: AppConfig = {
  security: {
    maxOrdersPerDay: getEnvNumber('MAX_ORDERS_PER_DAY', 10),
    maxAddressesPerUser: getEnvNumber('MAX_ADDRESSES_PER_USER', 5),
    maxPaymentMethodsPerUser: getEnvNumber('MAX_PAYMENT_METHODS_PER_USER', 3),
    maxBookingsPerUser: getEnvNumber('MAX_BOOKINGS_PER_USER', 5),
    sessionTimeoutMinutes: getEnvNumber('SESSION_TIMEOUT_MINUTES', 60),
    maxLoginAttempts: getEnvNumber('MAX_LOGIN_ATTEMPTS', 5),
    lockoutDurationMinutes: getEnvNumber('LOCKOUT_DURATION_MINUTES', 15),
  },
  admin: {
    emails: getEnvArray('ADMIN_EMAILS', ['admin@broskiskitchen.com']),
    roles: getEnvArray('ADMIN_ROLES', ['admin', 'manager']),
    permissions: getEnvArray('ADMIN_PERMISSIONS', ['read', 'write', 'delete']),
  },
  business: {
    maxOrderTotal: getEnvNumber('MAX_ORDER_TOTAL', 1000),
    minOrderTotal: getEnvNumber('MIN_ORDER_TOTAL', 10),
    maxPartySize: getEnvNumber('MAX_PARTY_SIZE', 20),
    deliveryRadius: getEnvNumber('DELIVERY_RADIUS_MILES', 15),
    operatingHours: {
      open: getEnvVar('OPERATING_HOURS_OPEN', '09:00'),
      close: getEnvVar('OPERATING_HOURS_CLOSE', '22:00'),
    },
  },
  validation: {
    maxNameLength: getEnvNumber('MAX_NAME_LENGTH', 100),
    maxDescriptionLength: getEnvNumber('MAX_DESCRIPTION_LENGTH', 1000),
    maxAddressLength: getEnvNumber('MAX_ADDRESS_LENGTH', 200),
    phoneRegex: getEnvVar('PHONE_REGEX', '^\\+?[1-9]\\d{1,14}$'),
    emailRegex: getEnvVar('EMAIL_REGEX', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
  },
  fileUpload: {
    maxFileSize: getEnvNumber('MAX_FILE_SIZE_MB', 5) * 1024 * 1024, // Convert to bytes
    maxImagesPerProduct: getEnvNumber('MAX_IMAGES_PER_PRODUCT', 10),
    allowedImageTypes: getEnvArray('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/webp']),
  },
  session: {
    timeoutMinutes: getEnvNumber('SESSION_TIMEOUT_MINUTES', 60),
    refreshThresholdMinutes: getEnvNumber('SESSION_REFRESH_THRESHOLD_MINUTES', 15),
    maxConcurrentSessions: getEnvNumber('MAX_CONCURRENT_SESSIONS', 3),
  },
  notifications: {
    enableEmail: getEnvBoolean('ENABLE_EMAIL_NOTIFICATIONS', true),
    enablePush: getEnvBoolean('ENABLE_PUSH_NOTIFICATIONS', true),
    enableSMS: getEnvBoolean('ENABLE_SMS_NOTIFICATIONS', false),
    retryAttempts: getEnvNumber('NOTIFICATION_RETRY_ATTEMPTS', 3),
  },
  features: {
    enableLoyaltyProgram: getEnvBoolean('ENABLE_LOYALTY_PROGRAM', true),
    enableRewards: getEnvBoolean('ENABLE_REWARDS', true),
    enableEvents: getEnvBoolean('ENABLE_EVENTS', true),
    enableCatering: getEnvBoolean('ENABLE_CATERING', true),
    enableDelivery: getEnvBoolean('ENABLE_DELIVERY', true),
    enablePickup: getEnvBoolean('ENABLE_PICKUP', true),
  },
  apiLimits: {
    requestsPerMinute: getEnvNumber('API_REQUESTS_PER_MINUTE', 100),
    requestsPerHour: getEnvNumber('API_REQUESTS_PER_HOUR', 1000),
    requestsPerDay: getEnvNumber('API_REQUESTS_PER_DAY', 10000),
    burstLimit: getEnvNumber('API_BURST_LIMIT', 20),
  },
  database: {
    connectionTimeout: getEnvNumber('DB_CONNECTION_TIMEOUT_MS', 10000),
    queryTimeout: getEnvNumber('DB_QUERY_TIMEOUT_MS', 5000),
    maxConnections: getEnvNumber('DB_MAX_CONNECTIONS', 10),
    retryAttempts: getEnvNumber('DB_RETRY_ATTEMPTS', 3),
  },
  cache: {
    ttlSeconds: getEnvNumber('CACHE_TTL_SECONDS', 3600),
    redisUrl: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
  },
  monitoring: {
    logLevel: getEnvVar('LOG_LEVEL', 'info'),
    performanceMonitoring: getEnvBoolean('ENABLE_PERFORMANCE_MONITORING', true),
    errorTracking: getEnvBoolean('ENABLE_ERROR_TRACKING', true),
  },
  environment: {
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    isDevelopment: getEnvVar('NODE_ENV', 'development') === 'development',
    isProduction: getEnvVar('NODE_ENV', 'development') === 'production',
    isTest: getEnvVar('NODE_ENV', 'development') === 'test',
  },
};

// Export individual configs for convenience
export const securityConfig = config.security;
export const adminConfig = config.admin;
export const businessConfig = config.business;
export const validationConfig = config.validation;
export const fileUploadConfig = config.fileUpload;
export const sessionConfig = config.session;
export const notificationConfig = config.notifications;
export const featureFlagConfig = config.features;
export const apiLimitConfig = config.apiLimits;
export const databaseConfig = config.database;
export const cacheConfig = config.cache;
export const monitoringConfig = config.monitoring;
export const environmentConfig = config.environment;

// Helper functions
export function isFeatureEnabled(feature: keyof FeatureFlagConfig): boolean {
  return config.features[feature];
}

export function isAdminEmail(email: string): boolean {
  return config.admin.emails.includes(email);
}

export function isWithinBusinessHours(): boolean {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  return currentTime >= config.business.operatingHours.open && 
         currentTime <= config.business.operatingHours.close;
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (file.size > config.fileUpload.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${config.fileUpload.maxFileSize / (1024 * 1024)}MB`
    };
  }
  
  if (!config.fileUpload.allowedImageTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${config.fileUpload.allowedImageTypes.join(', ')}`
    };
  }
  
  return { valid: true };
}

export default config;