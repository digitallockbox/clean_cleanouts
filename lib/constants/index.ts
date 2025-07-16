// App configuration
export const APP_CONFIG = {
  name: 'CleanOuts Pro',
  description: 'Professional junk removal and moving services',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  supportEmail: 'support@cleanoutspro.com',
} as const;

// Business hours
export const BUSINESS_HOURS = {
  start: 8, // 8 AM
  end: 18,  // 6 PM
  timezone: 'America/New_York',
} as const;

// Booking configuration
export const BOOKING_CONFIG = {
  maxAdvanceBookingDays: 90,
  minAdvanceBookingHours: 24,
  maxDurationHours: 12,
  minDurationHours: 1,
  defaultDurationHours: 2,
  timeSlotInterval: 60, // minutes
  cancellationDeadlineHours: 24,
} as const;

// Payment configuration for two-stage payment system
export const PAYMENT_CONFIG = {
  // Deposit settings
  depositPercentage: 30,           // 30% deposit required
  minimumDeposit: 25,              // Minimum $25 deposit
  maximumDeposit: 150,             // Maximum $150 deposit
  
  // Payment timing
  depositDueHours: 24,             // Deposit due within 24 hours of confirmation
  balanceDueHours: 2,              // Balance due within 2 hours of service completion
  
  // Refund policy
  fullRefundHours: 48,             // Full refund if cancelled 48+ hours before
  partialRefundHours: 24,          // 50% refund if cancelled 24-48 hours before
  noRefundHours: 24,               // No refund if cancelled less than 24 hours before
  
  // Service-specific settings
  allowPriceAdjustment: true,      // Allow price adjustment after on-site assessment
  maxPriceIncrease: 50,            // Maximum 50% price increase allowed
  requireApprovalForIncrease: true, // Require customer approval for price increases
} as const;

// Time slots for booking
export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00'
] as const;

// Duration options (in hours)
export const DURATION_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 3, label: '3 hours' },
  { value: 4, label: '4 hours' },
  { value: 5, label: '5 hours' },
  { value: 6, label: '6 hours' },
  { value: 7, label: '7 hours' },
  { value: 8, label: '8 hours' },
] as const;

// Booking statuses
export const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUSES.PENDING]: 'Pending',
  [BOOKING_STATUSES.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUSES.IN_PROGRESS]: 'In Progress',
  [BOOKING_STATUSES.COMPLETED]: 'Completed',
  [BOOKING_STATUSES.CANCELLED]: 'Cancelled',
} as const;

export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
  [BOOKING_STATUSES.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [BOOKING_STATUSES.IN_PROGRESS]: 'bg-purple-100 text-purple-800',
  [BOOKING_STATUSES.COMPLETED]: 'bg-green-100 text-green-800',
  [BOOKING_STATUSES.CANCELLED]: 'bg-red-100 text-red-800',
} as const;

// Payment statuses - Enhanced for two-stage payment system
export const PAYMENT_STATUSES = {
  PENDING: 'pending',                    // Initial booking, no payment required yet
  DEPOSIT_REQUIRED: 'deposit_required',  // Admin confirmed, deposit payment needed
  DEPOSIT_PAID: 'deposit_paid',         // Deposit paid, service can proceed
  BALANCE_DUE: 'balance_due',           // Service completed, final payment needed
  PROCESSING: 'processing',              // Payment being processed
  PAID: 'paid',                         // Fully paid
  FAILED: 'failed',                     // Payment failed
  REFUNDED: 'refunded',                 // Payment refunded
  PARTIAL_REFUND: 'partial_refund',     // Partial refund issued
} as const;

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUSES.PENDING]: 'Pending Confirmation',
  [PAYMENT_STATUSES.DEPOSIT_REQUIRED]: 'Deposit Required',
  [PAYMENT_STATUSES.DEPOSIT_PAID]: 'Deposit Paid',
  [PAYMENT_STATUSES.BALANCE_DUE]: 'Balance Due',
  [PAYMENT_STATUSES.PROCESSING]: 'Processing',
  [PAYMENT_STATUSES.PAID]: 'Fully Paid',
  [PAYMENT_STATUSES.FAILED]: 'Payment Failed',
  [PAYMENT_STATUSES.REFUNDED]: 'Refunded',
  [PAYMENT_STATUSES.PARTIAL_REFUND]: 'Partially Refunded',
} as const;

export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUSES.PENDING]: 'bg-gray-100 text-gray-800',
  [PAYMENT_STATUSES.DEPOSIT_REQUIRED]: 'bg-orange-100 text-orange-800',
  [PAYMENT_STATUSES.DEPOSIT_PAID]: 'bg-blue-100 text-blue-800',
  [PAYMENT_STATUSES.BALANCE_DUE]: 'bg-yellow-100 text-yellow-800',
  [PAYMENT_STATUSES.PROCESSING]: 'bg-purple-100 text-purple-800',
  [PAYMENT_STATUSES.PAID]: 'bg-green-100 text-green-800',
  [PAYMENT_STATUSES.FAILED]: 'bg-red-100 text-red-800',
  [PAYMENT_STATUSES.REFUNDED]: 'bg-gray-100 text-gray-800',
  [PAYMENT_STATUSES.PARTIAL_REFUND]: 'bg-yellow-100 text-yellow-800',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// File upload configuration
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'text/plain'],
} as const;

// Pagination
export const PAGINATION_CONFIG = {
  defaultLimit: 10,
  maxLimit: 100,
  defaultPage: 1,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: '/api/auth/signin',
    SIGN_UP: '/api/auth/signup',
    SIGN_OUT: '/api/auth/signout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  BOOKINGS: {
    LIST: '/api/bookings',
    CREATE: '/api/bookings',
    GET: (id: string) => `/api/bookings/${id}`,
    UPDATE: (id: string) => `/api/bookings/${id}`,
    DELETE: (id: string) => `/api/bookings/${id}`,
    AVAILABILITY: '/api/bookings/availability',
  },
  SERVICES: {
    LIST: '/api/services',
    CREATE: '/api/services',
    GET: (id: string) => `/api/services/${id}`,
    UPDATE: (id: string) => `/api/services/${id}`,
    DELETE: (id: string) => `/api/services/${id}`,
  },
  PAYMENTS: {
    CREATE_INTENT: '/api/payments/create-intent',
    CONFIRM: '/api/payments/confirm',
    WEBHOOK: '/api/payments/webhook',
  },
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    USERS: '/api/admin/users',
    SETTINGS: '/api/admin/settings',
  },
  CONTACT: '/api/contact',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  BOOKING: {
    NOT_FOUND: 'Booking not found.',
    ALREADY_BOOKED: 'This time slot is already booked.',
    PAST_DATE: 'Cannot book for past dates.',
    OUTSIDE_BUSINESS_HOURS: 'Booking must be within business hours.',
    TOO_FAR_ADVANCE: 'Cannot book more than 90 days in advance.',
    INSUFFICIENT_NOTICE: 'Bookings require at least 24 hours notice.',
  },
  PAYMENT: {
    FAILED: 'Payment failed. Please try again.',
    INVALID_AMOUNT: 'Invalid payment amount.',
    CARD_DECLINED: 'Your card was declined.',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_NOT_VERIFIED: 'Please verify your email address.',
    ACCOUNT_LOCKED: 'Your account has been locked.',
    PASSWORD_TOO_WEAK: 'Password is too weak.',
  },
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  BOOKING: {
    CREATED: 'Booking created successfully!',
    UPDATED: 'Booking updated successfully!',
    CANCELLED: 'Booking cancelled successfully!',
    CONFIRMED: 'Booking confirmed successfully!',
  },
  PAYMENT: {
    SUCCESSFUL: 'Payment processed successfully!',
    REFUNDED: 'Payment refunded successfully!',
  },
  AUTH: {
    SIGNED_IN: 'Signed in successfully!',
    SIGNED_OUT: 'Signed out successfully!',
    SIGNED_UP: 'Account created successfully!',
    PASSWORD_RESET: 'Password reset successfully!',
  },
  PROFILE: {
    UPDATED: 'Profile updated successfully!',
  },
  CONTACT: {
    SENT: 'Message sent successfully!',
  },
} as const;

// Default service categories
export const DEFAULT_SERVICE_CATEGORIES = [
  {
    name: 'Junk Removal',
    description: 'Professional removal of unwanted items',
  },
  {
    name: 'Moving Services',
    description: 'Labor and moving assistance',
  },
  {
    name: 'Cleanouts',
    description: 'Complete property cleanout services',
  },
  {
    name: 'Demolition',
    description: 'Demolition and debris removal',
  },
] as const;

// Email templates
export const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMATION: 'booking-confirmation',
  BOOKING_REMINDER: 'booking-reminder',
  BOOKING_CANCELLED: 'booking-cancelled',
  PAYMENT_RECEIPT: 'payment-receipt',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
} as const;

// Social media links
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/cleanoutspro',
  TWITTER: 'https://twitter.com/cleanoutspro',
  INSTAGRAM: 'https://instagram.com/cleanoutspro',
  LINKEDIN: 'https://linkedin.com/company/cleanoutspro',
} as const;

// SEO configuration
export const SEO_CONFIG = {
  defaultTitle: 'CleanOuts Pro - Professional Cleanout Services',
  titleTemplate: '%s | CleanOuts Pro',
  defaultDescription: 'Fast, reliable, and eco-friendly junk removal and moving services',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  twitterHandle: '@cleanoutspro',
  facebookAppId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_CHAT_SUPPORT: false,
  ENABLE_REVIEWS: true,
  ENABLE_LOYALTY_PROGRAM: false,
  ENABLE_MULTI_LANGUAGE: false,
} as const;