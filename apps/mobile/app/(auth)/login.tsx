import { useAuthStyles } from '@/components/AuthStyles';
import { Text, View } from '@/components/Themed';
import { useSignIn, useSignUp, useSSO } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

import Colors from '@/constants/Colors';
import { toFriendlyAuthMessage, validateAuthForm } from '@/lib/authValidation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

const CLERK_IDENTIFIER_NOT_FOUND = 'form_identifier_not_found';
function isIdentifierNotFound(error: unknown): boolean {
  const e = error as { code?: string; errors?: Array<{ code?: string }> };
  return e?.code === CLERK_IDENTIFIER_NOT_FOUND || e?.errors?.[0]?.code === CLERK_IDENTIFIER_NOT_FOUND;
}

function clerkErrorMessage(error: unknown): string {
  const e = error as any;
  return (
    e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? e?.message ?? 'Something went wrong.'
  );
}

const GRID_IMAGES = [
  'https://media.screensdesign.com/gasset/1ac73c64-864a-42da-8785-e0e05c488089.png',
  'https://images.unsplash.com/photo-1638202993928-7267aad84c31',
  'https://media.screensdesign.com/gasset/982097d4-f5a0-44b3-972c-c3eaaede7f1a.png',
  'https://media.screensdesign.com/gasset/2f529e04-cdc0-4b82-9c3f-1d1ba4e6690d.png',
  'https://media.screensdesign.com/gasset/6c5dd5a4-f9d9-4d83-8878-29bbc0f68675.png',
  'https://media.screensdesign.com/gasset/2f0e2daf-09b9-4b49-b399-a585600c6405.png',
  'https://media.screensdesign.com/gasset/bf210e28-5976-49c5-b0ed-8c8d93c36006.png',
  'https://images.unsplash.com/photo-1550831107-1553da8c8464',
];

type PendingVerification = 'signIn' | 'signUp' | null;

export default function LoginScreen() {
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const styles = useAuthStyles();

  const [emailAddress, setEmailAddress] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<PendingVerification>(null);
  const [error, setError] = useState<string | null>(null);

  const isFetching = signInFetchStatus === 'fetching' || signUpFetchStatus === 'fetching';

  // ── SSO (Google / Apple) ──────────────────────────────────────────────

  const handleSSOResult = useCallback(
    async (provider: string, result: Awaited<ReturnType<typeof startSSOFlow>>) => {
      const { createdSessionId, setActive, authSessionResult, signIn: ssoSignIn, signUp: ssoSignUp } = result as any;
      console.log(`[auth] ${provider} SSO result`, {
        createdSessionId, authSessionResult: authSessionResult?.type,
        signInStatus: ssoSignIn?.status, signUpStatus: ssoSignUp?.status,
      });

      if (authSessionResult?.type === 'dismiss' || authSessionResult?.type === 'cancel') return;

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
        return;
      }

      // New user — need to create account from SSO identity
      const ssoStartedSignUp =
        signUp && (signUp.status === 'missing_requirements' || ssoSignUp?.status === 'missing_requirements');
      const needsNewAccount =
        signUp && !createdSessionId &&
        (ssoSignIn?.status === 'needs_identifier' ||
          ssoSignIn?.firstFactorVerification?.status === 'transferable' ||
          ssoStartedSignUp);

      if (needsNewAccount && signUp) {
        const signUpAny = signUp as any;
        try {
          // Step 1: try transfer (moves external-account from signIn → signUp)
          if (!ssoStartedSignUp) {
            console.log(`[auth] ${provider} SSO: creating account via transfer`);
            const { error: transferErr } = await signUpAny.create({ transfer: true });
            if (transferErr) {
              console.log(`[auth] ${provider} SSO: transfer failed, trying direct create`, clerkErrorMessage(transferErr));
              // Step 2: transfer failed — try direct sign-up with the email from SSO
              const ssoEmail =
                ssoSignUp?.emailAddress ?? ssoSignIn?.identifier ??
                ssoSignIn?.userData?.emailAddress ?? signUp.emailAddress ?? null;
              if (ssoEmail) {
                const { error: createErr } = await signUpAny.create({ emailAddress: ssoEmail });
                if (createErr) {
                  setError(toFriendlyAuthMessage(clerkErrorMessage(createErr)) ?? clerkErrorMessage(createErr));
                  return;
                }
              } else {
                setError(`Could not retrieve email from ${provider}. Please use email sign-in.`);
                return;
              }
            }
          } else {
            // SSO already started a sign-up — fill any missing email
            const ssoEmail = ssoSignUp?.emailAddress ?? signUp.emailAddress ?? null;
            if (signUp.missingFields?.includes('email_address') && ssoEmail) {
              console.log(`[auth] ${provider} SSO: filling missing email`);
              await signUpAny.update({ emailAddress: ssoEmail });
            }
          }

          // Complete sign-up
          console.log(`[auth] ${provider} SSO: sign-up status after create/update`, signUp.status);

          if (signUp.status === 'complete') {
            await signUp.finalize({ navigate: () => router.replace('/(tabs)') });
            return;
          }
          if (signUp.status === 'missing_requirements') {
            if (signUp.unverifiedFields?.includes('email_address')) {
              await signUp.verifications.sendEmailCode();
              setPending('signUp');
              return;
            }
            // Try finalize — remaining fields may be optional
            const { error: fErr } = await signUp.finalize({ navigate: () => router.replace('/(tabs)') });
            if (!fErr) return;
            console.log(`[auth] ${provider} SSO: finalize failed, missing`, signUp.missingFields);
          }
          setError('Could not complete sign-up. Please try email sign-in instead.');
        } catch (e) {
          console.error(`[auth] ${provider} SSO exception`, e);
          setError(`Something went wrong with ${provider}. Please try again.`);
        }
        return;
      }

      // Existing user, different provider — transfer to sign-in
      if (ssoSignUp?.verifications?.externalAccount?.status === 'transferable' && signIn) {
        try {
          await signIn.create({ transfer: true });
          if (signIn.status === 'complete') {
            await signIn.finalize({ navigate: () => router.replace('/(tabs)') });
            return;
          }
        } catch (e) {
          console.error(`[auth] ${provider} SSO sign-in transfer failed`, e);
          setError('Could not sign in with this account. Please try another method.');
          return;
        }
      }

      if (ssoSignIn?.status === 'needs_second_factor') return;

      console.log(`[auth] ${provider} SSO: unhandled state`);
    },
    [signIn, signUp, router],
  );

  const onGooglePress = useCallback(async () => {
    setError(null);
    try {
      const result = await startSSOFlow({ strategy: 'oauth_google' });
      await handleSSOResult('Google', result);
    } catch (err) { console.error('[auth] Google SSO error', err); }
  }, [startSSOFlow, handleSSOResult]);

  const onApplePress = useCallback(async () => {
    setError(null);
    try {
      const result = await startSSOFlow({ strategy: 'oauth_apple' });
      await handleSSOResult('Apple', result);
    } catch (err) { console.error('[auth] Apple SSO error', err); }
  }, [startSSOFlow, handleSSOResult]);

  // ── Email + OTP ───────────────────────────────────────────────────────

  const handleSendCode = useCallback(async () => {
    setError(null);
    const validation = validateAuthForm(emailAddress.trim());
    if (!validation.valid) { setError(validation.message); return; }
    if (!signIn || !signUp) return;

    const identifier = emailAddress.trim();

    // Try sign-in first (existing user)
    const { error: sendErr } = await signIn.emailCode.sendCode({ emailAddress: identifier });
    if (!sendErr) {
      setPending('signIn');
      return;
    }

    // User not found — create sign-up and send verification code
    if (isIdentifierNotFound(sendErr)) {
      try {
        const signUpAny = signUp as any;
        const { error: createErr } = await signUpAny.create({ emailAddress: identifier });
        if (createErr) {
          setError(toFriendlyAuthMessage(clerkErrorMessage(createErr)) ?? clerkErrorMessage(createErr));
          return;
        }
        if (signUp.status === 'complete') {
          await signUp.finalize({ navigate: () => router.replace('/(tabs)') });
          return;
        }
        if (signUp.unverifiedFields?.includes('email_address')) {
          await signUp.verifications.sendEmailCode();
          setPending('signUp');
          return;
        }
        setError('Could not send verification code. Please try again.');
      } catch (e) {
        console.error('[auth] signUp.create exception', e);
        setError('Something went wrong. Please try again.');
      }
      return;
    }

    setError(toFriendlyAuthMessage(clerkErrorMessage(sendErr)) ?? clerkErrorMessage(sendErr));
  }, [emailAddress, signIn, signUp, router]);

  const handleVerifyCode = useCallback(async () => {
    setError(null);
    if (!code || code.length < 6) { setError('Please enter the 6-digit code.'); return; }

    try {
      if (pending === 'signIn' && signIn) {
        const { error: verifyErr } = await signIn.emailCode.verifyCode({ code });
        if (verifyErr) { setError(toFriendlyAuthMessage(clerkErrorMessage(verifyErr)) ?? clerkErrorMessage(verifyErr)); return; }
        if (signIn.status === 'complete') {
          await signIn.finalize({ navigate: () => router.replace('/(tabs)') });
          return;
        }
        setError('Additional verification required. Please try again.');
        return;
      }

      if (pending === 'signUp' && signUp) {
        const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });
        if (verifyErr) { setError(toFriendlyAuthMessage(clerkErrorMessage(verifyErr)) ?? clerkErrorMessage(verifyErr)); return; }
        if (signUp.status === 'complete') {
          await signUp.finalize({ navigate: () => router.replace('/(tabs)') });
          return;
        }
        if (signUp.status === 'missing_requirements') {
          // Try finalize — remaining fields may be optional
          const { error: fErr } = await signUp.finalize({ navigate: () => router.replace('/(tabs)') });
          if (!fErr) return;
          setError('Email verified but additional info is required. Please try Google/Apple sign-in.');
          return;
        }
        setError('Unexpected state. Please try again.');
      }
    } catch (e) {
      console.error('[auth] verifyCode exception', e);
      setError('Something went wrong. Please try again.');
    }
  }, [code, pending, signIn, signUp, router]);

  const handleResendCode = useCallback(async () => {
    setError(null);
    try {
      if (pending === 'signIn' && signIn) {
        const { error: err } = await signIn.emailCode.sendCode({ emailAddress: emailAddress.trim() });
        if (err) setError(clerkErrorMessage(err));
      } else if (pending === 'signUp' && signUp) {
        const { error: err } = await signUp.verifications.sendEmailCode();
        if (err) setError(clerkErrorMessage(err));
      }
    } catch (e) {
      setError('Could not resend code. Please try again.');
    }
  }, [pending, signIn, signUp, emailAddress]);

  const handleStartOver = useCallback(() => {
    setError(null);
    setCode('');
    setPending(null);
    if (signIn) signIn.reset();
    if (signUp) (signUp as any).reset?.();
  }, [signIn, signUp]);

  // ── Loading guard ─────────────────────────────────────────────────────

  if (!signIn || !signUp) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Grid */}
        <View style={customStyles.gridContainer}>
          <View style={customStyles.grid}>
            {GRID_IMAGES.map((uri, index) => (
              <Image key={index} source={{ uri }} style={customStyles.gridImage} />
            ))}
          </View>
          <View style={customStyles.overlay} />
          <View style={customStyles.gradientOverlay} />
        </View>

        {/* Content */}
        <View style={customStyles.contentContainer}>
          <View style={customStyles.titleSection}>
            <Text style={customStyles.title}>AUTHORIZED ACCESS</Text>
            <View style={customStyles.titleUnderline} />
          </View>

          {/* Email input — always visible */}
          <View style={customStyles.formSection}>
            <View style={customStyles.inputWrapper}>
              <Image
                source={{ uri: 'https://img.icons8.com/material-rounded/48/737373/user.png' }}
                style={customStyles.inputIcon}
              />
              <TextInput
                style={customStyles.input}
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Email Address"
                placeholderTextColor={Colors.light.secondary}
                onChangeText={(t) => { setEmailAddress(t); setError(null); }}
                keyboardType="email-address"
                editable={!pending}
              />
            </View>
          </View>

          {error ? <Text style={customStyles.errorText}>{error}</Text> : null}

          {/* Before OTP sent — show ACCESS button */}
          {!pending && (
            <Pressable
              style={({ pressed }) => [
                customStyles.primaryButton,
                (!emailAddress.trim() || isFetching) && customStyles.buttonDisabled,
                pressed && { opacity: 0.9, transform: [{ translateY: 2 }] },
              ]}
              onPress={handleSendCode}
              disabled={!emailAddress.trim() || isFetching}
            >
              {isFetching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={customStyles.primaryButtonText}>ACCESS</Text>
              )}
            </Pressable>
          )}

          {/* After OTP sent — show verification section */}
          {pending && (
            <View style={customStyles.otpSection}>
            
              <TextInput
                style={customStyles.otpInput}
                value={code}
                placeholder="••••••"
                placeholderTextColor={Colors.light.secondary}
                onChangeText={(v) => { setCode(v.replace(/[^0-9]/g, '').slice(0, 6)); setError(null); }}
                keyboardType="number-pad"
                autoCapitalize="none"
                maxLength={6}
                autoFocus
              />
              <Pressable
                style={({ pressed }) => [
                  customStyles.primaryButton,
                  (code.length < 6 || isFetching) && customStyles.buttonDisabled,
                  pressed && { opacity: 0.9, transform: [{ translateY: 2 }] },
                ]}
                onPress={handleVerifyCode}
                disabled={code.length < 6 || isFetching}
              >
                {isFetching ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={customStyles.primaryButtonText}>VERIFY</Text>
                )}
              </Pressable>
              <View style={customStyles.otpActions}>
                <Pressable onPress={handleResendCode} disabled={isFetching}>
                  <Text style={customStyles.linkText}>Resend code</Text>
                </Pressable>
                <Pressable onPress={handleStartOver}>
                  <Text style={customStyles.linkText}>Change email</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Social sign-in — always visible */}
          <View style={customStyles.socialSection}>
            <Pressable
              style={({ pressed }) => [customStyles.socialButton, pressed && { backgroundColor: '#f9fafb', opacity: 0.8 }]}
              onPress={onGooglePress}
            >
              <Image
                source={{ uri: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png' }}
                style={{ width: 24, height: 24, resizeMode: 'contain' }}
              />
              <Text style={customStyles.socialButtonText}>GOOGLE</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [customStyles.socialButton, pressed && { backgroundColor: '#f9fafb', opacity: 0.8 }]}
              onPress={onApplePress}
            >
              <Ionicons name="logo-apple" size={24} color="#000000" />
              <Text style={customStyles.socialButtonText}>APPLE</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const customStyles = StyleSheet.create({
  gridContainer: {
    height: 320, width: '100%', overflow: 'hidden', position: 'relative',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', height: '100%',
  },
  gridImage: {
    width: '25%', height: '50%',
  },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
    backgroundColor: Colors.light.secondary, backdropFilter: 'blur(55px)', opacity: 0.25,
  },
  gradientOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%',
    backgroundColor: 'transparent', overflow: 'hidden',
  },
  contentContainer: {
    flex: 1, paddingHorizontal: 32, marginTop: -32, backgroundColor: '#fff',
    borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 40,
  },
  titleSection: {
    alignItems: 'center', marginBottom: 32,
  },
  title: {
    fontSize: 24, fontWeight: '900', color: '#111827',
  },
  titleUnderline: {
    height: 4, width: 48, backgroundColor: Colors.light.tint, marginTop: 8,
  },
  formSection: {
    gap: 16, marginBottom: 16,
  },
  inputWrapper: {
    position: 'relative', height: 52, justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute', left: 16, zIndex: 1, width: 20, height: 20,
  },
  input: {
    height: '100%', backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb',
    borderRadius: 16, paddingLeft: 48, paddingRight: 16, fontSize: 14,
    fontWeight: '600', color: '#111827',
  },
  errorText: {
    color: '#d32f2f', fontSize: 13, marginBottom: 12, textAlign: 'center',
  },
  primaryButton: {
    height: 48, backgroundColor: Colors.light.tint, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 24,
  },
  primaryButtonText: {
    color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  otpSection: {
    marginBottom: 16,
  },
  otpLabel: {
    fontSize: 13, color: Colors.light.secondary, textAlign: 'center', marginBottom: 12,
  },
  otpInput: {
    height: 52, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb',
    borderRadius: 16, fontSize: 22, fontWeight: '700', color: '#111827',
    textAlign: 'center', letterSpacing: 8, marginBottom: 16,
  },
  otpActions: {
    flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 8,
  },
  linkText: {
    color: Colors.light.tint, fontSize: 13, fontWeight: '600',
  },
  socialSection: {
    flexDirection: 'row', gap: 12,
  },
  socialButton: {
    flex: 1, height: 48, borderRadius: 12, backgroundColor: '#f9fafb',
    borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  socialButtonText: {
    fontSize: 12, fontWeight: '700', color: '#111827',
  },
});
