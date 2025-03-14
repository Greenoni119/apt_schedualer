'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Create a context to share the Supabase client throughout the app
export interface SupabaseContext {
  supabase: SupabaseClient;
}

const Context = createContext<SupabaseContext | undefined>(undefined);

export interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
}

// Create a custom hook to use the Supabase client
export function useSupabase() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}