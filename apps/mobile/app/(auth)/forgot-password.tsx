import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/expo';
import { Text, View } from '@/components/Themed';
import { useAuthStyles } from '@/components/AuthStyles';

export default function ForgotPasswordScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const styles = useAuthStyles();

  const [emailAddress, setEmailAddress] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const sendCode = async () => {
    if (!signIn || !emailAddress) return;
    const { error: createError } = await signIn.create({ identifier: emailAddress });
    if (createError) return;
    const reset = signIn.resetPasswordEmailCode;
    if (!reset) return;
    const { error: sendError } = await reset.sendCode();
    if (sendError) return;
    setCodeSent(true);
  };

  const verifyCode = async () => {
    if (!signIn?.resetPasswordEmailCode) return;
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (error) return;
  };

  const submitNewPassword = async () => {
    if (!signIn?.resetPasswordEmailCode) return;
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password });
    if (error) return;
    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: () => {
          router.replace('/(tabs)');
        },
      });
    }
  };

  if (!signIn) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (signIn.status === 'needs_new_password') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { marginTop: 0 }]}>Set new password</Text>
          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            value={password}
            placeholder="Enter your new password"
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
              (!password || fetchStatus === 'fetching') && styles.buttonDisabled,
              pressed && { opacity: 0.8 },
            ]}
            onPress={submitNewPassword}
            disabled={!password || fetchStatus === 'fetching'}
          >
            {fetchStatus === 'fetching' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Set new password</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (codeSent && signIn.status !== 'needs_new_password') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { marginTop: 0 }]}>Check your email</Text>
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
            onPress={verifyCode}
            disabled={fetchStatus === 'fetching'}
          >
            {fetchStatus === 'fetching' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify code</Text>
            )}
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
        <Text style={[styles.title, { marginTop: 0 }]}>Forgot password?</Text>
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
        {errors?.fields?.identifier && (
          <Text style={styles.error}>{errors.fields.identifier.message}</Text>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            (!emailAddress || fetchStatus === 'fetching') && styles.buttonDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={sendCode}
          disabled={!emailAddress || fetchStatus === 'fetching'}
        >
          {fetchStatus === 'fetching' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send reset code</Text>
          )}
        </Pressable>
        <View style={styles.linkContainer}>
          <Link href={'/(auth)/login' as Href} asChild>
            <Pressable>
              <Text style={styles.secondaryButtonText}>Back to sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
