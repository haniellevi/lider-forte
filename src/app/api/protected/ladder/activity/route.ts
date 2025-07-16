import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for registering a new activity
const registerActivitySchema = z.object({
  profile_id: z.string().uuid('ID do perfil deve ser um UUID válido'),
  activity_id: z.string().uuid('ID da atividade deve ser um UUID válido'),
  activity_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
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
    const validatedData = registerActivitySchema.parse(body);

    // Verificar se a atividade existe e está ativa
    const { data: activity, error: activityError } = await supabase
      .from('success_ladder_activities')
      .select('id, name, points, category, is_active')
      .eq('id', validatedData.activity_id)
      .eq('is_active', true)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada ou inativa' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para registrar atividade para este perfil
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, role, church_id')
      .eq('id', user.id)
      .single();

    // Verificar se o perfil alvo pertence à mesma igreja
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, church_id')
      .eq('id', validatedData.profile_id)
      .single();

    if (!targetProfile || targetProfile.church_id !== userProfile?.church_id) {
      return NextResponse.json(
        { error: 'Perfil não encontrado ou não pertence à sua igreja' },
        { status: 403 }
      );
    }

    // Verificar se o usuário tem permissão (próprio perfil ou é líder)
    const canRegister = validatedData.profile_id === user.id || 
                       ['leader', 'supervisor', 'pastor'].includes(userProfile?.role || '');

    if (!canRegister) {
      return NextResponse.json(
        { error: 'Sem permissão para registrar atividade para este membro' },
        { status: 403 }
      );
    }

    // Se é líder, verificar se o membro está em sua célula
    if (validatedData.profile_id !== user.id && userProfile?.role === 'leader') {
      const { data: cellMember } = await supabase
        .from('cell_members')
        .select('id')
        .eq('profile_id', validatedData.profile_id)
        .eq('cell_id', await supabase
          .from('cells')
          .select('id')
          .eq('leader_id', user.id)
          .single()
          .then(res => res.data?.id)
        )
        .single();

      if (!cellMember) {
        return NextResponse.json(
          { error: 'Membro não pertence à sua célula' },
          { status: 403 }
        );
      }
    }

    // Registrar a atividade
    const { data: logEntry, error: logError } = await supabase
      .from('member_activity_log')
      .insert({
        profile_id: validatedData.profile_id,
        activity_id: validatedData.activity_id,
        points_earned: activity.points,
        activity_date: validatedData.activity_date,
        metadata: validatedData.metadata
      })
      .select(`
        *,
        success_ladder_activities (
          name,
          points,
          category
        ),
        profiles (
          full_name
        )
      `)
      .single();

    if (logError) {
      // Se for erro de duplicata, retornar erro específico
      if (logError.message.includes('duplicate') || logError.message.includes('already logged')) {
        return NextResponse.json(
          { error: 'Atividade já foi registrada para este membro hoje' },
          { status: 409 }
        );
      }
      
      console.error('Erro ao registrar atividade:', logError);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Atividade registrada com sucesso',
      data: logEntry
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

    console.error('Erro ao registrar atividade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}