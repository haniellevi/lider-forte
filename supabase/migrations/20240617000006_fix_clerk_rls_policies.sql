-- Fix RLS policies for better Clerk compatibility
-- This migration improves RLS policies to work better with Clerk JWT tokens

-- Helper function to get user ID from Clerk JWT
CREATE OR REPLACE FUNCTION get_clerk_user_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Recreate profiles policies with improved Clerk support
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    user_id = get_clerk_user_id()
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    user_id = get_clerk_user_id()
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    user_id = get_clerk_user_id()
  );

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (
    user_id = get_clerk_user_id()
  );

-- Drop and recreate posts policies
DROP POLICY IF EXISTS "Users can view own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

CREATE POLICY "Users can view own posts" ON public.posts
  FOR SELECT USING (
    user_id = get_clerk_user_id()
  );

CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    user_id = get_clerk_user_id()
  );

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (
    user_id = get_clerk_user_id()
  );

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (
    user_id = get_clerk_user_id()
  );

-- Drop and recreate comments policies
DROP POLICY IF EXISTS "Users can view own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Create comments on published posts" ON public.comments;

CREATE POLICY "Users can view own comments" ON public.comments
  FOR SELECT USING (
    user_id = get_clerk_user_id()
  );

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (
    user_id = get_clerk_user_id()
  );

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (
    user_id = get_clerk_user_id()
  );

CREATE POLICY "Create comments on published posts" ON public.comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE public.posts.id = public.comments.post_id 
      AND public.posts.published = true
    ) AND
    user_id = get_clerk_user_id()
  ); 