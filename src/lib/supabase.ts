import { createClient, SupabaseClient } from '@supabase/supabase-js';

export let supabase: SupabaseClient | null = null;
let initPromise: Promise<boolean> | null = null;

export const initSupabase = (): Promise<boolean> => {
  if (supabase) return Promise.resolve(true);
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      const res = await fetch('/api/config');
      const config = await res.json();
      if (config.supabaseUrl && config.supabaseAnonKey) {
        supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        return true;
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
    return false;
  })();
  return initPromise;
};
