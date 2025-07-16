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

    // Get member badges using the database function
    const { data: badges, error } = await supabase.rpc('get_member_badges', {
      member_id: memberId
    });

    if (error) {
      console.error('Error fetching member badges:', error);
      return NextResponse.json(
        { error: 'Failed to fetch member badges' },
        { status: 500 }
      );
    }

    return NextResponse.json({ badges });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const memberId = params.id;
    const body = await request.json();

    const { badge_id, reason } = body;

    if (!memberId || !badge_id) {
      return NextResponse.json(
        { error: 'Member ID and Badge ID are required' },
        { status: 400 }
      );
    }

    // Get current user ID for the awarded_by field
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Award badge to member using the database function
    const { data: success, error } = await supabase.rpc('award_badge_to_member', {
      member_id: memberId,
      badge_id: badge_id,
      awarded_by: user.id,
      reason: reason || null
    });

    if (error) {
      console.error('Error awarding badge:', error);
      return NextResponse.json(
        { error: 'Failed to award badge' },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Member already has this badge' },
        { status: 409 }
      );
    }

    return NextResponse.json({ 
      message: 'Badge awarded successfully',
      success: true 
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}