'use client';

import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
}

export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user as AuthUser | null;
};

export const isAdmin = (user: AuthUser | null): boolean => {
  return user?.email === 'admin@cleanouts.com' || user?.user_metadata?.role === 'admin';
};