import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CellUpdateSchema = z.object({
  name: z.string().min(1, 'Nome da célula é obrigatório').optional(),
  leader_id: z.string().uuid('ID do líder deve ser um UUID válido').optional(),
  supervisor_id: z.string().uuid('ID do supervisor deve ser um UUID válido').optional(),
  parent_id: z.string().uuid('ID da célula pai deve ser um UUID válido').optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('Brasil'),
  }).optional(),
  meeting_day: z.number().int().min(0).max(6).optional(),
  meeting_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário deve estar no formato HH:MM').optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('cells')
      .select(`
        *,
        leader:profiles!cells_leader_id_fkey(id, full_name, avatar_url),
        supervisor:profiles!cells_supervisor_id_fkey(id, full_name, avatar_url),
        parent_cell:cells!cells_parent_id_fkey(id, name),
        members:cell_members(
          id,
          joined_at,
          success_ladder_score,
          is_timoteo,
          profile:profiles(id, full_name, avatar_url)
        ),
        child_cells:cells!cells_parent_id_fkey(id, name, created_at)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Célula não encontrada' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar célula' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    
    const validatedData = CellUpdateSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para atualizar a célula
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Se está mudando o líder, verificar se pertence à mesma igreja
    if (validatedData.leader_id) {
      const { data: leaderProfile, error: leaderError } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', validatedData.leader_id)
        .single();

      if (leaderError || !leaderProfile) {
        return NextResponse.json({ error: 'Líder não encontrado' }, { status: 400 });
      }

      if (leaderProfile.church_id !== userProfile.church_id) {
        return NextResponse.json({ error: 'Líder deve pertencer à mesma igreja' }, { status: 400 });
      }
    }

    const updateData: any = {};
    
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.leader_id) updateData.leader_id = validatedData.leader_id;
    if (validatedData.supervisor_id !== undefined) updateData.supervisor_id = validatedData.supervisor_id;
    if (validatedData.parent_id !== undefined) updateData.parent_id = validatedData.parent_id;
    if (validatedData.address) updateData.address = validatedData.address;
    if (validatedData.meeting_day !== undefined) updateData.meeting_day = validatedData.meeting_day;
    if (validatedData.meeting_time !== undefined) updateData.meeting_time = validatedData.meeting_time;

    const { data, error } = await supabase
      .from('cells')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        leader:profiles!cells_leader_id_fkey(id, full_name, avatar_url),
        supervisor:profiles!cells_supervisor_id_fkey(id, full_name, avatar_url),
        parent_cell:cells!cells_parent_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Célula não encontrada' }, { status: 404 });
      }
      
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }
      
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Líder, supervisor ou célula pai não encontrados' }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Erro ao atualizar célula' }, { status: 500 });
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    // Verificar se a célula tem células filhas
    const { data: childCells, error: childError } = await supabase
      .from('cells')
      .select('id')
      .eq('parent_id', params.id)
      .limit(1);

    if (childError) {
      console.error('Error checking child cells:', childError);
      return NextResponse.json({ error: 'Erro ao verificar células filhas' }, { status: 500 });
    }

    if (childCells && childCells.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir célula que possui células filhas' 
      }, { status: 409 });
    }

    // Verificar se a célula tem membros
    const { data: members, error: membersError } = await supabase
      .from('cell_members')
      .select('id')
      .eq('cell_id', params.id)
      .limit(1);

    if (membersError) {
      console.error('Error checking members:', membersError);
      return NextResponse.json({ error: 'Erro ao verificar membros' }, { status: 500 });
    }

    if (members && members.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir célula que possui membros' 
      }, { status: 409 });
    }

    const { error } = await supabase
      .from('cells')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Célula não encontrada' }, { status: 404 });
      }
      
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }
      
      return NextResponse.json({ error: 'Erro ao excluir célula' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Célula excluída com sucesso' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}