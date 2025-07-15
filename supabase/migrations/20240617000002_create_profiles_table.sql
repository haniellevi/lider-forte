-- Create profiles table for user data
-- This table stores additional user information synced from Clerk

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles using Clerk JWT
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Create trigger to update updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();