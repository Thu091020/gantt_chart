/**
 * Supabase integration hooks
 */

import { useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

let cachedSupabaseClient: any = null;

export function useSupabaseClient() {
  // Use cached client to avoid creating multiple instances
  if (!cachedSupabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // Log warning but don't throw - will use mock adapter instead
      console.warn(
        'Missing Supabase environment variables. Using mock data for Gantt feature. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable real data.'
      );
      // Return a mock client object that indicates mock mode
      return { _isMock: true } as any;
    }

    cachedSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return cachedSupabaseClient;
}
