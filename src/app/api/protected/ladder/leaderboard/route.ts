import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const church_id = searchParams.get('church_id');

    // Get current user's church if not provided
    let targetChurchId = church_id;
    if (!targetChurchId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();

      targetChurchId = profile?.church_id;
    }

    if (!targetChurchId) {
      return NextResponse.json(
        { error: 'Church ID is required' },
        { status: 400 }
      );
    }

    // Get church leaderboard with levels using the database function
    const { data: leaderboard, error } = await supabase.rpc('get_church_leaderboard_with_levels', {
      church_id: targetChurchId,
      limit_count: limit
    });

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Get additional member data (avatars, etc.)
    const memberIds = leaderboard?.map((member: any) => member.profile_id) || [];
    
    let profiles: any[] = [];
    if (memberIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', memberIds);

      if (!profilesError) {
        profiles = profilesData || [];
      }
    }

    // Merge profile data with leaderboard
    const enrichedLeaderboard = leaderboard?.map((member: any) => {
      const profile = profiles.find(p => p.id === member.profile_id);
      return {
        ...member,
        avatar_url: profile?.avatar_url || null
      };
    }) || [];

    return NextResponse.json({
      leaderboard: enrichedLeaderboard,
      total_members: enrichedLeaderboard.length,
      church_id: targetChurchId
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}