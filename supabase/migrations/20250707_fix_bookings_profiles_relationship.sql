-- This migration fixes the relationship between the bookings and profiles tables.
-- The original schema had bookings.user_id referencing auth.users(id),
-- while the dashboard query expected a direct relationship to profiles.
-- This change updates the foreign key to point to public.profiles(id),
-- which will allow the Supabase query to correctly fetch user details for bookings.

-- Drop the existing foreign key constraint on bookings.user_id
-- The constraint name 'bookings_user_id_fkey' is a common convention,
-- but it might be different in your specific setup.
-- If this fails, please check the actual constraint name in your Supabase dashboard under Database -> Tables -> bookings -> Constraints.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

-- Add a new foreign key constraint from bookings.user_id to profiles.id
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
