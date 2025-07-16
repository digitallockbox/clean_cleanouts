-- Add all required fields to payment_methods table
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS card_last_four text,
ADD COLUMN IF NOT EXISTS card_brand text,
ADD COLUMN IF NOT EXISTS card_exp_month integer,
ADD COLUMN IF NOT EXISTS card_exp_year integer,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_last_four text,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id text;

-- Drop old columns if they exist
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.payment_methods 
        DROP COLUMN IF EXISTS last_four,
        DROP COLUMN IF EXISTS brand,
        DROP COLUMN IF EXISTS exp_month,
        DROP COLUMN IF EXISTS exp_year;
    EXCEPTION
        WHEN undefined_column THEN
            -- Do nothing, columns don't exist
    END;
END $$;
