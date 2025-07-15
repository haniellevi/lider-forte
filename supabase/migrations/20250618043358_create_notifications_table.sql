-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'message', 'alert', 'reminder', 'update')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional metadata fields
  action_url TEXT,
  icon TEXT,
  sender_id TEXT,
  sender_name TEXT,
  sender_avatar TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

-- Users can insert their own notifications (for system notifications)
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample notifications for testing (replace with actual user IDs in production)
-- These are just examples and will only work if the user ID exists
-- INSERT INTO notifications (user_id, title, message, type, read, sender_name, sender_avatar) VALUES
--   ('user_example_id', 'Welcome to the platform!', 'Thank you for joining us. Explore all the features available.', 'info', false, 'System', '/api/placeholder/32/32'),
--   ('user_example_id', 'New message received', 'You have a new message from Sarah Wilson.', 'message', false, 'Sarah Wilson', '/api/placeholder/32/32'),
--   ('user_example_id', 'Profile update reminder', 'Please complete your profile to get the most out of our platform.', 'reminder', true, 'System', '/api/placeholder/32/32');