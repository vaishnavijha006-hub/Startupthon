import { createClient } from '@supabase/supabase-js';

const globalEnv = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env;
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (globalEnv || {});

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabasePublishableKey) {
  if (globalEnv?.NODE_ENV !== 'test') {
    console.warn('Supabase environment variables missing. Please check your .env file.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-anon-key',
);