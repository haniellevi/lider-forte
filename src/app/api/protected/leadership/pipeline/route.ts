import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // Check if user has permission to view leadership pipeline
    if (!['leader', 'supervisor', 'pastor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const potentialLevel = searchParams.get('potential_level');
    const minScore = parseFloat(searchParams.get('min_score') || '0');

    // Build query
    let query = supabase
      .from('leadership_pipeline')
      .select(`
        profile_id,
        leadership_score,
        potential_level,
        confidence_score,
        last_calculated_at,
        recommendations,
        factors,
        profiles!inner (
          id,
          full_name,
          role,
          avatar_url
        )
      `)
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .gte('leadership_score', minScore)
      .order('leadership_score', { ascending: false })
      .limit(limit);

    // Add potential level filter if specified
    if (potentialLevel) {
      query = query.eq('potential_level', potentialLevel);
    }

    const { data: pipeline, error: pipelineError } = await query;

    if (pipelineError) {
      console.error('Error fetching leadership pipeline:', pipelineError);
      return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 });
    }

    // Get additional data for each member
    const enrichedPipeline = await Promise.all(
      pipeline.map(async (member) => {
        // Get cell information
        const { data: cellMember } = await supabase
          .from('cell_members')
          .select(`
            success_ladder_score,
            cells (
              id,
              name
            )
          `)
          .eq('profile_id', member.profile_id)
          .single();

        // Get recent assessments count
        const { count: assessmentCount } = await supabase
          .from('leadership_assessments')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', member.profile_id)
          .eq('is_validated', true)
          .gte('assessment_date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 6 months

        return {
          ...member,
          cell: cellMember?.cells || null,
          success_ladder_score: cellMember?.success_ladder_score || 0,
          assessment_count: assessmentCount || 0
        };
      })
    );

    // Get summary statistics
    const { data: stats } = await supabase
      .from('leadership_pipeline')
      .select('potential_level')
      .eq('church_id', profile.church_id)
      .eq('is_active', true);

    const summary = {
      total: stats?.length || 0,
      by_level: stats?.reduce((acc, item) => {
        acc[item.potential_level] = (acc[item.potential_level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    return NextResponse.json({
      success: true,
      data: {
        pipeline: enrichedPipeline,
        summary,
        total: enrichedPipeline.length
      }
    });

  } catch (error) {
    console.error('Unexpected error in leadership pipeline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's church_id and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // Check if user has permission to recalculate pipeline
    if (!['supervisor', 'pastor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Trigger recalculation for the church
    const { data: result, error: recalcError } = await supabase
      .rpc('recalculate_church_leadership_scores', {
        church_id: profile.church_id
      });

    if (recalcError) {
      console.error('Error recalculating leadership scores:', recalcError);
      return NextResponse.json({ error: 'Failed to recalculate scores' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        updated_count: result,
        message: `Successfully recalculated ${result} leadership scores`
      }
    });

  } catch (error) {
    console.error('Unexpected error in leadership recalculation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}