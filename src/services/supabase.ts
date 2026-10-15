import { createClient } from '@supabase/supabase-js';

const globalEnv = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env;
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (globalEnv || {});

const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim();
const supabasePublishableKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

function isValidSupabaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.host);
  } catch {
    return false;
  }
}

export const supabaseConfigurationIssue: 'missing' | 'invalid-url' | null =
  !supabaseUrl || !supabasePublishableKey
    ? 'missing'
    : !isValidSupabaseUrl(supabaseUrl)
      ? 'invalid-url'
      : null;
export const isSupabaseConfigured = supabaseConfigurationIssue === null;

if (!isSupabaseConfigured) {
  if (globalEnv?.NODE_ENV !== 'test') {
    console.warn('Supabase environment variables missing. Please check your .env file.');
  }
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-anon-key',
);
