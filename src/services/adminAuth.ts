import { useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase.ts';

/**
 * Checks whether a given Supabase user possesses authorized administrative privileges.
 * 
 * SECURITY NOTICE:
 * We strictly inspect `app_metadata`, which is server-controlled and signed inside the
 * Supabase JWT. We NEVER trust `user_metadata` (which client users can edit), frontend
 * form parameters, or client-side storage tokens.
 */
export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const appMetadata = user.app_metadata;
  if (!appMetadata || typeof appMetadata !== 'object') return false;

  return appMetadata.role === 'admin' || appMetadata.is_admin === true;
}

export interface AdminLoginResult {
  success: boolean;
  isAdmin?: boolean;
  error?: string;
}

/**
 * Authenticates an administrator via Supabase Auth and validates administrative privileges.
 */
export async function loginAdmin(email: string, password: string): Promise<AdminLoginResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Provide clean, safe user-facing error messages
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return { success: false, error: 'Invalid email or password.' };
      }
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { success: false, error: 'Email address not confirmed. Please check your inbox.' };
      }
      return { success: false, error: 'Unable to sign in. Please try again or contact an administrator.' };
    }

    if (!data.user) {
      return { success: false, error: 'Authentication failed. No user record returned.' };
    }

    const isAdmin = isUserAdmin(data.user);
    if (!isAdmin) {
      // Do not leave an ordinary user's authenticated session active after an admin login attempt.
      await supabase.auth.signOut({ scope: 'local' });
      return {
        success: false,
        isAdmin: false,
        error: 'This account does not have administrative privileges.',
      };
    }

    return {
      success: true,
      isAdmin: true,
    };
  } catch {
    return { success: false, error: 'Unable to sign in. Please try again or contact an administrator.' };
  }
}

/**
 * Signs out the current admin session.
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error signing out:', err);
  }
}

export interface AdminAuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

/**
 * React hook for subscribing to Supabase authentication state and admin authorization.
 */
export function useAdminAuth(): AdminAuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsAdmin(isUserAdmin(session?.user));
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to get Supabase session:', err);
      if (mounted) setLoading(false);
    });

    // 2. Reactive subscription to session changes (login, logout, token refresh, expiration)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsAdmin(isUserAdmin(newSession?.user));
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    isAdmin,
    loading,
    signOut: logoutAdmin,
  };
}
