"use client";

import { useState } from 'react';
import { useSupabaseUser, useRealtimeQuery } from '@/hooks/useSupabase';
import { Database } from '@/lib/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

export function SupabaseExample() {
  const { profile, loading: profileLoading } = useSupabaseUser();
  const { data: posts, loading: postsLoading } = useRealtimeQuery<Post>('posts', [
    { column: 'user_id', value: profile?.user_id }
  ]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  const createPost = async () => {
    if (!newPost.title || !newPost.content) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/protected/supabase-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          published: true
        })
      });

      if (response.ok) {
        setNewPost({ title: '', content: '' });
        // O hook de realtime atualizará a lista automaticamente
      }
    } catch (error) {
      console.error('Erro ao criar post:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (profileLoading) {
    return <div className="animate-pulse">Carregando perfil...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Perfil do Usuário */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-boxdark">
        <h3 className="mb-4 text-lg font-semibold">Perfil Sincronizado</h3>
        {profile ? (
          <div className="flex items-center space-x-4">
            {profile.avatar_url && (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="h-12 w-12 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{profile.full_name || 'Usuário'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ID Supabase: {profile.id}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Perfil não encontrado
          </p>
        )}
      </div>

      {/* Criar Novo Post */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-boxdark">
        <h3 className="mb-4 text-lg font-semibold">Criar Post</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Título do post"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            className="w-full rounded-md border border-stroke bg-gray px-4 py-2 dark:bg-meta-4 dark:border-strokedark"
          />
          <textarea
            placeholder="Conteúdo do post"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            rows={3}
            className="w-full rounded-md border border-stroke bg-gray px-4 py-2 dark:bg-meta-4 dark:border-strokedark"
          />
          <button
            onClick={createPost}
            disabled={isCreating || !newPost.title || !newPost.content}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:bg-gray-400"
          >
            {isCreating ? 'Criando...' : 'Criar Post'}
          </button>
        </div>
      </div>

      {/* Lista de Posts em Tempo Real */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-boxdark">
        <h3 className="mb-4 text-lg font-semibold">
          Posts em Tempo Real ({posts.length})
        </h3>
        {postsLoading ? (
          <div className="animate-pulse">Carregando posts...</div>
        ) : posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="rounded-md border border-stroke p-3 dark:border-strokedark"
              >
                <h4 className="font-medium">{post.title}</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {post.content}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {new Date(post.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className={post.published ? 'text-green-600' : 'text-orange-600'}>
                    {post.published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum post encontrado. Crie o primeiro!
          </p>
        )}
      </div>
    </div>
  );
}