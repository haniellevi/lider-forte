import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema de validação para atualização de relatórios
const updateReportSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  description: z.string().optional(),
  report_type: z.enum([
    'church_overview',
    'cell_performance', 
    'member_growth',
    'leadership_development',
    'financial_summary',
    'attendance_tracking',
    'event_statistics'
  ]).optional(),
  parameters: z.record(z.any()).optional(),
  is_public: z.boolean().optional(),
  scheduled_frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do relatório é obrigatório' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Buscar perfil do usuário para obter church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Buscar o relatório
    const { data: report, error } = await supabase
      .from('reports')
      .select(`
        *,
        created_by_profile:profiles!reports_created_by_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
      }
      console.error('Erro ao buscar relatório:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Verificar permissões de visualização
    if (!report.is_public && report.created_by !== userId && profile.role !== 'pastor') {
      return NextResponse.json({ error: 'Sem permissão para acessar este relatório' }, { status: 403 });
    }

    return NextResponse.json(report);

  } catch (error) {
    console.error('Erro na API de relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const updateData = updateReportSchema.parse(body);

    const supabase = await createClient();
    
    // Buscar perfil do usuário para obter church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Verificar se o relatório existe e se o usuário tem permissão
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('id, created_by, is_public')
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
      }
      console.error('Erro ao buscar relatório:', fetchError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Verificar permissões de edição
    const canEdit = existingReport.created_by === userId || profile.role === 'pastor';
    if (!canEdit) {
      return NextResponse.json({ error: 'Sem permissão para editar este relatório' }, { status: 403 });
    }

    // Verificar permissões para relatórios públicos
    if (updateData.is_public && !['pastor', 'supervisor'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Apenas pastores e supervisores podem criar relatórios públicos' 
      }, { status: 403 });
    }

    // Atualizar o relatório
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        created_by_profile:profiles!reports_created_by_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Erro ao atualizar relatório:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar relatório' }, { status: 500 });
    }

    return NextResponse.json(updatedReport);

  } catch (error) {
    console.error('Erro na atualização de relatório:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    const supabase = await createClient();
    
    // Buscar perfil do usuário para obter church_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Verificar se o relatório existe e se o usuário tem permissão
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('id, created_by')
      .eq('id', id)
      .eq('church_id', profile.church_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
      }
      console.error('Erro ao buscar relatório:', fetchError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Verificar permissões de exclusão
    const canDelete = existingReport.created_by === userId || profile.role === 'pastor';
    if (!canDelete) {
      return NextResponse.json({ error: 'Sem permissão para excluir este relatório' }, { status: 403 });
    }

    // Excluir o relatório
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao excluir relatório:', deleteError);
      return NextResponse.json({ error: 'Erro ao excluir relatório' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Relatório excluído com sucesso' });

  } catch (error) {
    console.error('Erro na exclusão de relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}