-- Add updated_at column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- Create trigger for automatically updating updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
