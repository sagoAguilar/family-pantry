import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/auth-context';

export default function CompleteProfileScreen() {
  const { user, createFamily, signOut } = useAuth();
  const [userName, setUserName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    if (!userName || !familyName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await createFamily(familyName, userName);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    }
    // Navigation is handled by auth state change in _layout.tsx
  }

  async function handleSignOut() {
    await signOut();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Just a few more details to get started
          </Text>
        </View>

        {user?.email && (
          <View style={styles.emailCard}>
            <Text style={styles.emailLabel}>Signed in as</Text>
            <Text style={styles.emailValue}>{user.email}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={userName}
              onChangeText={setUserName}
              autoComplete="name"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Family Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., The Smiths"
              value={familyName}
              onChangeText={setFamilyName}
              editable={!loading}
            />
            <Text style={styles.hint}>
              This will be the name of your household pantry
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get Started</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.signOutText}>Sign out and use a different account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emailCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 24,
  },
  emailLabel: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 16,
    color: '#1e40af',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  signOutText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
