import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');

    let query = supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);

    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }

    if (rarity) {
      query = query.eq('rarity', rarity);
    }

    const { data: badges, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching badges:', error);
      return NextResponse.json(
        { error: 'Failed to fetch badges' },
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const {
      name,
      description,
      icon,
      category,
      criteria,
      points_required,
      rarity
    } = body;

    // Validate required fields
    if (!name || !description || !icon || !category || !criteria) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new badge
    const { data: badge, error } = await supabase
      .from('badges')
      .insert({
        name,
        description,
        icon,
        category,
        criteria,
        points_required,
        rarity: rarity || 'common'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating badge:', error);
      return NextResponse.json(
        { error: 'Failed to create badge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ badge }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Badge ID is required' },
        { status: 400 }
      );
    }

    // Update badge
    const { data: badge, error } = await supabase
      .from('badges')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating badge:', error);
      return NextResponse.json(
        { error: 'Failed to update badge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ badge });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Badge ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - set as inactive
    const { error } = await supabase
      .from('badges')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting badge:', error);
      return NextResponse.json(
        { error: 'Failed to delete badge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Badge deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}