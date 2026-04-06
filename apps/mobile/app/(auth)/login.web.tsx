import Colors from '@/constants/Colors';
import { toFriendlyAuthMessage, validateAuthForm } from '@/lib/authValidation';
import { useSignIn, useSignUp, useSSO } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const CLERK_IDENTIFIER_NOT_FOUND = 'form_identifier_not_found';
function isIdentifierNotFound(error: unknown): boolean {
  const e = error as { code?: string; errors?: Array<{ code?: string }> };
  return e?.code === CLERK_IDENTIFIER_NOT_FOUND || e?.errors?.[0]?.code === CLERK_IDENTIFIER_NOT_FOUND;
}

function clerkErrorMessage(error: unknown): string {
  const e = error as any;
  return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? e?.message ?? 'Something went wrong.';
}

const GRID_IMAGES = [
  'https://media.screensdesign.com/gasset/1ac73c64-864a-42da-8785-e0e05c488089.png',
  'https://images.unsplash.com/photo-1638202993928-7267aad84c31',
  'https://media.screensdesign.com/gasset/982097d4-f5a0-44b3-972c-c3eaaede7f1a.png',
  'https://media.screensdesign.com/gasset/2f529e04-cdc0-4b82-9c3f-1d1ba4e6690d.png',
  'https://media.screensdesign.com/gasset/6c5dd5a4-f9d9-4d83-8878-29bbc0f68675.png',
  'https://images.unsplash.com/photo-1640876777002-badf6aee5bcc',
  'https://media.screensdesign.com/gasset/bf210e28-5976-49c5-b0ed-8c8d93c36006.png',
  'https://images.unsplash.com/photo-1550831107-1553da8c8464',
];

type PendingVerification = 'signIn' | 'signUp' | null;

export default function LoginWebScreen() {
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<PendingVerification>(null);
  const [error, setError] = useState<string | null>(null);

  const isFetching = signInFetchStatus === 'fetching' || signUpFetchStatus === 'fetching';

  // ── SSO ────────────────────────────────────────────────────────────────

  const handleSSO = useCallback(async (strategy: 'oauth_google' | 'oauth_apple') => {
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('SSO error', err);
      setError('Sign-in was cancelled or failed. Please try again.');
    }
  }, [startSSOFlow, router]);

  // ── Email + OTP ───────────────────────────────────────────────────────

  const handleSendCode = useCallback(async () => {
    setError(null);
    const validation = validateAuthForm(emailAddress.trim());
    if (!validation.valid) { setError(validation.message); return; }
    if (!signIn || !signUp) return;

    const identifier = emailAddress.trim();

    const { error: sendErr } = await signIn.emailCode.sendCode({ emailAddress: identifier });
    if (!sendErr) { setPending('signIn'); return; }

    if (isIdentifierNotFound(sendErr)) {
      try {
        const signUpAny = signUp as any;
        const { error: createErr } = await signUpAny.create({ emailAddress: identifier });
        if (createErr) { setError(toFriendlyAuthMessage(clerkErrorMessage(createErr)) ?? clerkErrorMessage(createErr)); return; }
        if (signUp.status === 'complete') { await signUp.finalize({ navigate: () => router.replace('/(tabs)') }); return; }
        if (signUp.unverifiedFields?.includes('email_address')) {
          await signUp.verifications.sendEmailCode();
          setPending('signUp');
          return;
        }
        setError('Could not send verification code. Please try again.');
      } catch (e) {
        console.error('[auth:web] signUp.create exception', e);
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
        const { error: err } = await signIn.emailCode.verifyCode({ code });
        if (err) { setError(toFriendlyAuthMessage(clerkErrorMessage(err)) ?? clerkErrorMessage(err)); return; }
        if (signIn.status === 'complete') { await signIn.finalize({ navigate: () => router.replace('/(tabs)') }); return; }
        setError('Additional verification required.');
        return;
      }
      if (pending === 'signUp' && signUp) {
        const { error: err } = await signUp.verifications.verifyEmailCode({ code });
        if (err) { setError(toFriendlyAuthMessage(clerkErrorMessage(err)) ?? clerkErrorMessage(err)); return; }
        if (signUp.status === 'complete') { await signUp.finalize({ navigate: () => router.replace('/(tabs)') }); return; }
        const { error: fErr } = await signUp.finalize({ navigate: () => router.replace('/(tabs)') });
        if (!fErr) return;
        setError('Email verified but could not complete sign-up.');
      }
    } catch (e) {
      console.error('[auth:web] verifyCode exception', e);
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
    } catch { setError('Could not resend code.'); }
  }, [pending, signIn, signUp, emailAddress]);

  const handleStartOver = useCallback(() => {
    setError(null); setCode(''); setPending(null);
    if (signIn) signIn.reset();
    if (signUp) (signUp as any).reset?.();
  }, [signIn, signUp]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={s.container}>
      <View style={s.card}>
        <View style={s.gridContainer}>
          <View style={s.grid}>
            {GRID_IMAGES.map((uri, i) => <Image key={i} source={{ uri }} style={s.gridImage} />)}
          </View>
          <View style={s.overlay} />
        </View>

        <View style={s.content}>
          <View style={s.titleSection}>
            <Text style={s.title}>AUTHORIZED ACCESS</Text>
            <View style={s.titleUnderline} />
          </View>

          {/* Email input */}
          <View style={s.form}>
            <View style={s.inputWrapper}>
              <Image
                source={{ uri: 'https://img.icons8.com/material-rounded/48/737373/user.png' }}
                style={s.inputIcon}
              />
              <TextInput
                style={s.input}
                placeholder="Email Address"
                value={emailAddress}
                onChangeText={(t) => { setEmailAddress(t); setError(null); }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!pending}
              />
            </View>
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          {!pending && (
            <Pressable
              style={({ pressed }) => [s.primaryButton, (!emailAddress.trim() || isFetching) && s.buttonDisabled, pressed && { opacity: 0.9 }]}
              onPress={handleSendCode}
              disabled={!emailAddress.trim() || isFetching}
            >
              {isFetching ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>ACCESS</Text>}
            </Pressable>
          )}

          {pending && (
            <View style={s.otpSection}>
           
              <TextInput
                style={s.otpInput}
                value={code}
                placeholder="••••••"
                onChangeText={(v) => { setCode(v.replace(/[^0-9]/g, '').slice(0, 6)); setError(null); }}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <Pressable
                style={({ pressed }) => [s.primaryButton, (code.length < 6 || isFetching) && s.buttonDisabled, pressed && { opacity: 0.9 }]}
                onPress={handleVerifyCode}
                disabled={code.length < 6 || isFetching}
              >
                {isFetching ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>VERIFY</Text>}
              </Pressable>
              <View style={s.otpActions}>
                <Pressable onPress={handleResendCode}><Text style={s.linkText}>Resend code</Text></Pressable>
                <Pressable onPress={handleStartOver}><Text style={s.linkText}>Change email</Text></Pressable>
              </View>
            </View>
          )}

          <View nativeID="clerk-captcha" id="clerk-captcha" />

          <View style={s.socialSection}>
            <Pressable
              style={({ pressed }) => [s.socialButton, pressed && { backgroundColor: '#f3f4f6' }]}
              onPress={() => handleSSO('oauth_google')}
            >
              <Image
                source={{ uri: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png' }}
                style={{ width: 24, height: 24, resizeMode: 'contain' }}
              />
              <Text style={s.socialButtonText}>GOOGLE</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.socialButton, pressed && { backgroundColor: '#f3f4f6' }]}
              onPress={() => handleSSO('oauth_apple')}
            >
              <Text style={{ fontSize: 18 }}></Text>
              <Text style={s.socialButtonText}>APPLE</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  gridContainer: { height: 200, position: 'relative' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', height: '100%' },
  gridImage: { width: '25%', height: '50%' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%', backgroundColor: Colors.light.tint, opacity: 0.3 },
  content: { padding: 40 },
  titleSection: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 20, fontWeight: '900', color: '#111827' },
  titleUnderline: { height: 3, width: 40, backgroundColor: Colors.light.tint, marginTop: 8 },
  form: { gap: 16, marginBottom: 16 },
  inputWrapper: { position: 'relative', height: 50, justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 12, width: 16, height: 16, zIndex: 1 },
  input: { height: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingLeft: 40, paddingRight: 16, fontSize: 14, fontWeight: '600' },
  errorText: { color: '#d32f2f', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  primaryButton: { height: 50, backgroundColor: Colors.light.tint, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  buttonDisabled: { opacity: 0.6 },
  otpSection: { marginBottom: 16 },
  otpLabel: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
  otpInput: { height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, fontSize: 20, fontWeight: '700', textAlign: 'center', letterSpacing: 8, marginBottom: 16, paddingLeft: 16, paddingRight: 16 },
  otpActions: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 16 },
  linkText: { color: Colors.light.tint, fontWeight: '600', fontSize: 14 },
  socialSection: { flexDirection: 'row', gap: 12 },
  socialButton: { flex: 1, height: 44, borderRadius: 10, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  socialButtonText: { fontSize: 11, fontWeight: '700', color: '#111827' },
});
