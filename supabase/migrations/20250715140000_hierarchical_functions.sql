-- Hierarchical Functions for G12 Cell Management
-- This migration adds PostgreSQL functions to efficiently query hierarchical data

-- Function to get all descendants of a cell (children, grandchildren, etc.)
CREATE OR REPLACE FUNCTION public.get_cell_descendants(
  cell_id UUID,
  max_depth INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  name TEXT,
  leader_id UUID,
  leader_name TEXT,
  supervisor_id UUID,
  supervisor_name TEXT,
  level INTEGER,
  path TEXT[],
  member_count BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE cell_tree AS (
    -- Base case: start with the specified cell
    SELECT 
      c.id,
      c.parent_id,
      c.name,
      c.leader_id,
      lp.full_name as leader_name,
      c.supervisor_id,
      sp.full_name as supervisor_name,
      0 as level,
      ARRAY[c.name] as path,
      c.created_at
    FROM public.cells c
    LEFT JOIN public.profiles lp ON c.leader_id = lp.id
    LEFT JOIN public.profiles sp ON c.supervisor_id = sp.id
    WHERE c.id = get_cell_descendants.cell_id
    AND c.church_id = public.get_my_church_id()
    
    UNION ALL
    
    -- Recursive case: find children
    SELECT 
      c.id,
      c.parent_id,
      c.name,
      c.leader_id,
      lp.full_name as leader_name,
      c.supervisor_id,
      sp.full_name as supervisor_name,
      ct.level + 1,
      ct.path || c.name,
      c.created_at
    FROM public.cells c
    LEFT JOIN public.profiles lp ON c.leader_id = lp.id
    LEFT JOIN public.profiles sp ON c.supervisor_id = sp.id
    JOIN cell_tree ct ON c.parent_id = ct.id
    WHERE ct.level < max_depth
    AND c.church_id = public.get_my_church_id()
  )
  SELECT 
    ct.id,
    ct.parent_id,
    ct.name,
    ct.leader_id,
    ct.leader_name,
    ct.supervisor_id,
    ct.supervisor_name,
    ct.level,
    ct.path,
    COALESCE(member_counts.member_count, 0) as member_count,
    ct.created_at
  FROM cell_tree ct
  LEFT JOIN (
    SELECT 
      cm.cell_id,
      COUNT(*) as member_count
    FROM public.cell_members cm
    GROUP BY cm.cell_id
  ) member_counts ON ct.id = member_counts.cell_id
  ORDER BY ct.level, ct.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all ancestors of a cell (parent, grandparent, etc.)
CREATE OR REPLACE FUNCTION public.get_cell_ancestors(
  cell_id UUID,
  max_depth INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  name TEXT,
  leader_id UUID,
  leader_name TEXT,
  supervisor_id UUID,
  supervisor_name TEXT,
  level INTEGER,
  path TEXT[],
  member_count BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE cell_tree AS (
    -- Base case: start with the specified cell
    SELECT 
      c.id,
      c.parent_id,
      c.name,
      c.leader_id,
      lp.full_name as leader_name,
      c.supervisor_id,
      sp.full_name as supervisor_name,
      0 as level,
      ARRAY[c.name] as path,
      c.created_at
    FROM public.cells c
    LEFT JOIN public.profiles lp ON c.leader_id = lp.id
    LEFT JOIN public.profiles sp ON c.supervisor_id = sp.id
    WHERE c.id = get_cell_ancestors.cell_id
    AND c.church_id = public.get_my_church_id()
    
    UNION ALL
    
    -- Recursive case: find parents
    SELECT 
      c.id,
      c.parent_id,
      c.name,
      c.leader_id,
      lp.full_name as leader_name,
      c.supervisor_id,
      sp.full_name as supervisor_name,
      ct.level + 1,
      ARRAY[c.name] || ct.path,
      c.created_at
    FROM public.cells c
    LEFT JOIN public.profiles lp ON c.leader_id = lp.id
    LEFT JOIN public.profiles sp ON c.supervisor_id = sp.id
    JOIN cell_tree ct ON c.id = ct.parent_id
    WHERE ct.level < max_depth
    AND c.church_id = public.get_my_church_id()
  )
  SELECT 
    ct.id,
    ct.parent_id,
    ct.name,
    ct.leader_id,
    ct.leader_name,
    ct.supervisor_id,
    ct.supervisor_name,
    ct.level,
    ct.path,
    COALESCE(member_counts.member_count, 0) as member_count,
    ct.created_at
  FROM cell_tree ct
  LEFT JOIN (
    SELECT 
      cm.cell_id,
      COUNT(*) as member_count
    FROM public.cell_members cm
    GROUP BY cm.cell_id
  ) member_counts ON ct.id = member_counts.cell_id
  ORDER BY ct.level DESC, ct.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cell network for a specific leader (all cells under their supervision)
CREATE OR REPLACE FUNCTION public.get_leader_network(
  leader_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  name TEXT,
  leader_id UUID,
  leader_name TEXT,
  supervisor_id UUID,
  supervisor_name TEXT,
  level INTEGER,
  member_count BIGINT,
  timoteo_count BIGINT,
  avg_ladder_score NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  target_leader_id UUID;
BEGIN
  -- Use provided leader_id or current user
  target_leader_id := COALESCE(get_leader_network.leader_id, auth.uid());
  
  RETURN QUERY
  WITH RECURSIVE network_tree AS (
    -- Base case: cells where user is leader or supervisor
    SELECT 
      c.id,
      c.parent_id,
      c.name,
      c.leader_id,
      lp.full_name as leader_name,
      c.supervisor_id,
      sp.full_name as supervisor_name,
      0 as level,
      c.created_at
    FROM public.cells c
    LEFT JOIN public.profiles lp ON c.leader_id = lp.id
    LEFT JOIN public.profiles sp ON c.supervisor_id = sp.id
    WHERE (c.leader_id = target_leader_id OR c.supervisor_id = target_leader_id)
    AND c.church_id = public.get_my_church_id()
    
    UNION ALL
    
    -- Recursive case: find all descendant cells
    SELECT 
      c.id,
      c.parent_id,
      c.name,
      c.leader_id,
      lp.full_name as leader_name,
      c.supervisor_id,
      sp.full_name as supervisor_name,
      nt.level + 1,
      c.created_at
    FROM public.cells c
    LEFT JOIN public.profiles lp ON c.leader_id = lp.id
    LEFT JOIN public.profiles sp ON c.supervisor_id = sp.id
    JOIN network_tree nt ON c.parent_id = nt.id
    WHERE c.church_id = public.get_my_church_id()
  )
  SELECT 
    nt.id,
    nt.parent_id,
    nt.name,
    nt.leader_id,
    nt.leader_name,
    nt.supervisor_id,
    nt.supervisor_name,
    nt.level,
    COALESCE(stats.member_count, 0) as member_count,
    COALESCE(stats.timoteo_count, 0) as timoteo_count,
    COALESCE(stats.avg_ladder_score, 0) as avg_ladder_score,
    nt.created_at
  FROM network_tree nt
  LEFT JOIN (
    SELECT 
      cm.cell_id,
      COUNT(*) as member_count,
      COUNT(*) FILTER (WHERE cm.is_timoteo = true) as timoteo_count,
      AVG(cm.success_ladder_score) as avg_ladder_score
    FROM public.cell_members cm
    GROUP BY cm.cell_id
  ) stats ON nt.id = stats.cell_id
  ORDER BY nt.level, nt.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cells ready for multiplication
CREATE OR REPLACE FUNCTION public.get_cells_ready_for_multiplication(
  min_members INTEGER DEFAULT 12,
  min_timoteos INTEGER DEFAULT 1,
  min_avg_score INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  leader_id UUID,
  leader_name TEXT,
  member_count BIGINT,
  timoteo_count BIGINT,
  avg_ladder_score NUMERIC,
  multiplication_readiness_score INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.leader_id,
    lp.full_name as leader_name,
    stats.member_count,
    stats.timoteo_count,
    stats.avg_ladder_score,
    (
      CASE 
        WHEN stats.member_count >= min_members THEN 40
        WHEN stats.member_count >= (min_members * 0.8) THEN 30
        WHEN stats.member_count >= (min_members * 0.6) THEN 20
        ELSE 10
      END +
      CASE 
        WHEN stats.timoteo_count >= min_timoteos THEN 30
        WHEN stats.timoteo_count >= (min_timoteos * 0.5) THEN 20
        ELSE 10
      END +
      CASE 
        WHEN stats.avg_ladder_score >= min_avg_score THEN 30
        WHEN stats.avg_ladder_score >= (min_avg_score * 0.8) THEN 20
        ELSE 10
      END
    ) as multiplication_readiness_score,
    c.created_at
  FROM public.cells c
  LEFT JOIN public.profiles lp ON c.leader_id = lp.id
  LEFT JOIN (
    SELECT 
      cm.cell_id,
      COUNT(*) as member_count,
      COUNT(*) FILTER (WHERE cm.is_timoteo = true) as timoteo_count,
      AVG(cm.success_ladder_score) as avg_ladder_score
    FROM public.cell_members cm
    GROUP BY cm.cell_id
  ) stats ON c.id = stats.cell_id
  WHERE c.church_id = public.get_my_church_id()
  AND stats.member_count >= (min_members * 0.6) -- At least 60% of minimum members
  AND stats.timoteo_count >= 1 -- At least 1 timoteo
  ORDER BY multiplication_readiness_score DESC, stats.member_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get member statistics for dashboard
CREATE OR REPLACE FUNCTION public.get_member_statistics()
RETURNS TABLE (
  total_members BIGINT,
  total_timoteos BIGINT,
  avg_ladder_score NUMERIC,
  members_by_score JSONB,
  recent_additions BIGINT,
  retention_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE cm.is_timoteo = true) as total_timoteos,
    AVG(cm.success_ladder_score) as avg_ladder_score,
    jsonb_build_object(
      'score_0_25', COUNT(*) FILTER (WHERE cm.success_ladder_score BETWEEN 0 AND 25),
      'score_26_50', COUNT(*) FILTER (WHERE cm.success_ladder_score BETWEEN 26 AND 50),
      'score_51_75', COUNT(*) FILTER (WHERE cm.success_ladder_score BETWEEN 51 AND 75),
      'score_76_100', COUNT(*) FILTER (WHERE cm.success_ladder_score BETWEEN 76 AND 100)
    ) as members_by_score,
    COUNT(*) FILTER (WHERE cm.joined_at >= CURRENT_DATE - INTERVAL '30 days') as recent_additions,
    (
      COUNT(*) FILTER (WHERE cm.joined_at <= CURRENT_DATE - INTERVAL '90 days')::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE cm.joined_at <= CURRENT_DATE - INTERVAL '120 days'), 0) * 100
    ) as retention_rate
  FROM public.cell_members cm
  JOIN public.cells c ON cm.cell_id = c.id
  WHERE c.church_id = public.get_my_church_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cells_parent_church ON public.cells(parent_id, church_id);
CREATE INDEX IF NOT EXISTS idx_cell_members_joined_at ON public.cell_members(joined_at);
CREATE INDEX IF NOT EXISTS idx_cell_members_score ON public.cell_members(success_ladder_score);
CREATE INDEX IF NOT EXISTS idx_cell_members_timoteo ON public.cell_members(is_timoteo);

-- Add comments
COMMENT ON FUNCTION public.get_cell_descendants IS 'Get all descendant cells (children, grandchildren, etc.) of a specific cell';
COMMENT ON FUNCTION public.get_cell_ancestors IS 'Get all ancestor cells (parent, grandparent, etc.) of a specific cell';
COMMENT ON FUNCTION public.get_leader_network IS 'Get all cells under a leaders supervision (their network)';
COMMENT ON FUNCTION public.get_cells_ready_for_multiplication IS 'Get cells that are ready for multiplication based on membership, timoteos, and ladder scores';
COMMENT ON FUNCTION public.get_member_statistics IS 'Get comprehensive member statistics for dashboard display';