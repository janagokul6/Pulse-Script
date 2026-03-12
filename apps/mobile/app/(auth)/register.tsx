import { useAuthStyles } from '@/components/AuthStyles';
import { Text, View } from '@/components/Themed';
import { useAuth, useSignUp } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';

export default function RegisterScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const styles = useAuthStyles();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    if (!signUp || !emailAddress || !password) return;
    const { error } = await signUp.password({
      emailAddress,
      password,
    });
    if (error) return;
    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    if (!signUp) return;
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: () => {
          router.replace('/(tabs)');
        },
      });
    }
  };

  if (signUp?.status === 'complete' || isSignedIn) {
    return null;
  }

  const needsCode =
    signUp?.status === 'missing_requirements' &&
    signUp.unverifiedFields?.includes('email_address') &&
    signUp.missingFields?.length === 0;

  if (!signUp) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (needsCode) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { marginTop: 0 }]}>Verify your account</Text>
          <Text style={styles.label}>Verification code</Text>
          <TextInput
            style={styles.input}
            value={code}
            placeholder="Enter the code sent to your email"
            placeholderTextColor={styles.placeholderColor}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          {errors?.fields?.code && (
            <Text style={styles.error}>{errors.fields.code.message}</Text>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              fetchStatus === 'fetching' && styles.buttonDisabled,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleVerify}
            disabled={fetchStatus === 'fetching'}
          >
            {fetchStatus === 'fetching' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.8 }]}
            onPress={() => signUp.verifications.sendEmailCode()}
          >
            <Text style={styles.secondaryButtonText}>Send new code</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { marginTop: 0 }]}>Sign up</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter your email"
          placeholderTextColor={styles.placeholderColor}
          onChangeText={setEmailAddress}
          keyboardType="email-address"
        />
        {errors?.fields?.emailAddress && (
          <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>
        )}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Enter your password"
          placeholderTextColor={styles.placeholderColor}
          secureTextEntry
          onChangeText={setPassword}
        />
        {errors?.fields?.password && (
          <Text style={styles.error}>{errors.fields.password.message}</Text>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            (!emailAddress || !password || fetchStatus === 'fetching') && styles.buttonDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleSubmit}
          disabled={!emailAddress || !password || fetchStatus === 'fetching'}
        >
          {fetchStatus === 'fetching' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>
        <View nativeID="clerk-captcha" />
        <View style={styles.linkContainer}>
          <Text>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={styles.secondaryButtonText}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
