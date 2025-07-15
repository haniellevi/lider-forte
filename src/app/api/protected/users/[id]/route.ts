import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { 
  cpfSchema, 
  phoneSchema, 
  addressSchema 
} from '@/lib/validations/brazilian';

// Schema para atualização de usuário
const UserUpdateSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  phone: phoneSchema.optional(),
  cpf: cpfSchema.optional(),
  role: z.enum(['pastor', 'supervisor', 'leader', 'timoteo', 'member']).optional(),
  address: addressSchema.optional(),
  birth_date: z.string().datetime().optional(),
  gender: z.enum(['masculino', 'feminino', 'outro']).optional(),
  marital_status: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo']).optional(),
  profession: z.string().optional(),
  emergency_contact: z.object({
    name: z.string(),
    phone: phoneSchema,
    relationship: z.string(),
  }).optional(),
  avatar_url: z.string().url().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();
    
    // Verificar se o usuário atual tem permissão para ver este usuário
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário atual não encontrado' }, { status: 404 });
    }

    // Buscar o usuário solicitado
    const { data: user, error } = await supabase
      .from('profiles')
      .select(`
        *,
        church:churches(id, name),
        led_cells:cells!cells_leader_id_fkey(
          id, 
          name, 
          created_at,
          members:cell_members(count)
        ),
        supervised_cells:cells!cells_supervisor_id_fkey(
          id, 
          name, 
          created_at,
          members:cell_members(count)
        ),
        cell_memberships:cell_members(
          id,
          cell:cells(id, name),
          success_ladder_score,
          is_timoteo,
          joined_at
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
    }

    // Verificar permissões de acesso
    const canAccess = 
      userId === params.id || // Próprio usuário
      currentUser.role === 'pastor' && user.church_id === currentUser.church_id || // Pastor da mesma igreja
      currentUser.role === 'supervisor' && user.church_id === currentUser.church_id || // Supervisor da mesma igreja
      (currentUser.role === 'leader' && user.cell_memberships?.some(membership => 
        membership.cell && 
        (membership.cell as any).leader_id === userId
      )); // Líder da célula do usuário

    if (!canAccess) {
      return NextResponse.json({ error: 'Sem permissão para ver este usuário' }, { status: 403 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = UserUpdateSchema.parse(body);
    
    // Verificar se o usuário atual tem permissão para atualizar este usuário
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário atual não encontrado' }, { status: 404 });
    }

    // Buscar o usuário a ser atualizado
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('id, church_id, role')
      .eq('id', params.id)
      .single();

    if (targetUserError) {
      console.error('Target user error:', targetUserError);
      
      if (targetUserError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
    }

    // Verificar permissões de atualização
    const canUpdate = 
      userId === params.id || // Próprio usuário (limitado)
      currentUser.role === 'pastor' && targetUser.church_id === currentUser.church_id || // Pastor da mesma igreja
      currentUser.role === 'supervisor' && targetUser.church_id === currentUser.church_id; // Supervisor da mesma igreja

    if (!canUpdate) {
      return NextResponse.json({ error: 'Sem permissão para atualizar este usuário' }, { status: 403 });
    }

    // Verificar se está tentando alterar o role sem permissão
    if (validatedData.role && validatedData.role !== targetUser.role) {
      if (userId === params.id) {
        return NextResponse.json({ error: 'Não é possível alterar seu próprio role' }, { status: 403 });
      }
      
      if (currentUser.role === 'supervisor' && validatedData.role === 'pastor') {
        return NextResponse.json({ error: 'Supervisor não pode promover alguém a pastor' }, { status: 403 });
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (validatedData.full_name) updateData.full_name = validatedData.full_name;
    if (validatedData.phone) updateData.phone = validatedData.phone;
    if (validatedData.cpf) updateData.cpf = validatedData.cpf;
    if (validatedData.role) updateData.role = validatedData.role;
    if (validatedData.address) updateData.address = validatedData.address;
    if (validatedData.birth_date) updateData.birth_date = validatedData.birth_date;
    if (validatedData.gender) updateData.gender = validatedData.gender;
    if (validatedData.marital_status) updateData.marital_status = validatedData.marital_status;
    if (validatedData.profession) updateData.profession = validatedData.profession;
    if (validatedData.emergency_contact) updateData.emergency_contact = validatedData.emergency_contact;
    if (validatedData.avatar_url) updateData.avatar_url = validatedData.avatar_url;

    // Atualizar usuário
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        church:churches(id, name),
        led_cells:cells!cells_leader_id_fkey(id, name, created_at),
        supervised_cells:cells!cells_supervisor_id_fkey(id, name, created_at),
        cell_memberships:cell_members(
          id,
          cell:cells(id, name),
          success_ladder_score,
          is_timoteo,
          joined_at
        )
      `)
      .single();

    if (updateError) {
      console.error('Supabase error:', updateError);
      
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'Dados duplicados (CPF, email, etc.)' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createServerClient();
    
    // Verificar se o usuário atual tem permissão para deletar este usuário
    const { data: currentUser, error: currentUserError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'Usuário atual não encontrado' }, { status: 404 });
    }

    // Buscar o usuário a ser deletado
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('id, church_id, role')
      .eq('id', params.id)
      .single();

    if (targetUserError) {
      console.error('Target user error:', targetUserError);
      
      if (targetUserError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
    }

    // Verificar permissões de exclusão
    const canDelete = 
      currentUser.role === 'pastor' && targetUser.church_id === currentUser.church_id;

    if (!canDelete) {
      return NextResponse.json({ error: 'Sem permissão para deletar este usuário' }, { status: 403 });
    }

    // Não permitir que o pastor delete a si mesmo
    if (userId === params.id) {
      return NextResponse.json({ error: 'Não é possível deletar seu próprio usuário' }, { status: 403 });
    }

    // Verificar se o usuário tem células como líder
    const { data: ledCells, error: ledCellsError } = await supabase
      .from('cells')
      .select('id')
      .eq('leader_id', params.id)
      .limit(1);

    if (ledCellsError) {
      console.error('Error checking led cells:', ledCellsError);
      return NextResponse.json({ error: 'Erro ao verificar células lideradas' }, { status: 500 });
    }

    if (ledCells && ledCells.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível deletar usuário que lidera células' 
      }, { status: 409 });
    }

    // Verificar se o usuário supervisiona células
    const { data: supervisedCells, error: supervisedCellsError } = await supabase
      .from('cells')
      .select('id')
      .eq('supervisor_id', params.id)
      .limit(1);

    if (supervisedCellsError) {
      console.error('Error checking supervised cells:', supervisedCellsError);
      return NextResponse.json({ error: 'Erro ao verificar células supervisionadas' }, { status: 500 });
    }

    if (supervisedCells && supervisedCells.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível deletar usuário que supervisiona células' 
      }, { status: 409 });
    }

    // Deletar usuário
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Supabase error:', deleteError);
      
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      
      if (deleteError.code === '23503') {
        return NextResponse.json({ 
          error: 'Não é possível deletar usuário com dados relacionados' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}