import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const resolvedParams = await params;
    
    const direction = searchParams.get('direction') || 'descendants'; // descendants | ancestors
    const maxDepth = parseInt(searchParams.get('maxDepth') || '5');
    
    if (direction === 'descendants') {
      // Buscar células descendentes (filhas, netas, etc.)
      const { data, error } = await supabase.rpc('get_cell_descendants', {
        cell_id: resolvedParams.id,
        max_depth: maxDepth
      });

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Erro ao buscar células descendentes' }, { status: 500 });
      }

      return NextResponse.json({ data });
    } else {
      // Buscar células ancestrais (pai, avô, etc.)
      const { data, error } = await supabase.rpc('get_cell_ancestors', {
        cell_id: resolvedParams.id,
        max_depth: maxDepth
      });

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Erro ao buscar células ancestrais' }, { status: 500 });
      }

      return NextResponse.json({ data });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}