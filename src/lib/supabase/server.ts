import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Cache para instâncias do cliente por token
const clientCache = new Map<string, SupabaseClient>();

export const createServerClient = async () => {
  const { getToken } = await auth();
  
  const clerkToken = await getToken({
    template: 'supabase'
  });
  
  // Usar token como chave do cache (ou 'anonymous' se não houver token)
  const cacheKey = clerkToken || 'anonymous';
  
  // Retornar instância existente se disponível
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }
  
  // Criar nova instância
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }

          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
  
  // Armazenar no cache
  clientCache.set(cacheKey, client);
  
  return client;
};

export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};