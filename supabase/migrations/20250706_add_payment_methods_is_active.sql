-- Add is_active column to payment_methods table
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Create index for is_active column
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON public.payment_methods(is_active);
