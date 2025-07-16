/*
  # Complete Database Schema for Service Booking Platform
  
  This file contains the complete database schema for the CleanOuts Pro service booking platform.
  Run this after deleting all existing tables to get a fresh, complete setup.
  
  ## Tables Created:
  1. profiles - User profile information
  2. service_categories - Service categorization
  3. services - Available services with pricing
  4. bookings - Customer bookings
  5. website_settings - Dynamic website configuration
  6. contact_submissions - Contact form submissions
  7. user_preferences - User notification preferences
  8. payment_methods - Saved payment methods
  9. service_reviews - Customer reviews and ratings
  10. email_logs - Email tracking
  11. notifications - User notifications
  12. payments - Payment records
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- CORE TABLES
-- =============================================

-- User profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Service categories table
CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  base_price numeric NOT NULL CHECK (base_price >= 0),
  price_per_hour numeric NOT NULL CHECK (price_per_hour >= 0),
  image_url text DEFAULT '',
  category_id uuid REFERENCES public.service_categories(id),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE RESTRICT NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration integer DEFAULT 2 CHECK (duration > 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  payment_intent_id text,
  notes text,
  customer_info jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Website settings table
CREATE TABLE IF NOT EXISTS public.website_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'image', 'color', 'json')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  submitted_at timestamptz DEFAULT now() NOT NULL,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_notifications boolean DEFAULT true NOT NULL,
  sms_notifications boolean DEFAULT false NOT NULL,
  marketing_emails boolean DEFAULT true NOT NULL,
  booking_reminders boolean DEFAULT true NOT NULL,
  preferred_contact_method text DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms')),
  timezone text DEFAULT 'America/New_York',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('card', 'bank_account')),
  last_four text,
  brand text,
  exp_month integer,
  exp_year integer,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Service reviews table
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  is_verified boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(booking_id)
);

-- Email logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  provider_message_id text,
  sent_at timestamptz DEFAULT now() NOT NULL,
  delivered_at timestamptz,
  error_message text
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id text NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_name ON public.services(name);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

-- Contact submissions indexes
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON public.contact_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Payment methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON public.payment_methods(user_id, is_default);

-- Service reviews indexes
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id ON public.service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_user_id ON public.service_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_rating ON public.service_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_service_reviews_is_featured ON public.service_reviews(is_featured);

-- Email logs indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id ON public.email_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_settings_updated_at
BEFORE UPDATE ON public.website_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_reviews_updated_at
BEFORE UPDATE ON public.service_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Service categories policies
CREATE POLICY "Service categories are publicly readable"
  ON public.service_categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage service categories"
  ON public.service_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Services policies
CREATE POLICY "Services are publicly readable"
  ON public.services
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage services"
  ON public.services
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Website settings policies
CREATE POLICY "Website settings are publicly readable"
  ON public.website_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update website settings"
  ON public.website_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Contact submissions policies
CREATE POLICY "Anyone can create contact submissions"
  ON public.contact_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view contact submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update contact submissions"
  ON public.contact_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods"
  ON public.payment_methods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
  ON public.payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON public.payment_methods
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON public.payment_methods
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service reviews policies
CREATE POLICY "Service reviews are publicly readable"
  ON public.service_reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON public.service_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_id 
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON public.service_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Email logs policies
CREATE POLICY "Users can view their own email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs"
  ON public.email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view payments for their bookings"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payments.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create user preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_payment_method()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.payment_methods 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to create user preferences on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- Trigger for default payment method constraint
CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON public.payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_payment_method();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default service categories
INSERT INTO public.service_categories (name, description) VALUES
('Junk Removal', 'Professional removal of unwanted items'),
('Moving Services', 'Labor and moving assistance'),
('Cleanouts', 'Complete property cleanout services'),
('Demolition', 'Demolition and debris removal')
ON CONFLICT DO NOTHING;

-- Insert default website settings
INSERT INTO public.website_settings (key, value, type) VALUES
('siteName', 'CleanOuts Pro', 'text'),
('siteDescription', 'Professional junk removal and moving services', 'text'),
('primaryColor', '#2563eb', 'color'),
('secondaryColor', '#1e40af', 'color'),
('logoUrl', 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'image'),
('heroTitle', 'Professional Cleanout Services', 'text'),
('heroSubtitle', 'Fast, reliable, and eco-friendly junk removal and moving services', 'text'),
('heroImage', 'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop', 'image'),
('contactEmail', 'info@cleanoutspro.com', 'text'),
('contactPhone', '(555) 123-4567', 'text'),
('address', '123 Service St, City, State 12345', 'text')
ON CONFLICT (key) DO NOTHING;

-- Insert default services
INSERT INTO public.services (name, description, base_price, price_per_hour, image_url, category_id) VALUES
(
  'Junk Removal',
  'Professional removal of unwanted items from your home or office',
  99,
  50,
  'https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  (SELECT id FROM public.service_categories WHERE name = 'Junk Removal' LIMIT 1)
),
(
  'Labor Moving',
  'Experienced movers to help with your relocation needs',
  120,
  60,
  'https://images.pexels.com/photos/7464230/pexels-photo-7464230.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  (SELECT id FROM public.service_categories WHERE name = 'Moving Services' LIMIT 1)
),
(
  'Estate Cleanouts',
  'Comprehensive cleanout services for estates and properties',
  150,
  75,
  'https://images.pexels.com/photos/4107120/pexels-photo-4107120.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  (SELECT id FROM public.service_categories WHERE name = 'Cleanouts' LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Complete database schema created successfully!';
  RAISE NOTICE '📊 Tables: profiles, services, bookings, website_settings, contact_submissions, user_preferences, payment_methods, service_reviews, email_logs, notifications, payments';
  RAISE NOTICE '🔒 RLS policies enabled for all tables';
  RAISE NOTICE '⚡ Performance indexes created';
  RAISE NOTICE '🎯 Default data inserted';
  RAISE NOTICE '🚀 Your service booking platform is ready!';
END $$;