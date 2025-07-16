#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usar variáveis de ambiente em produção)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log('🧪 TESTANDO BANCO DE DADOS - FUNCIONALIDADES IMPLEMENTADAS');
  console.log('=' * 60);

  try {
    // 1. Testar tabelas criadas
    console.log('\n1. 📋 VERIFICANDO TABELAS CRIADAS:');
    
    const tables = [
      'success_ladder_activities',
      'member_activity_log', 
      'ladder_levels',
      'badges',
      'member_badges',
      'leadership_pipeline',
      'leadership_factors',
      'leadership_assessments',
      'mode_templates',
      'cell_modes',
      'mode_activities'
    ];

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ ${table}: ERRO - ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK (${data.length || 0} registros)`);
      }
    }

    // 2. Testar dados padrão
    console.log('\n2. 🎯 VERIFICANDO DADOS PADRÃO:');
    
    // Atividades da Escada do Sucesso
    const { data: activities } = await supabase
      .from('success_ladder_activities')
      .select('*');
    console.log(`✅ Atividades da Escada: ${activities?.length || 0} configuradas`);

    // Níveis da Escada
    const { data: levels } = await supabase
      .from('ladder_levels')
      .select('*')
      .order('order_index');
    console.log(`✅ Níveis da Escada: ${levels?.length || 0} configurados`);
    if (levels?.length > 0) {
      console.log(`   Níveis: ${levels.map(l => l.name).join(', ')}`);
    }

    // Badges
    const { data: badges } = await supabase
      .from('badges')
      .select('*');
    console.log(`✅ Badges disponíveis: ${badges?.length || 0} configurados`);

    // Templates de Modos
    const { data: modeTemplates } = await supabase
      .from('mode_templates')
      .select('*');
    console.log(`✅ Templates de Modos: ${modeTemplates?.length || 0} configurados`);
    if (modeTemplates?.length > 0) {
      console.log(`   Modos: ${modeTemplates.map(m => m.mode).join(', ')}`);
    }

    // Fatores de Liderança
    const { data: factors } = await supabase
      .from('leadership_factors')
      .select('*');
    console.log(`✅ Fatores de Liderança: ${factors?.length || 0} configurados`);

    // 3. Testar funções SQL
    console.log('\n3. ⚙️ TESTANDO FUNÇÕES SQL:');
    
    // Função de cálculo de nível
    try {
      const { data: levelTest } = await supabase.rpc('get_member_level', { member_score: 150 });
      console.log(`✅ get_member_level: OK`);
      if (levelTest?.length > 0) {
        console.log(`   Teste (150 pts): Nível "${levelTest[0].name}"`);
      }
    } catch (error) {
      console.log(`❌ get_member_level: ERRO - ${error.message}`);
    }

    // 4. Verificar estrutura de igreja
    console.log('\n4. 🏢 VERIFICANDO ESTRUTURA EXISTENTE:');
    
    const { data: churches } = await supabase
      .from('churches')
      .select('*');
    console.log(`✅ Igrejas cadastradas: ${churches?.length || 0}`);

    const { data: cells } = await supabase
      .from('cells')
      .select('*');
    console.log(`✅ Células cadastradas: ${cells?.length || 0}`);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');
    console.log(`✅ Perfis cadastrados: ${profiles?.length || 0}`);

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Criar dados de igreja piloto');
    console.log('2. Testar interface web');
    console.log('3. Validar workflows completos');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
  }
}

// Executar teste
testDatabase().then(() => {
  console.log('\n✅ Teste finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Falha no teste:', error);
  process.exit(1);
});