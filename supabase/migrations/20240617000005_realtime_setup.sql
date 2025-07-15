-- Enable realtime for tables
-- This allows for real-time subscriptions on table changes
-- Note: supabase_realtime publication already exists in Supabase

-- Add tables to the existing supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Note: realtime schema already exists in Supabase
-- Function to check if user can receive realtime updates
CREATE OR REPLACE FUNCTION realtime.can_update(
  schema_name TEXT,
  table_name TEXT,
  user_id UUID,
  operation TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Allow all updates for now - in production you might want more granular control
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions for realtime
GRANT USAGE ON SCHEMA realtime TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA realtime TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA realtime TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA realtime TO postgres, anon, authenticated, service_role;