-- Create posts table for user content
-- This table demonstrates CRUD operations with RLS

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk user ID
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts using Clerk JWT

-- Anyone can view published posts
CREATE POLICY "Anyone can view published posts" ON public.posts
  FOR SELECT USING (published = true);

-- Users can view their own posts (published or not)
CREATE POLICY "Users can view own posts" ON public.posts
  FOR SELECT USING (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

-- Users can create their own posts
CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_title ON public.posts(title);

-- Create trigger to update updated_at column
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();