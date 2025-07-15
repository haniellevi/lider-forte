import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema de validação
const CreatePostSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100),
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  published: z.boolean().default(false)
});

// GET - Buscar posts do usuário
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação com Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    // 2. Conectar ao Supabase
    const supabase = await createServerClient();

    // 3. Buscar posts do usuário
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const published = searchParams.get('published');

    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Filtro opcional por status de publicação
    if (published !== null) {
      query = query.eq('published', published === 'true');
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar posts:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar posts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo post
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    // 2. Validar dados
    const body = await request.json();
    const validationResult = CreatePostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    // 3. Inserir no Supabase
    const supabase = await createServerClient();
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        ...validationResult.data
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar post:', error);
      return NextResponse.json(
        { error: 'Erro ao criar post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post criado com sucesso!',
      data: post
    }, { status: 201 });

  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar post
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json(
        { error: 'ID do post é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const supabase = await createServerClient();

    // Verificar se o post pertence ao usuário
    const { data: existingPost } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!existingPost || existingPost.user_id !== userId) {
      return NextResponse.json(
        { error: 'Post não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    // Atualizar post
    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar post:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post atualizado com sucesso!',
      data: updatedPost
    });

  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir post
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json(
        { error: 'ID do post é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Verificar se o post pertence ao usuário e deletar
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao excluir post:', error);
      return NextResponse.json(
        { error: 'Erro ao excluir post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post excluído com sucesso!'
    });

  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}