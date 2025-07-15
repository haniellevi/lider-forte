-- Create invites table for managing church invitations
-- This table stores invitations sent to potential church members

CREATE TABLE IF NOT EXISTS public.invites (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role public.user_role NOT NULL DEFAULT 'member'::public.user_role,
    message TEXT,
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.invites IS 'Stores church invitations sent to potential members';
COMMENT ON COLUMN public.invites.email IS 'Email address of the person being invited';
COMMENT ON COLUMN public.invites.full_name IS 'Full name of the person being invited';
COMMENT ON COLUMN public.invites.phone IS 'Phone number of the person being invited';
COMMENT ON COLUMN public.invites.role IS 'Role that will be assigned when invite is accepted';
COMMENT ON COLUMN public.invites.message IS 'Optional message from the person sending the invite';
COMMENT ON COLUMN public.invites.token IS 'Unique token for accepting the invite';
COMMENT ON COLUMN public.invites.status IS 'Current status of the invitation';
COMMENT ON COLUMN public.invites.church_id IS 'Church the person is being invited to';
COMMENT ON COLUMN public.invites.created_by IS 'User who created the invitation';
COMMENT ON COLUMN public.invites.accepted_by IS 'User who accepted the invitation';
COMMENT ON COLUMN public.invites.expires_at IS 'When the invitation expires';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_church_id ON public.invites(church_id);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON public.invites(created_by);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON public.invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_invites_created_at ON public.invites(created_at DESC);

-- Create unique constraint for pending invites
CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_unique_pending 
ON public.invites(email, church_id) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view invites in their church" ON public.invites
    FOR SELECT 
    USING (
        church_id = public.get_my_church_id() AND
        public.get_my_role() IN ('pastor'::public.user_role, 'supervisor'::public.user_role)
    );

CREATE POLICY "Pastors and supervisors can create invites" ON public.invites
    FOR INSERT 
    WITH CHECK (
        church_id = public.get_my_church_id() AND
        public.get_my_role() IN ('pastor'::public.user_role, 'supervisor'::public.user_role) AND
        created_by = auth.uid()
    );

CREATE POLICY "Pastors and supervisors can update invites in their church" ON public.invites
    FOR UPDATE 
    USING (
        church_id = public.get_my_church_id() AND
        public.get_my_role() IN ('pastor'::public.user_role, 'supervisor'::public.user_role)
    );

CREATE POLICY "Pastors can delete invites in their church" ON public.invites
    FOR DELETE 
    USING (
        church_id = public.get_my_church_id() AND
        public.get_my_role() = 'pastor'::public.user_role
    );

-- Add updated_at trigger
CREATE TRIGGER update_invites_updated_at 
    BEFORE UPDATE ON public.invites 
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically expire old invites
CREATE OR REPLACE FUNCTION public.expire_old_invites()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.invites 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.expire_old_invites IS 'Automatically expire old pending invites';

-- Function to get invite statistics
CREATE OR REPLACE FUNCTION public.get_invite_statistics()
RETURNS TABLE (
    total_invites BIGINT,
    pending_invites BIGINT,
    accepted_invites BIGINT,
    rejected_invites BIGINT,
    expired_invites BIGINT,
    acceptance_rate NUMERIC,
    recent_invites BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_invites,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_invites,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_invites,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_invites,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_invites,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected')) > 0 THEN
                (COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC / 
                 COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected'))::NUMERIC) * 100
            ELSE 0
        END as acceptance_rate,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_invites
    FROM public.invites
    WHERE church_id = public.get_my_church_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_invite_statistics IS 'Get comprehensive invite statistics for dashboard';

-- Function to clean up old invites (keep only last 6 months)
CREATE OR REPLACE FUNCTION public.cleanup_old_invites()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.invites 
    WHERE created_at < NOW() - INTERVAL '6 months'
    AND status IN ('rejected', 'expired');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_invites IS 'Clean up old rejected and expired invites (keeps last 6 months)';

-- Add foreign key constraints with proper naming
ALTER TABLE public.invites 
ADD CONSTRAINT fk_invites_church_id 
FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE CASCADE;

ALTER TABLE public.invites 
ADD CONSTRAINT fk_invites_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.invites 
ADD CONSTRAINT fk_invites_accepted_by 
FOREIGN KEY (accepted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;