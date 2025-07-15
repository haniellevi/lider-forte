-- Enhanced RLS Policies for G12 Schema
-- This migration enhances the existing RLS policies with more specific permissions
-- based on the G12 hierarchy and user roles

-- Drop existing policies to recreate with enhanced permissions
DROP POLICY IF EXISTS "Pastors can update their own church" ON public.churches;
DROP POLICY IF EXISTS "Users can see other profiles from the same church" ON public.profiles;
DROP POLICY IF EXISTS "Leaders can create cells in their church" ON public.cells;
DROP POLICY IF EXISTS "Leaders can update their own cell" ON public.cells;
DROP POLICY IF EXISTS "Leaders can manage members in their own cell" ON public.cell_members;

-- ENHANCED CHURCHES POLICIES
CREATE POLICY "Pastors can update their own church" ON public.churches
  FOR UPDATE 
  USING (id = public.get_my_church_id() AND public.get_my_role() = 'pastor'::public.user_role);

CREATE POLICY "Pastors can delete their own church" ON public.churches
  FOR DELETE 
  USING (id = public.get_my_church_id() AND public.get_my_role() = 'pastor'::public.user_role);

-- ENHANCED PROFILES POLICIES
CREATE POLICY "Users can see other profiles from the same church" ON public.profiles
  FOR SELECT 
  USING (church_id = public.get_my_church_id());

CREATE POLICY "Pastors and supervisors can update profiles in their church" ON public.profiles
  FOR UPDATE 
  USING (
    church_id = public.get_my_church_id() AND 
    public.get_my_role() IN ('pastor'::public.user_role, 'supervisor'::public.user_role)
  );

CREATE POLICY "Pastors can delete profiles in their church" ON public.profiles
  FOR DELETE 
  USING (
    church_id = public.get_my_church_id() AND 
    public.get_my_role() = 'pastor'::public.user_role
  );

-- ENHANCED CELLS POLICIES
CREATE POLICY "Leaders and above can create cells in their church" ON public.cells
  FOR INSERT 
  WITH CHECK (
    church_id = public.get_my_church_id() AND 
    public.get_my_role() IN ('leader'::public.user_role, 'supervisor'::public.user_role, 'pastor'::public.user_role)
  );

CREATE POLICY "Leaders can update their own cell" ON public.cells
  FOR UPDATE 
  USING (leader_id = auth.uid());

CREATE POLICY "Supervisors can update cells in their network" ON public.cells
  FOR UPDATE 
  USING (
    church_id = public.get_my_church_id() AND 
    public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
  );

CREATE POLICY "Leaders can delete their own cell" ON public.cells
  FOR DELETE 
  USING (leader_id = auth.uid());

CREATE POLICY "Supervisors and pastors can delete cells in their network" ON public.cells
  FOR DELETE 
  USING (
    church_id = public.get_my_church_id() AND 
    public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
  );

-- ENHANCED CELL_MEMBERS POLICIES
CREATE POLICY "Leaders can manage members in their own cell" ON public.cell_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cells c
      WHERE c.id = cell_members.cell_id AND c.leader_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cells c
      WHERE c.id = cell_members.cell_id AND c.leader_id = auth.uid()
    )
  );

CREATE POLICY "Supervisors can manage members in their network" ON public.cell_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cells c
      WHERE c.id = cell_members.cell_id 
      AND c.church_id = public.get_my_church_id()
      AND public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cells c
      WHERE c.id = cell_members.cell_id 
      AND c.church_id = public.get_my_church_id()
      AND public.get_my_role() IN ('supervisor'::public.user_role, 'pastor'::public.user_role)
    )
  );

-- FUNCTION TO CHECK HIERARCHICAL PERMISSIONS
CREATE OR REPLACE FUNCTION public.can_access_cell(target_cell_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role public.user_role;
  user_church_id UUID;
  target_church_id UUID;
  is_leader BOOLEAN;
  is_supervisor BOOLEAN;
BEGIN
  -- Get current user info
  SELECT role, church_id INTO user_role, user_church_id
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Get target cell church
  SELECT church_id INTO target_church_id
  FROM public.cells
  WHERE id = target_cell_id;
  
  -- Must be same church
  IF user_church_id != target_church_id THEN
    RETURN FALSE;
  END IF;
  
  -- Pastor can access everything
  IF user_role = 'pastor' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is leader of the cell
  SELECT EXISTS(
    SELECT 1 FROM public.cells 
    WHERE id = target_cell_id AND leader_id = auth.uid()
  ) INTO is_leader;
  
  IF is_leader THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is supervisor of the cell
  SELECT EXISTS(
    SELECT 1 FROM public.cells 
    WHERE id = target_cell_id AND supervisor_id = auth.uid()
  ) INTO is_supervisor;
  
  IF is_supervisor AND user_role IN ('supervisor', 'pastor') THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is supervisor of any parent cell (hierarchical check)
  IF user_role IN ('supervisor', 'pastor') THEN
    RETURN EXISTS(
      WITH RECURSIVE cell_hierarchy AS (
        SELECT id, parent_id, supervisor_id, leader_id
        FROM public.cells
        WHERE id = target_cell_id
        
        UNION ALL
        
        SELECT c.id, c.parent_id, c.supervisor_id, c.leader_id
        FROM public.cells c
        INNER JOIN cell_hierarchy ch ON ch.parent_id = c.id
      )
      SELECT 1 FROM cell_hierarchy
      WHERE supervisor_id = auth.uid() OR leader_id = auth.uid()
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION TO CHECK PROFILE PERMISSIONS
CREATE OR REPLACE FUNCTION public.can_access_profile(target_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role public.user_role;
  user_church_id UUID;
  target_church_id UUID;
BEGIN
  -- Get current user info
  SELECT role, church_id INTO user_role, user_church_id
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Get target profile church
  SELECT church_id INTO target_church_id
  FROM public.profiles
  WHERE id = target_profile_id;
  
  -- Must be same church
  IF user_church_id != target_church_id THEN
    RETURN FALSE;
  END IF;
  
  -- Can always access own profile
  IF target_profile_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- Pastor can access all profiles in church
  IF user_role = 'pastor' THEN
    RETURN TRUE;
  END IF;
  
  -- Supervisors can access profiles in their network
  IF user_role = 'supervisor' THEN
    RETURN EXISTS(
      SELECT 1 FROM public.cell_members cm
      JOIN public.cells c ON cm.cell_id = c.id
      WHERE cm.profile_id = target_profile_id
      AND c.supervisor_id = auth.uid()
    );
  END IF;
  
  -- Leaders can access profiles in their cell
  IF user_role = 'leader' THEN
    RETURN EXISTS(
      SELECT 1 FROM public.cell_members cm
      JOIN public.cells c ON cm.cell_id = c.id
      WHERE cm.profile_id = target_profile_id
      AND c.leader_id = auth.uid()
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cells_supervisor_id ON public.cells(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_cells_leader_church ON public.cells(leader_id, church_id);
CREATE INDEX IF NOT EXISTS idx_profiles_church_role ON public.profiles(church_id, role);
CREATE INDEX IF NOT EXISTS idx_cell_members_profile_cell ON public.cell_members(profile_id, cell_id);

-- Add comments
COMMENT ON FUNCTION public.can_access_cell IS 'Check if current user can access a specific cell based on G12 hierarchy';
COMMENT ON FUNCTION public.can_access_profile IS 'Check if current user can access a specific profile based on G12 hierarchy';
COMMENT ON POLICY "Supervisors can manage members in their network" ON public.cell_members IS 'Allows supervisors and pastors to manage members in their hierarchical network';
COMMENT ON POLICY "Leaders can update their own cell" ON public.cells IS 'Allows cell leaders to update their own cell information';
COMMENT ON POLICY "Supervisors can update cells in their network" ON public.cells IS 'Allows supervisors and pastors to update cells in their network';