-- Add email column to profiles table
ALTER TABLE public.profiles
ADD COLUMN email TEXT;

-- Create an index on the new email column
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update the function to populate the email on new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill the email for existing users
-- This needs to be run with elevated privileges (e.g., from the Supabase SQL editor or as a migration)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
