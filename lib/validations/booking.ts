import { z } from 'zod';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';

export const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service'),
  bookingDate: z
    .union([
      z.date(),
      z.string().transform((str) => new Date(str))
    ])
    .refine((date) => {
      const parsedDate = date instanceof Date ? date : new Date(date);
      return !isNaN(parsedDate.getTime());
    }, {
      message: 'Please select a valid date',
    })
    .refine((date) => {
      const parsedDate = date instanceof Date ? date : new Date(date);
      return isAfter(parsedDate, startOfDay(new Date()));
    }, {
      message: 'Booking date must be in the future',
    })
    .refine((date) => {
      const parsedDate = date instanceof Date ? date : new Date(date);
      return isBefore(parsedDate, addDays(new Date(), 90));
    }, {
      message: 'Booking date must be within 90 days',
    })
    .transform((date) => date instanceof Date ? date : new Date(date)),
  startTime: z
    .string()
    .min(1, 'Please select a start time')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)'),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 hour')
    .max(12, 'Duration cannot exceed 12 hours'),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
  customerInfo: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(50, 'Full name must be less than 50 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .min(8, 'Phone number must be at least 8 digits')
      .regex(/^[\+]?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
    address: z
      .string()
      .min(5, 'Address must be at least 5 characters')
      .max(200, 'Address must be less than 200 characters'),
  }),
});

export const updateBookingSchema = z.object({
  bookingDate: z
    .date({
      required_error: 'Please select a booking date',
      invalid_type_error: 'Please select a valid date',
    })
    .refine((date) => isAfter(date, startOfDay(new Date())), {
      message: 'Booking date must be in the future',
    })
    .optional(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)')
    .optional(),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 hour')
    .max(12, 'Duration cannot exceed 12 hours')
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
  status: z
    .enum(['pending', 'confirmed', 'completed', 'cancelled'])
    .optional(),
  payment_status: z
    .enum(['pending', 'deposit_required', 'deposit_paid', 'balance_due', 'processing', 'paid', 'failed', 'refunded', 'partial_refund'])
    .optional(),
});

export const serviceSchema = z.object({
  name: z
    .string()
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  basePrice: z
    .number()
    .min(0, 'Base price must be a positive number')
    .max(10000, 'Base price cannot exceed $10,000'),
  pricePerHour: z
    .number()
    .min(0, 'Price per hour must be a positive number')
    .max(1000, 'Price per hour cannot exceed $1,000'),
  imageUrl: z
    .string()
    .url('Please enter a valid image URL')
    .optional(),
  category: z
    .string()
    .min(1, 'Please select a category')
    .optional(),
  isActive: z.boolean().default(true),
});

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .optional(),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
});

export const websiteSettingsSchema = z.object({
  siteName: z
    .string()
    .min(2, 'Site name must be at least 2 characters')
    .max(50, 'Site name must be less than 50 characters'),
  siteDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must be less than 200 characters'),
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'),
  secondaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'),
  logoUrl: z
    .string()
    .url('Please enter a valid logo URL')
    .optional(),
  heroTitle: z
    .string()
    .min(5, 'Hero title must be at least 5 characters')
    .max(100, 'Hero title must be less than 100 characters'),
  heroSubtitle: z
    .string()
    .min(10, 'Hero subtitle must be at least 10 characters')
    .max(200, 'Hero subtitle must be less than 200 characters'),
  heroImage: z
    .string()
    .url('Please enter a valid hero image URL')
    .optional(),
  contactEmail: z
    .string()
    .email('Please enter a valid email address'),
  contactPhone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
  address: z
    .string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters'),
});

// Type exports
export type BookingInput = z.infer<typeof bookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type WebsiteSettingsInput = z.infer<typeof websiteSettingsSchema>;

// Helper functions for validation
export const validateTimeSlot = (time: string, duration: number): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration * 60;
  
  // Business hours: 8 AM to 6 PM
  const businessStart = 8 * 60; // 8:00 AM
  const businessEnd = 18 * 60;  // 6:00 PM
  
  return startMinutes >= businessStart && endMinutes <= businessEnd;
};

export const isValidBookingDate = (date: Date): boolean => {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 90);
  
  return isAfter(date, today) && isBefore(date, maxDate);
};