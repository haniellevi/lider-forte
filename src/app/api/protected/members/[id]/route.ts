import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const MemberUpdateSchema = z.object({
  success_ladder_score: z.number().int().min(0).optional(),
  is_timoteo: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const resolvedParams = await params;
    
    const { data, error } = await supabase
      .from('cell_members')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, role),
        cell:cells(
          id, 
          name, 
          leader_id,
          leader:profiles!cells_leader_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar membro' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const resolvedParams = await params;
    
    const validatedData = MemberUpdateSchema.parse(body);
    
    const updateData: any = {};
    
    if (validatedData.success_ladder_score !== undefined) {
      updateData.success_ladder_score = validatedData.success_ladder_score;
    }
    
    if (validatedData.is_timoteo !== undefined) {
      updateData.is_timoteo = validatedData.is_timoteo;
    }

    const { data, error } = await supabase
      .from('cell_members')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, role),
        cell:cells(
          id, 
          name, 
          leader_id,
          leader:profiles!cells_leader_id_fkey(id, full_name, avatar_url)
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
      }
      
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }
      
      return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const resolvedParams = await params;
    
    const { error } = await supabase
      .from('cell_members')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
      }
      
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }
      
      return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}