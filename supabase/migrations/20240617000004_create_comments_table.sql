-- Create comments table for post interactions
-- This table demonstrates foreign key relationships and complex RLS policies

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments using Clerk JWT

-- Users can view comments on published posts
CREATE POLICY "View comments on published posts" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE public.posts.id = public.comments.post_id 
      AND public.posts.published = true
    )
  );

-- Users can view comments on their own posts (published or not)
CREATE POLICY "View comments on own posts" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE public.posts.id = public.comments.post_id 
      AND public.posts.user_id = COALESCE(
        auth.jwt() ->> 'sub',
        current_setting('request.jwt.claim.sub', true)
      )
    )
  );

-- Users can view their own comments
CREATE POLICY "Users can view own comments" ON public.comments
  FOR SELECT USING (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

-- Users can create comments on published posts
CREATE POLICY "Create comments on published posts" ON public.comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE public.posts.id = public.comments.post_id 
      AND public.posts.published = true
    ) AND
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (
    COALESCE(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claim.sub', true)
    ) = user_id
  );

-- Post owners can delete comments on their posts
CREATE POLICY "Post owners can delete comments" ON public.comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE public.posts.id = public.comments.post_id 
      AND public.posts.user_id = COALESCE(
        auth.jwt() ->> 'sub',
        current_setting('request.jwt.claim.sub', true)
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);