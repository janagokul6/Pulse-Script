import { tokenCache } from '@/lib/clerkTokenCache';
import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/expo';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (data: string) => void };
  }
}

function WebViewAuthBridge() {
  const { isSignedIn, getToken } = useClerkAuth();
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.ReactNativeWebView) return;
    if (!isSignedIn) return;
    let cancelled = false;
    getToken()
      .then((token) => {
        if (cancelled || !token) return;
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'clerk-auth', token }));
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);
  return null;
}

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();

const envKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!envKey) throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
const publishableKey: string = envKey;

/** Set to true to temporarily skip auth redirects and browse the UI without signing in */
const SKIP_AUTH_GUARD = false;

function AuthGuard() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (SKIP_AUTH_GUARD || !isLoaded) return;
    const inAuth = segments[0] === '(auth)';
    if (!isSignedIn && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts(
    Platform.OS === 'web'
      ? {}
      : {
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
      }
  );

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (Platform.OS !== 'web' && loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthGuard />
            {Platform.OS === 'web' && <WebViewAuthBridge />}
            <RootLayoutNav />
          </AuthProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="post/[id]" options={{ headerShown: false, title: 'Case' }} />
        <Stack.Screen name="user/[id]" options={{ headerShown: true, title: 'Profile' }} />
        <Stack.Screen name="admin" options={{ headerShown: true, title: 'Moderation' }} />
      </Stack>
    </ThemeProvider>
  );
}
