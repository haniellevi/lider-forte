import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for bulk attendance registration
const bulkAttendanceSchema = z.object({
  cell_id: z.string().uuid('ID da célula deve ser um UUID válido'),
  activity_id: z.string().uuid('ID da atividade deve ser um UUID válido'),
  activity_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  member_ids: z.array(z.string().uuid('ID do membro deve ser um UUID válido')).min(1, 'Pelo menos um membro deve ser especificado'),
  metadata: z.record(z.any()).optional().default({})
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Validar dados de entrada
    const body = await request.json();
    const validatedData = bulkAttendanceSchema.parse(body);

    // Verificar se o usuário é líder da célula especificada
    const { data: cell, error: cellError } = await supabase
      .from('cells')
      .select('id, name, leader_id, church_id')
      .eq('id', validatedData.cell_id)
      .eq('leader_id', user.id)
      .single();

    if (cellError || !cell) {
      return NextResponse.json(
        { error: 'Célula não encontrada ou você não é o líder desta célula' },
        { status: 403 }
      );
    }

    // Verificar se a atividade existe e está ativa
    const { data: activity, error: activityError } = await supabase
      .from('success_ladder_activities')
      .select('id, name, points, category, is_active, church_id')
      .eq('id', validatedData.activity_id)
      .eq('is_active', true)
      .eq('church_id', cell.church_id)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada, inativa ou não pertence à sua igreja' },
        { status: 404 }
      );
    }

    // Verificar se todos os membros pertencem à célula
    const { data: cellMembers, error: membersError } = await supabase
      .from('cell_members')
      .select('profile_id, profiles(full_name)')
      .eq('cell_id', validatedData.cell_id)
      .in('profile_id', validatedData.member_ids);

    if (membersError) {
      return NextResponse.json(
        { error: 'Erro ao verificar membros da célula' },
        { status: 500 }
      );
    }

    // Verificar se todos os IDs fornecidos são membros válidos da célula
    const validMemberIds = cellMembers?.map(cm => cm.profile_id) || [];
    const invalidMemberIds = validatedData.member_ids.filter(id => !validMemberIds.includes(id));

    if (invalidMemberIds.length > 0) {
      return NextResponse.json(
        { 
          error: 'Alguns membros não pertencem a esta célula',
          invalid_member_ids: invalidMemberIds
        },
        { status: 400 }
      );
    }

    // Verificar quais membros já têm esta atividade registrada na data especificada
    const { data: existingLogs } = await supabase
      .from('member_activity_log')
      .select('profile_id')
      .eq('activity_id', validatedData.activity_id)
      .eq('activity_date', validatedData.activity_date)
      .in('profile_id', validatedData.member_ids);

    const alreadyRegisteredIds = existingLogs?.map(log => log.profile_id) || [];
    const membersToRegister = validatedData.member_ids.filter(id => !alreadyRegisteredIds.includes(id));

    if (membersToRegister.length === 0) {
      return NextResponse.json(
        { 
          error: 'Todos os membros já têm esta atividade registrada para a data especificada',
          already_registered: alreadyRegisteredIds.length
        },
        { status: 409 }
      );
    }

    // Preparar dados para inserção em lote
    const logsToInsert = membersToRegister.map(memberId => ({
      profile_id: memberId,
      activity_id: validatedData.activity_id,
      points_earned: activity.points,
      activity_date: validatedData.activity_date,
      metadata: {
        ...validatedData.metadata,
        bulk_registration: true,
        cell_id: validatedData.cell_id,
        registered_by: user.id,
        registered_at: new Date().toISOString()
      }
    }));

    // Inserir registros em lote
    const { data: insertedLogs, error: insertError } = await supabase
      .from('member_activity_log')
      .insert(logsToInsert)
      .select(`
        *,
        profiles (
          full_name
        )
      `);

    if (insertError) {
      console.error('Erro ao registrar atividades em lote:', insertError);
      return NextResponse.json(
        { error: 'Erro ao registrar atividades' },
        { status: 500 }
      );
    }

    // Preparar resposta com detalhes do resultado
    const successfulRegistrations = insertedLogs?.length || 0;
    const skippedRegistrations = alreadyRegisteredIds.length;

    const memberNames = cellMembers?.reduce((acc, member) => {
      acc[member.profile_id] = (member.profiles as any)?.full_name;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      message: 'Registro em lote concluído',
      summary: {
        total_requested: validatedData.member_ids.length,
        successful_registrations: successfulRegistrations,
        skipped_registrations: skippedRegistrations,
        points_per_member: activity.points,
        total_points_distributed: successfulRegistrations * activity.points
      },
      activity: {
        id: activity.id,
        name: activity.name,
        category: activity.category,
        date: validatedData.activity_date
      },
      cell: {
        id: cell.id,
        name: cell.name
      },
      registered_members: insertedLogs?.map(log => ({
        id: log.profile_id,
        name: memberNames[log.profile_id],
        points_earned: log.points_earned
      })),
      skipped_members: alreadyRegisteredIds.map(id => ({
        id,
        name: memberNames[id],
        reason: 'Já registrado para esta data'
      }))
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Erro no registro em lote:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}