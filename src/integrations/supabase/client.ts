import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

let supabase: SupabaseClient<Database> | null = null;
let supabaseError: Error | null = null;

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anonymous key are required in .env file.');
  }

  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error("Supabase client initialization error:", error);
  supabaseError = error instanceof Error ? error : new Error('An unknown error occurred during Supabase initialization.');
}

export { supabase, supabaseError };
