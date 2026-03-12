import { useAuthStyles } from '@/components/AuthStyles';
import { Text, View } from '@/components/Themed';
import { useSignIn } from '@clerk/expo';
import type { Href } from 'expo-router';
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

export default function LoginScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const styles = useAuthStyles();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    if (!signIn || !emailAddress || !password) return;
    const { error } = await signIn.password({
      emailAddress,
      password,
    });
    if (error) return;

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: () => {
          router.replace('/(tabs)');
        },
      });
    } else if (signIn.status === 'needs_second_factor') {
      // MFA flow - send email code if supported
      const emailFactor = signIn.supportedSecondFactors?.find(
        (f: { strategy: string }) => f.strategy === 'email_code'
      );
      if (emailFactor) await signIn.mfa.sendEmailCode();
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (f: { strategy: string }) => f.strategy === 'email_code'
      );
      if (emailCodeFactor) await signIn.mfa.sendEmailCode();
    }
  };

  const handleVerify = async () => {
    if (!signIn) return;
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: () => {
          router.replace('/(tabs)');
        },
      });
    }
  };

  const needsVerification =
    signIn?.status === 'needs_client_trust' || signIn?.status === 'needs_second_factor';

  if (!signIn) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (needsVerification) {
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
            onPress={() => signIn?.mfa.sendEmailCode()}
          >
            <Text style={styles.secondaryButtonText}>Send new code</Text>
          </Pressable>
          <View style={styles.linkContainer}>
            <Pressable onPress={() => signIn?.reset()}>
              <Text style={styles.secondaryButtonText}>Start over</Text>
            </Pressable>
          </View>
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
        <Text style={[styles.title, { marginTop: 0 }]}>Sign in</Text>
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
        <View style={styles.linkContainer}>
          <Link href={'/(auth)/forgot-password' as Href} asChild>
            <Pressable>
              <Text style={styles.secondaryButtonText}>Forgot password?</Text>
            </Pressable>
          </Link>
        </View>
        <View style={styles.linkContainer}>
          <Text>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={styles.secondaryButtonText}>Sign up</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
