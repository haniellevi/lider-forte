#!/usr/bin/env node

/**
 * Script para configurar dados piloto para testes
 * Execute: node scripts/setup-pilot-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupPilotData() {
  console.log('🚀 CONFIGURANDO DADOS PILOTO PARA TESTES\n');

  try {
    // 1. Verificar se já existem dados
    console.log('1. 🔍 Verificando dados existentes...');
    
    const { data: existingChurches } = await supabase
      .from('churches')
      .select('*')
      .limit(1);

    if (existingChurches && existingChurches.length > 0) {
      console.log('✅ Dados já existem. Igreja encontrada:', existingChurches[0].name);
      console.log('📊 Executando relatório de status...\n');
      await generateStatusReport();
      return;
    }

    // 2. Criar igreja piloto
    console.log('2. 🏢 Criando igreja piloto...');
    
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .insert({
        name: 'Igreja Renascer Piloto',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567',
        phone: '(11) 98765-4321',
        email: 'contato@renascerpiloto.com.br',
        website: 'https://renascerpiloto.com.br',
        settings: {
          timezone: 'America/Sao_Paulo',
          currency: 'BRL', 
          language: 'pt-BR',
          features: {
            success_ladder: true,
            leadership_pipeline: true,
            cell_modes: true,
            gamification: true
          }
        }
      })
      .select()
      .single();

    if (churchError) {
      console.error('❌ Erro ao criar igreja:', churchError);
      return;
    }

    console.log('✅ Igreja criada:', church.name);
    const churchId = church.id;

    // 3. Criar perfis piloto
    console.log('3. 👥 Criando perfis de usuários...');
    
    const profiles = [
      {
        church_id: churchId,
        clerk_id: 'clerk_pastor_001',
        email: 'pastor@renascerpiloto.com.br',
        full_name: 'Pastor João Silva',
        role: 'pastor',
        phone: '(11) 99999-0001',
        cpf: '12345678901',
        success_ladder_score: 2500
      },
      {
        church_id: churchId,
        clerk_id: 'clerk_supervisor_001',
        email: 'supervisor1@renascerpiloto.com.br',
        full_name: 'Maria Santos Silva',
        role: 'supervisor',
        phone: '(11) 99999-0002',
        cpf: '12345678902',
        success_ladder_score: 1800
      },
      {
        church_id: churchId,
        clerk_id: 'clerk_leader_001',
        email: 'leader1@renascerpiloto.com.br',
        full_name: 'Ana Paula Oliveira',
        role: 'leader',
        phone: '(11) 99999-0004',
        cpf: '12345678904',
        success_ladder_score: 850
      },
      {
        church_id: churchId,
        clerk_id: 'clerk_timoteo_001',
        email: 'timoteo1@renascerpiloto.com.br',
        full_name: 'Lucas Roberto Santos',
        role: 'timoteo',
        phone: '(11) 99999-0007',
        cpf: '12345678907',
        success_ladder_score: 650,
        is_timoteo: true
      },
      {
        church_id: churchId,
        clerk_id: 'clerk_member_001',
        email: 'member1@renascerpiloto.com.br',
        full_name: 'Roberto Carlos Ferreira',
        role: 'member',
        phone: '(11) 99999-0009',
        cpf: '12345678909',
        success_ladder_score: 350
      }
    ];

    const { data: createdProfiles, error: profilesError } = await supabase
      .from('profiles')
      .insert(profiles)
      .select();

    if (profilesError) {
      console.error('❌ Erro ao criar perfis:', profilesError);
      return;
    }

    console.log(`✅ ${createdProfiles.length} perfis criados`);

    // 4. Criar células
    console.log('4. 🔗 Criando células...');
    
    const supervisor = createdProfiles.find(p => p.role === 'supervisor');
    const leader = createdProfiles.find(p => p.role === 'leader');

    const { data: cell, error: cellError } = await supabase
      .from('cells')
      .insert({
        church_id: churchId,
        name: 'Célula Vitória',
        leader_id: leader.id,
        supervisor_id: supervisor.id,
        meeting_day: 'wednesday',
        meeting_time: '19:30:00',
        address: 'Rua das Palmeiras, 456',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
      })
      .select()
      .single();

    if (cellError) {
      console.error('❌ Erro ao criar célula:', cellError);
      return;
    }

    console.log('✅ Célula criada:', cell.name);

    // 5. Adicionar membros à célula
    console.log('5. 👥 Adicionando membros à célula...');
    
    const cellMembers = createdProfiles.map(profile => ({
      cell_id: cell.id,
      profile_id: profile.id,
      role: profile.role,
      success_ladder_score: profile.success_ladder_score,
      is_timoteo: profile.is_timoteo || false
    }));

    const { error: membersError } = await supabase
      .from('cell_members')
      .insert(cellMembers);

    if (membersError) {
      console.error('❌ Erro ao adicionar membros:', membersError);
      return;
    }

    console.log(`✅ ${cellMembers.length} membros adicionados à célula`);

    // 6. Ativar modo estratégico
    console.log('6. 🎯 Ativando modo estratégico...');
    
    const { error: modeError } = await supabase
      .from('cell_modes')
      .insert({
        cell_id: cell.id,
        mode: 'GANHAR',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        goal_description: 'Foco em evangelismo e alcance de novos visitantes',
        target_metrics: {
          new_visitors: { target: 4 },
          conversions: { target: 2 },
          invitation_activities: { target: 3 }
        },
        created_by: leader.id
      });

    if (modeError) {
      console.error('❌ Erro ao ativar modo:', modeError);
    } else {
      console.log('✅ Modo GANHAR ativado para a célula');
    }

    // 7. Relatório final
    console.log('\n📊 DADOS PILOTO CONFIGURADOS COM SUCESSO!\n');
    await generateStatusReport();

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function generateStatusReport() {
  console.log('📊 RELATÓRIO DE STATUS DO SISTEMA:\n');

  // Igrejas
  const { data: churches } = await supabase.from('churches').select('*');
  console.log(`🏢 Igrejas: ${churches?.length || 0}`);

  // Perfis
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log(`👥 Perfis: ${profiles?.length || 0}`);
  
  if (profiles && profiles.length > 0) {
    const roleCount = profiles.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count}`);
    });
  }

  // Células
  const { data: cells } = await supabase.from('cells').select('*');
  console.log(`🔗 Células: ${cells?.length || 0}`);

  // Membros em células
  const { data: cellMembers } = await supabase.from('cell_members').select('*');
  console.log(`👥 Membros em células: ${cellMembers?.length || 0}`);

  // Modos ativos
  const { data: activeModes } = await supabase
    .from('cell_modes')
    .select('*')
    .eq('is_active', true);
  console.log(`🎯 Modos ativos: ${activeModes?.length || 0}`);

  // Atividades da escada
  const { data: ladderActivities } = await supabase.from('success_ladder_activities').select('*');
  console.log(`⭐ Atividades da Escada: ${ladderActivities?.length || 0}`);

  // Níveis
  const { data: levels } = await supabase.from('ladder_levels').select('*');
  console.log(`🏆 Níveis configurados: ${levels?.length || 0}`);

  // Badges
  const { data: badges } = await supabase.from('badges').select('*');
  console.log(`🏅 Badges disponíveis: ${badges?.length || 0}`);

  console.log('\n🚀 SISTEMA PRONTO PARA TESTES!');
  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('1. Acessar http://localhost:3005');
  console.log('2. Fazer login com qualquer conta Clerk');
  console.log('3. Testar as funcionalidades implementadas');
  console.log('4. Navegar pelas rotas: /app/cells, /app/reports, /app/success-ladder');
}

// Executar script
setupPilotData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Falha na configuração:', error);
    process.exit(1);
  });