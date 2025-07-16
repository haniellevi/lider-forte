import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's church_id and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.church_id) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    const { id: memberId } = await params;

    // Check if user has permission to view recommendations for this member
    let hasPermission = false;

    if (['supervisor', 'pastor'].includes(profile.role)) {
      hasPermission = true;
    } else if (profile.role === 'leader') {
      // Check if the member is in the leader's cell
      const { data: cellMember } = await supabase
        .from('cell_members')
        .select(`
          cells!inner (
            leader_id
          )
        `)
        .eq('profile_id', memberId)
        .single();

      hasPermission = (cellMember?.cells as any)?.leader_id === user.id;
    } else if (user.id === memberId) {
      // Users can view their own recommendations
      hasPermission = true;
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get leadership pipeline data for the member
    const { data: pipelineData, error: pipelineError } = await supabase
      .from('leadership_pipeline')
      .select(`
        leadership_score,
        potential_level,
        confidence_score,
        factors,
        recommendations,
        last_calculated_at,
        profiles!inner (
          full_name,
          role,
          avatar_url
        )
      `)
      .eq('profile_id', memberId)
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .single();

    if (pipelineError) {
      // If no pipeline data exists, calculate recommendations on the fly
      const { data: calculatedData, error: calcError } = await supabase
        .rpc('calculate_leadership_score', { member_id: memberId });

      if (calcError || !calculatedData || calculatedData.length === 0) {
        return NextResponse.json({ error: 'Unable to generate recommendations' }, { status: 404 });
      }

      const calculated = calculatedData[0];
      
      // Get basic member info
      const { data: memberInfo } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', memberId)
        .single();

      return NextResponse.json({
        success: true,
        data: {
          member: {
            id: memberId,
            full_name: memberInfo?.full_name || 'Unknown',
            role: memberInfo?.role || 'member',
            avatar_url: memberInfo?.avatar_url
          },
          recommendations: calculated.recommendations,
          leadership_score: calculated.leadership_score,
          potential_level: calculated.potential_level,
          confidence_score: calculated.confidence_score,
          factors: calculated.factors,
          last_calculated_at: new Date().toISOString(),
          is_calculated: true
        }
      });
    }

    // Parse factors to extract detailed insights
    const factors = pipelineData.factors as Record<string, any>;
    const factorInsights = Object.entries(factors).map(([name, data]) => ({
      name,
      score: data.score,
      weight: data.weight,
      weighted_score: data.weighted_score,
      category: data.category,
      status: data.score >= 70 ? 'good' : data.score >= 50 ? 'moderate' : 'needs_improvement'
    }));

    // Generate specific action plans based on weak factors
    const actionPlans = [];
    const weakFactors = factorInsights.filter(f => f.score < 60);

    for (const factor of weakFactors) {
      let actionPlan = {
        factor: factor.name,
        category: factor.category,
        current_score: factor.score,
        target_score: Math.min(factor.score + 20, 90),
        priority: factor.weight > 0.1 ? 'high' : factor.weight > 0.05 ? 'medium' : 'low',
        actions: [] as string[],
        timeline: '30-60 days'
      };

      // Generate specific actions based on factor category and name
      switch (factor.category) {
        case 'attendance':
          actionPlan.actions = [
            'Estabelecer uma rotina consistente de participação',
            'Definir lembretes para reuniões e eventos',
            'Comunicar com antecedência eventuais ausências',
            'Participar de pelo menos 85% das reuniões mensais'
          ];
          break;
        case 'growth':
          actionPlan.actions = [
            'Definir metas específicas na Escada do Sucesso',
            'Participar de mais atividades pontuadas',
            'Buscar orientação sobre como crescer espiritualmente',
            'Acompanhar progresso semanalmente'
          ];
          break;
        case 'engagement':
          actionPlan.actions = [
            'Participar ativamente das discussões em célula',
            'Fazer perguntas e compartilhar experiências',
            'Tomar iniciativa em pequenas tarefas',
            'Ajudar a organizar eventos ou atividades'
          ];
          break;
        case 'influence':
          actionPlan.actions = [
            'Praticar habilidades de comunicação',
            'Compartilhar testemunhos pessoais',
            'Mentorear um novo membro',
            'Participar de treinamentos de liderança'
          ];
          break;
        case 'service':
          actionPlan.actions = [
            'Voluntariar-se em pelo menos um ministério',
            'Completar tarefas assumidas dentro do prazo',
            'Buscar oportunidades de servir a comunidade',
            'Desenvolver consistência no serviço'
          ];
          break;
        case 'leadership_traits':
          actionPlan.actions = [
            'Solicitar feedback regular de líderes',
            'Participar de cursos de desenvolvimento pessoal',
            'Praticar tomada de decisões em grupo',
            'Estudar sobre liderança cristã'
          ];
          break;
        default:
          actionPlan.actions = [
            'Buscar orientação específica com seu líder',
            'Participar de treinamentos relacionados',
            'Praticar consistentemente',
            'Monitorar progresso mensalmente'
          ];
      }

      actionPlans.push(actionPlan);
    }

    // Generate next steps based on current potential level
    const nextSteps = [];
    switch (pipelineData.potential_level) {
      case 'member':
        nextSteps.push(
          'Focar no crescimento pessoal e consistência',
          'Participar regularmente das atividades da célula',
          'Buscar mentoria de um líder experiente',
          'Estabelecer metas na Escada do Sucesso'
        );
        break;
      case 'timoteo':
        nextSteps.push(
          'Desenvolver habilidades de liderança básicas',
          'Assumir pequenas responsabilidades na célula',
          'Participar de treinamentos de discipulado',
          'Mentorear novos membros'
        );
        break;
      case 'leader_potential':
        nextSteps.push(
          'Participar de treinamentos de liderança',
          'Assumir responsabilidades maiores',
          'Desenvolver visão ministerial',
          'Preparar-se para liderar uma célula'
        );
        break;
      case 'leader_ready':
        nextSteps.push(
          'Candidatar-se à liderança de célula',
          'Completar treinamento formal de líderes',
          'Desenvolver plano de multiplicação',
          'Buscar mentoria de supervisor'
        );
        break;
      case 'supervisor_potential':
        nextSteps.push(
          'Preparar-se para supervisionar líderes',
          'Desenvolver habilidades de coaching',
          'Estudar sobre multiplicação de células',
          'Participar da liderança estratégica'
        );
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        member: {
          id: memberId,
          full_name: (pipelineData.profiles as any).full_name,
          role: (pipelineData.profiles as any).role,
          avatar_url: (pipelineData.profiles as any).avatar_url
        },
        leadership_score: pipelineData.leadership_score,
        potential_level: pipelineData.potential_level,
        confidence_score: pipelineData.confidence_score,
        recommendations: pipelineData.recommendations,
        factor_insights: factorInsights,
        action_plans: actionPlans,
        next_steps: nextSteps,
        last_calculated_at: pipelineData.last_calculated_at,
        is_calculated: false
      }
    });

  } catch (error) {
    console.error('Unexpected error in recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only leaders and above can update recommendations
    if (!['leader', 'supervisor', 'pastor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: memberId } = await params;
    const body = await request.json();
    const { custom_recommendations, notes } = body;

    if (!custom_recommendations || !Array.isArray(custom_recommendations)) {
      return NextResponse.json({ 
        error: 'custom_recommendations must be an array of strings' 
      }, { status: 400 });
    }

    // Update the pipeline with custom recommendations
    const { data: updated, error: updateError } = await supabase
      .from('leadership_pipeline')
      .update({
        recommendations: custom_recommendations,
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', memberId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating recommendations:', updateError);
      return NextResponse.json({ error: 'Failed to update recommendations' }, { status: 500 });
    }

    // Optionally log the custom recommendation update
    if (notes) {
      await supabase
        .from('leadership_assessments')
        .insert({
          profile_id: memberId,
          assessor_id: user.id,
          church_id: updated.church_id,
          assessment_type: 'supervisor_feedback',
          scores: { custom_recommendation: 10 }, // Placeholder score
          comments: `Recomendações personalizadas atualizadas: ${notes}`,
          assessment_date: new Date().toISOString(),
          is_validated: true
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations: custom_recommendations,
        updated_at: updated.updated_at,
        message: 'Recomendações atualizadas com sucesso'
      }
    });

  } catch (error) {
    console.error('Unexpected error updating recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}