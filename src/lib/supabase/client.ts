import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';

// Extend the global Window interface to include Clerk
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: (opts?: { template?: string }) => Promise<string | null>
      }
    }
  }
}

// Environment variables for JWT template configuration
const USE_JWT_TEMPLATE = Boolean(process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE_NAME);
const JWT_TEMPLATE_NAME = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE_NAME || 'supabase';

export const createBrowserClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          let clerkToken = null;
          
          if (USE_JWT_TEMPLATE && window.Clerk?.session?.getToken) {
            clerkToken = await window.Clerk.session.getToken({
              template: JWT_TEMPLATE_NAME
            });
          }

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
};

export const useClerkSupabaseClient = () => {
  const { getToken } = useAuth();
  
  // Use useMemo to cache the client instance based on getToken function
  // This prevents creating multiple instances on re-renders
  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            let clerkToken = null;
            
            if (USE_JWT_TEMPLATE) {
              clerkToken = await getToken({
                template: JWT_TEMPLATE_NAME
              });
            }

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
  }, [getToken]); // Recreate only when getToken function changes
};

// Export the default createClient function for compatibility
export { createBrowserClient as createClient };