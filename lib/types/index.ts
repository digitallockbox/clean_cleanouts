import { Database } from '@/lib/supabase';

// Database types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

// Core entity types
export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    role?: 'admin' | 'user';
  };
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  price_per_hour: number;
  image_url: string;
  category_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_price: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_intent_id?: string;
  notes?: string;
  customer_info: CustomerInfo;
  created_at: string;
  updated_at: string;
  // Relations
  service?: Service;
  user?: Profile;
}

export interface CustomerInfo {
  full_name: string;
  email: string;
  phone: string;
  address: string;
}

export interface WebsiteSettings {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'image' | 'color' | 'json';
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

// Enum types
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
export type UserRole = 'admin' | 'user';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface BookingFormData {
  service_id: string;
  booking_date: Date;
  start_time: string;
  duration: number;
  notes?: string;
  customer_info: CustomerInfo;
}

export interface ServiceFormData {
  name: string;
  description: string;
  base_price: number;
  price_per_hour: number;
  image_url?: string;
  category_id?: string;
  is_active: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Dashboard types
export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalUsers: number;
  activeServices: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

export interface BookingsByStatus {
  status: BookingStatus;
  count: number;
  percentage: number;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

// Search and filter types
export interface BookingFilters {
  status?: BookingStatus[];
  payment_status?: PaymentStatus[];
  date_from?: string;
  date_to?: string;
  service_id?: string;
  user_id?: string;
}

export interface ServiceFilters {
  category_id?: string;
  is_active?: boolean;
  price_min?: number;
  price_max?: number;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Time slot types
export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface AvailabilityData {
  date: string;
  slots: TimeSlot[];
}

// Email template types
export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BookingConfirmationEmail extends EmailTemplate {
  booking: Booking;
  service: Service;
}

// Webhook types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

// File upload types
export interface FileUpload {
  file: File;
  url?: string;
  progress?: number;
  error?: string;
}

// Theme types
export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
}