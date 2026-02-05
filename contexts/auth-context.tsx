import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  familyId: string | null;
  loading: boolean;
  needsFamily: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, familyName: string, userName: string) => Promise<{ error: Error | null }>;
  createFamily: (familyName: string, userName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsFamily, setNeedsFamily] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchFamilyId(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchFamilyId(session.user.id);
        } else {
          setFamilyId(null);
          setNeedsFamily(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchFamilyId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', userId)
        .single();

      if (error || !data?.family_id) {
        console.log('No family found for user');
        setFamilyId(null);
        setNeedsFamily(true);
      } else {
        setFamilyId(data.family_id);
        setNeedsFamily(false);
      }
    } catch (err) {
      console.error('Error fetching family:', err);
      setFamilyId(null);
      setNeedsFamily(true);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signUp(
    email: string,
    password: string,
    familyName: string,
    userName: string
  ) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create family and link user using RPC
      // (Wait for session to be established if auto-confirm is on)
      if (authData.session) {
        const { data: familyId, error: rpcError } = await supabase
          .rpc('create_new_family', {
            family_name: familyName,
            user_name: userName,
          });

        if (rpcError) throw rpcError;

        // Update local state
        setFamilyId(familyId);
        setNeedsFamily(false);
      } else {
        // If no session (email confirmation required), we can't run the RPC yet.
        // User will complete profile after login.
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function createFamily(familyName: string, userName: string) {
    try {
      if (!user) throw new Error('No user logged in');

      // Call RPC to create family and link user atomically
      const { data: newFamilyId, error: rpcError } = await supabase
        .rpc('create_new_family', {
          family_name: familyName,
          user_name: userName,
        });

      if (rpcError) throw rpcError;

      // Update local state
      setFamilyId(newFamilyId);
      setNeedsFamily(false);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setFamilyId(null);
    setNeedsFamily(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        familyId,
        loading,
        needsFamily,
        signIn,
        signUp,
        createFamily,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
