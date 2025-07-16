import { z } from 'zod';

// Simplified booking schema with more lenient date validation
export const simpleBookingSchema = z.object({
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
    }),
  startTime: z
    .string()
    .min(1, 'Please select a start time'),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 hour')
    .max(12, 'Duration cannot exceed 12 hours'),
  notes: z
    .string()
    .optional(),
  customerInfo: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .min(8, 'Phone number must be at least 8 digits'),
    address: z
      .string()
      .min(5, 'Address must be at least 5 characters'),
  }),
});

export type SimpleBookingInput = z.infer<typeof simpleBookingSchema>;