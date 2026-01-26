import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure Google Sign-In
// You'll need to add your own client IDs from Google Cloud Console
GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

type AuthContextType = {
  session: Session | null;
  user: User | null;
  familyId: string | null;
  loading: boolean;
  needsFamily: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, familyName: string, userName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  createFamilyForSocialUser: (familyName: string, userName: string) => Promise<{ error: Error | null }>;
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
      setNeedsFamily(false);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();

      if (!signInResult.data?.idToken) {
        throw new Error('No ID token returned from Google');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: signInResult.data.idToken,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signInWithApple() {
    try {
      // Generate a random nonce
      const rawNonce = Math.random().toString(36).substring(2, 18);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { error: null }; // User cancelled
      }
      return { error: error as Error };
    }
  }

  async function createFamilyForSocialUser(familyName: string, userName: string) {
    try {
      if (!user) throw new Error('No user logged in');

      // 1. Create family
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName })
        .select()
        .single();
      if (familyError) throw familyError;

      // 2. Link user to family
      const { error: userError } = await supabase.from('users').insert({
        id: user.id,
        family_id: familyData.id,
        name: userName,
        role: 'admin',
      });
      if (userError) throw userError;

      // Update local state
      setFamilyId(familyData.id);
      setNeedsFamily(false);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signOut() {
    await GoogleSignin.signOut().catch(() => {}); // Ignore if not signed in with Google
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
        signInWithGoogle,
        signInWithApple,
        createFamilyForSocialUser,
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

// Helper to check if Apple auth is available
export function isAppleAuthAvailable() {
  return Platform.OS === 'ios';
}
