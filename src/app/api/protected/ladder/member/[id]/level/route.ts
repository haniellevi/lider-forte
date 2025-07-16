import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const memberId = params.id;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Get member's current score from cell_members table
    const { data: memberData, error: memberError } = await supabase
      .from('cell_members')
      .select('success_ladder_score')
      .eq('profile_id', memberId)
      .single();

    if (memberError) {
      console.error('Error fetching member score:', memberError);
      return NextResponse.json(
        { error: 'Failed to fetch member data' },
        { status: 500 }
      );
    }

    const score = memberData?.success_ladder_score || 0;

    // Get member's current level using the database function
    const { data: levelData, error: levelError } = await supabase.rpc('get_member_level', {
      member_score: score
    });

    if (levelError) {
      console.error('Error fetching member level:', levelError);
      return NextResponse.json(
        { error: 'Failed to fetch member level' },
        { status: 500 }
      );
    }

    const level = levelData && levelData.length > 0 ? levelData[0] : null;

    if (!level) {
      return NextResponse.json(
        { error: 'No level found for member score' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      member_id: memberId,
      current_score: score,
      level: {
        id: level.level_id,
        name: level.name,
        color: level.color,
        icon: level.icon,
        description: level.description,
        progress_percentage: Math.round(level.progress_percentage * 100) / 100,
        points_to_next: level.points_to_next
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}