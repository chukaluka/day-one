import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/src/lib/supabase";

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initialized: boolean;

  initializeAuth: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

let authSubscription: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  initialized: false,

  initializeAuth: async () => {
    if (authSubscription) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        initialized: true,
      });
    });

    authSubscription = subscription;

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        initialized: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        initialized: true,
      });

      throw error;
    }
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) throw error;
  },
}));
