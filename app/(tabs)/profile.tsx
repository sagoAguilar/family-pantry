import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { isAppleAuthAvailable, useAuth } from '../../contexts/auth-context';

export default function ProfileScreen() {
  const { user, session, signIn, signInWithGoogle, signInWithApple, signOut } = useAuth();

  // If logged in, show profile
  if (session && user) {
    return <LoggedInView user={user} signOut={signOut} />;
  }

  // If not logged in, show login options
  return <LoggedOutView signIn={signIn} signInWithGoogle={signInWithGoogle} signInWithApple={signInWithApple} />;
}

function LoggedInView({ user, signOut }: { user: any; signOut: () => Promise<void> }) {
  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email ?? 'Not set'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValueSmall}>{user?.id ?? 'Unknown'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.versionText}>Family Pantry v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function LoggedOutView({
  signIn,
  signInWithGoogle,
  signInWithApple,
}: {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleGoogleSignIn() {
    setSocialLoading('google');
    const { error } = await signInWithGoogle();
    setSocialLoading(null);

    if (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleAppleSignIn() {
    setSocialLoading('apple');
    const { error } = await signInWithApple();
    setSocialLoading(null);

    if (error) {
      Alert.alert('Error', error.message);
    }
  }

  const isLoading = loading || socialLoading !== null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptTitle}>Sign in to your account</Text>
          <Text style={styles.loginPromptText}>
            Access your family's inventory and shopping lists
          </Text>
        </View>

        <View style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.socialButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            {socialLoading === 'google' ? (
              <ActivityIndicator color="#374151" />
            ) : (
              <>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {isAppleAuthAvailable() && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton, isLoading && styles.buttonDisabled]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              {socialLoading === 'apple' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.appleIcon}></Text>
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.signUpLink}
          onPress={() => router.push('/(auth)/signup')}
          disabled={isLoading}
        >
          <Text style={styles.signUpLinkText}>
            Don't have an account? <Text style={styles.signUpLinkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.versionText}>Family Pantry v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
  },
  infoValueSmall: {
    fontSize: 12,
    color: '#111827',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  signOutButton: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
  },
  // Logged out styles
  loginPrompt: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleIcon: {
    fontSize: 18,
    color: '#fff',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signUpLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpLinkText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signUpLinkBold: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
