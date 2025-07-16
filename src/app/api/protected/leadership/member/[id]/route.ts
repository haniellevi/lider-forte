import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: memberId } = await params;

    // Check if user has permission to view this member's data
    // Leaders can view their cell members, supervisors and pastors can view all
    let hasPermission = false;

    if (['supervisor', 'pastor'].includes(profile.role)) {
      hasPermission = true;
    } else if (profile.role === 'leader') {
      // Check if the member is in the leader's cell
      const { data: cellMember } = await supabase
        .from('cell_members')
        .select(`
          cells!inner (
            leader_id
          )
        `)
        .eq('profile_id', memberId)
        .single();

      hasPermission = (cellMember?.cells as any)?.leader_id === user.id;
    } else if (user.id === memberId) {
      // Users can view their own data
      hasPermission = true;
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get member's leadership profile using the database function
    const { data: leadershipProfile, error: profileDataError } = await supabase
      .rpc('get_member_leadership_profile', { member_id: memberId });

    if (profileDataError) {
      console.error('Error fetching leadership profile:', profileDataError);
      return NextResponse.json({ error: 'Failed to fetch leadership profile' }, { status: 500 });
    }

    if (!leadershipProfile || leadershipProfile.length === 0) {
      // If no pipeline data exists, calculate it
      const { data: calculatedData, error: calcError } = await supabase
        .rpc('calculate_leadership_score', { member_id: memberId });

      if (calcError) {
        console.error('Error calculating leadership score:', calcError);
        return NextResponse.json({ error: 'Failed to calculate leadership score' }, { status: 500 });
      }

      if (!calculatedData || calculatedData.length === 0) {
        return NextResponse.json({ error: 'Member not found or no data available' }, { status: 404 });
      }

      // Return calculated data (not yet saved to pipeline)
      const calculated = calculatedData[0];
      
      // Get basic member info
      const { data: memberInfo } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('id', memberId)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          profile_id: memberId,
          full_name: memberInfo?.full_name || 'Unknown',
          leadership_score: calculated.leadership_score,
          potential_level: calculated.potential_level,
          confidence_score: calculated.confidence_score,
          factors: calculated.factors,
          recommendations: calculated.recommendations,
          assessment_count: 0,
          last_calculated_at: new Date().toISOString(),
          is_calculated: true, // Flag to indicate this is a real-time calculation
          member_info: memberInfo
        }
      });
    }

    const memberData = leadershipProfile[0];

    // Get additional member information
    const { data: memberInfo, error: memberInfoError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        avatar_url,
        created_at
      `)
      .eq('id', memberId)
      .single();

    if (memberInfoError) {
      console.error('Error fetching member info:', memberInfoError);
      return NextResponse.json({ error: 'Failed to fetch member information' }, { status: 500 });
    }

    // Get cell information
    const { data: cellData } = await supabase
      .from('cell_members')
      .select(`
        joined_at,
        success_ladder_score,
        is_timoteo,
        cells (
          id,
          name,
          leader_id,
          profiles!cells_leader_id_fkey (
            full_name
          )
        )
      `)
      .eq('profile_id', memberId)
      .single();

    // Get recent assessments
    const { data: recentAssessments } = await supabase
      .from('leadership_assessments')
      .select(`
        id,
        assessment_type,
        scores,
        comments,
        assessment_date,
        is_validated,
        profiles!leadership_assessments_assessor_id_fkey (
          full_name
        )
      `)
      .eq('profile_id', memberId)
      .order('assessment_date', { ascending: false })
      .limit(5);

    // Get activity history for the last 3 months
    const { data: activityHistory } = await supabase
      .from('member_activity_log')
      .select(`
        activity_date,
        points_earned,
        success_ladder_activities (
          name,
          category
        )
      `)
      .eq('profile_id', memberId)
      .gte('activity_date', new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 3 months
      .order('activity_date', { ascending: false })
      .limit(20);

    // Calculate growth trend
    const growthTrend = activityHistory?.reduce((acc, activity) => {
      const month = activity.activity_date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + activity.points_earned;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      success: true,
      data: {
        ...memberData,
        member_info: memberInfo,
        cell: cellData?.cells || null,
        cell_membership: cellData ? {
          joined_at: cellData.joined_at,
          success_ladder_score: cellData.success_ladder_score,
          is_timoteo: cellData.is_timoteo
        } : null,
        recent_assessments: recentAssessments || [],
        activity_history: activityHistory || [],
        growth_trend: growthTrend,
        is_calculated: false // This is saved pipeline data
      }
    });

  } catch (error) {
    console.error('Unexpected error in member leadership profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user has permission to trigger recalculation
    if (!['leader', 'supervisor', 'pastor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: memberId } = await params;

    // Calculate leadership score for the specific member
    const { data: calculatedData, error: calcError } = await supabase
      .rpc('calculate_leadership_score', { member_id: memberId });

    if (calcError) {
      console.error('Error calculating leadership score:', calcError);
      return NextResponse.json({ error: 'Failed to calculate leadership score' }, { status: 500 });
    }

    if (!calculatedData || calculatedData.length === 0) {
      return NextResponse.json({ error: 'Failed to calculate score for member' }, { status: 404 });
    }

    const calculated = calculatedData[0];

    // Get member's church_id
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', memberId)
      .single();

    if (!memberProfile) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Update or insert into pipeline
    const { data: updated, error: updateError } = await supabase
      .from('leadership_pipeline')
      .upsert({
        profile_id: memberId,
        church_id: memberProfile.church_id,
        leadership_score: calculated.leadership_score,
        confidence_score: calculated.confidence_score,
        factors: calculated.factors,
        potential_level: calculated.potential_level,
        recommendations: calculated.recommendations,
        last_calculated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (updateError) {
      console.error('Error updating leadership pipeline:', updateError);
      return NextResponse.json({ error: 'Failed to update pipeline' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...calculated,
        profile_id: memberId,
        last_calculated_at: updated.last_calculated_at,
        message: 'Leadership score recalculated successfully'
      }
    });

  } catch (error) {
    console.error('Unexpected error in member score recalculation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}