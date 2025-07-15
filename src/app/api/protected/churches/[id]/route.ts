import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ChurchUpdateSchema = z.object({
  name: z.string().min(1, 'Nome da igreja é obrigatório').optional(),
  cnpj: z.string().optional(),
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
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Erro ao buscar igreja' }, { status: 500 });
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
    
    const validatedData = ChurchUpdateSchema.parse(body);
    
    const { data, error } = await supabase
      .from('churches')
      .update({
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.cnpj && { cnpj: validatedData.cnpj }),
        ...(validatedData.address && { address: validatedData.address }),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 });
      }
      
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }
      
      return NextResponse.json({ error: 'Erro ao atualizar igreja' }, { status: 500 });
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
    
    const { error } = await supabase
      .from('churches')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 });
      }
      
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
      }
      
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Não é possível excluir igreja com dados relacionados' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Erro ao excluir igreja' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Igreja excluída com sucesso' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}