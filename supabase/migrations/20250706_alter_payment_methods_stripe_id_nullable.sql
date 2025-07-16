-- Alter stripe_payment_method_id to be nullable
ALTER TABLE public.payment_methods
ALTER COLUMN stripe_payment_method_id DROP NOT NULL;
