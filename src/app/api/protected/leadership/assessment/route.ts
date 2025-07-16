import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

    // Parse request body
    const body = await request.json();
    const {
      profile_id,
      assessment_type,
      scores,
      comments
    } = body;

    // Validate required fields
    if (!profile_id || !scores || typeof scores !== 'object') {
      return NextResponse.json({ 
        error: 'Missing required fields: profile_id, scores' 
      }, { status: 400 });
    }

    // Validate scores object
    const validScoreFields = [
      'leadership', 'communication', 'reliability', 'initiative', 
      'teamwork', 'spiritual_growth', 'service_heart', 'teaching_ability'
    ];
    
    const scoreValues = Object.values(scores);
    if (scoreValues.some(score => typeof score !== 'number' || score < 1 || score > 10)) {
      return NextResponse.json({ 
        error: 'All scores must be numbers between 1 and 10' 
      }, { status: 400 });
    }

    // Check if user has permission to assess this member
    let hasPermission = false;

    if (['supervisor', 'pastor'].includes(profile.role)) {
      // Supervisors and pastors can assess anyone in their church
      const { data: targetMember } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', profile_id)
        .single();

      hasPermission = targetMember?.church_id === profile.church_id;
    } else if (profile.role === 'leader') {
      // Leaders can assess members in their cells
      const { data: cellMember } = await supabase
        .from('cell_members')
        .select(`
          cells!inner (
            leader_id
          )
        `)
        .eq('profile_id', profile_id)
        .single();

      hasPermission = cellMember?.cells?.leader_id === user.id;
    } else if (assessment_type === 'self_assessment' && profile_id === user.id) {
      // Users can perform self-assessments
      hasPermission = true;
    } else if (assessment_type === 'peer_review') {
      // Peer reviews: check if both are in the same church
      const { data: targetMember } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', profile_id)
        .single();

      hasPermission = targetMember?.church_id === profile.church_id;
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions to assess this member' }, { status: 403 });
    }

    // Check for duplicate assessments (one assessment per assessor per member per month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: existingAssessment } = await supabase
      .from('leadership_assessments')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('assessor_id', user.id)
      .eq('assessment_type', assessment_type || 'supervisor_feedback')
      .gte('assessment_date', oneMonthAgo.toISOString())
      .single();

    if (existingAssessment) {
      return NextResponse.json({ 
        error: 'You have already submitted an assessment for this member this month' 
      }, { status: 409 });
    }

    // Create the assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('leadership_assessments')
      .insert({
        profile_id,
        assessor_id: user.id,
        church_id: profile.church_id,
        assessment_type: assessment_type || 'supervisor_feedback',
        scores,
        comments: comments || null,
        assessment_date: new Date().toISOString(),
        is_validated: ['supervisor', 'pastor'].includes(profile.role) // Auto-validate if assessor is supervisor/pastor
      })
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
      .single();

    if (assessmentError) {
      console.error('Error creating assessment:', assessmentError);
      return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
    }

    // Trigger leadership score recalculation for the assessed member
    try {
      const { error: recalcError } = await supabase
        .rpc('calculate_leadership_score', { member_id: profile_id });
      
      if (recalcError) {
        console.warn('Warning: Could not trigger leadership score recalculation:', recalcError);
        // Don't fail the assessment creation if recalculation fails
      }
    } catch (recalcError) {
      console.warn('Warning: Error during leadership score recalculation:', recalcError);
    }

    return NextResponse.json({
      success: true,
      data: {
        assessment,
        message: 'Assessment submitted successfully'
      }
    });

  } catch (error) {
    console.error('Unexpected error in assessment submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');
    const assessmentType = searchParams.get('assessment_type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const onlyValidated = searchParams.get('validated') === 'true';

    // Build query
    let query = supabase
      .from('leadership_assessments')
      .select(`
        id,
        profile_id,
        assessment_type,
        scores,
        comments,
        assessment_date,
        is_validated,
        profiles!leadership_assessments_profile_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        assessor:profiles!leadership_assessments_assessor_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('church_id', profile.church_id)
      .order('assessment_date', { ascending: false })
      .limit(limit);

    // Add filters
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    if (assessmentType) {
      query = query.eq('assessment_type', assessmentType);
    }

    if (onlyValidated) {
      query = query.eq('is_validated', true);
    }

    // Check permissions for viewing assessments
    if (!['supervisor', 'pastor'].includes(profile.role)) {
      // Non-supervisors can only see their own assessments (given or received)
      query = query.or(`assessor_id.eq.${user.id},profile_id.eq.${user.id}`);
    }

    const { data: assessments, error: assessmentsError } = await query;

    if (assessmentsError) {
      console.error('Error fetching assessments:', assessmentsError);
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
    }

    // Get summary statistics if no specific profile is requested
    let summary = null;
    if (!profileId && ['supervisor', 'pastor'].includes(profile.role)) {
      const { data: stats } = await supabase
        .from('leadership_assessments')
        .select('assessment_type, is_validated')
        .eq('church_id', profile.church_id);

      summary = {
        total: stats?.length || 0,
        validated: stats?.filter(s => s.is_validated).length || 0,
        pending: stats?.filter(s => !s.is_validated).length || 0,
        by_type: stats?.reduce((acc, item) => {
          acc[item.assessment_type] = (acc[item.assessment_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        assessments: assessments || [],
        summary,
        total: assessments?.length || 0
      }
    });

  } catch (error) {
    console.error('Unexpected error in assessment retrieval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}