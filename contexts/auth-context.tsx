import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  familyId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, familyName: string, userName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

      if (error) {
        console.log('No family found for user:', error.message);
        setFamilyId(null);
      } else {
        setFamilyId(data?.family_id ?? null);
      }
    } catch (err) {
      console.error('Error fetching family:', err);
      setFamilyId(null);
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

      // 2. Create family
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName })
        .select()
        .single();
      if (familyError) throw familyError;

      // 3. Link user to family
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        family_id: familyData.id,
        name: userName,
        role: 'admin',
      });
      if (userError) throw userError;

      // Update local state
      setFamilyId(familyData.id);

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
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        familyId,
        loading,
        signIn,
        signUp,
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
