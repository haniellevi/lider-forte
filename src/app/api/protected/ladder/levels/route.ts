import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get all active ladder levels
    const { data: levels, error } = await supabase
      .from('ladder_levels')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching ladder levels:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ladder levels' },
        { status: 500 }
      );
    }

    return NextResponse.json({ levels });
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
      min_points,
      max_points,
      color,
      icon,
      description,
      unlocks_features,
      order_index
    } = body;

    // Validate required fields
    if (!name || min_points === undefined || max_points === undefined || !color || order_index === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new ladder level
    const { data: level, error } = await supabase
      .from('ladder_levels')
      .insert({
        name,
        min_points,
        max_points,
        color,
        icon,
        description,
        unlocks_features,
        order_index
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ladder level:', error);
      return NextResponse.json(
        { error: 'Failed to create ladder level' },
        { status: 500 }
      );
    }

    return NextResponse.json({ level }, { status: 201 });
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
        { error: 'Level ID is required' },
        { status: 400 }
      );
    }

    // Update ladder level
    const { data: level, error } = await supabase
      .from('ladder_levels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ladder level:', error);
      return NextResponse.json(
        { error: 'Failed to update ladder level' },
        { status: 500 }
      );
    }

    return NextResponse.json({ level });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}