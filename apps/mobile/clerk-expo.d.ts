/**
 * Type declaration for @clerk/expo when TypeScript cannot resolve the package.
 * Provides minimal types for ClerkProvider, useAuth, useSignIn, useSignUp.
 */
declare module '@clerk/expo' {
  import type { ReactNode } from 'react';

  export interface TokenCache {
    getToken: (key: string) => Promise<string | null>;
    saveToken: (key: string, token: string) => Promise<void>;
  }

  export interface ClerkProviderProps {
    publishableKey: string;
    tokenCache?: TokenCache;
    children: ReactNode;
  }

  export function ClerkProvider(props: ClerkProviderProps): JSX.Element;

  export interface UseAuthReturn {
    isLoaded: boolean;
    isSignedIn: boolean | null;
    getToken: (options?: { template?: string }) => Promise<string | null>;
    signOut: () => Promise<void>;
  }

  export function useAuth(options?: unknown): UseAuthReturn;

  type ClerkError = { code?: string; message?: string; errors?: Array<{ code?: string; message?: string }> };

  export type SignInStatus = 'needs_identifier' | 'needs_first_factor' | 'needs_second_factor' | 'needs_client_trust' | 'needs_new_password' | 'complete';

  export interface SignInFuture {
    readonly status: SignInStatus;
    readonly identifier: string | null;
    readonly supportedFirstFactors: Array<{ strategy: string }>;
    readonly supportedSecondFactors: Array<{ strategy: string }>;
    create: (params: { identifier?: string; strategy?: string; transfer?: boolean }) => Promise<{ error: ClerkError | null }>;
    password: (params: { password: string } & ({ identifier: string } | { emailAddress: string } | { phoneNumber: string } | {})) => Promise<{ error: ClerkError | null }>;
    emailCode: {
      sendCode: (params?: { emailAddress?: string; emailAddressId?: string }) => Promise<{ error: ClerkError | null }>;
      verifyCode: (params: { code: string }) => Promise<{ error: ClerkError | null }>;
    };
    mfa: {
      sendEmailCode: () => Promise<{ error: ClerkError | null }>;
      verifyEmailCode: (params: { code: string }) => Promise<{ error: ClerkError | null }>;
      sendPhoneCode: () => Promise<{ error: ClerkError | null }>;
      verifyPhoneCode: (params: { code: string }) => Promise<{ error: ClerkError | null }>;
      verifyTOTP: (params: { code: string }) => Promise<{ error: ClerkError | null }>;
    };
    finalize: (params?: { navigate?: (params: { session: unknown; decorateUrl: (url: string) => string }) => void | Promise<unknown> }) => Promise<{ error: ClerkError | null }>;
    reset: () => void;
  }

  export interface FieldError {
    message: string;
  }

  export interface SignInErrors {
    fields?: { identifier?: FieldError | null; password?: FieldError | null; code?: FieldError | null } | null;
    global?: Array<{ message: string }> | null;
  }

  export interface SignUpErrors {
    fields?: { emailAddress?: FieldError | null; password?: FieldError | null; code?: FieldError | null; username?: FieldError | null; captcha?: FieldError | null } | null;
    global?: Array<{ message: string }> | null;
  }

  export function useSignIn(): {
    signIn: SignInFuture | null;
    errors: SignInErrors;
    fetchStatus: 'idle' | 'fetching';
  };

  export type SignUpStatus = 'missing_requirements' | 'complete' | 'abandoned';

  export interface SignUpFuture {
    readonly status: SignUpStatus;
    readonly unverifiedFields: string[];
    readonly missingFields: string[];
    readonly emailAddress: string | null;
    create: (params: { emailAddress?: string; phoneNumber?: string; username?: string; transfer?: boolean }) => Promise<{ error: ClerkError | null }>;
    password: (params: { password: string; emailAddress?: string; phoneNumber?: string; username?: string }) => Promise<{ error: ClerkError | null }>;
    verifications: {
      sendEmailCode: () => Promise<{ error: ClerkError | null }>;
      verifyEmailCode: (params: { code: string }) => Promise<{ error: ClerkError | null }>;
      sendPhoneCode: () => Promise<{ error: ClerkError | null }>;
      verifyPhoneCode: (params: { code: string }) => Promise<{ error: ClerkError | null }>;
    };
    finalize: (params?: { navigate?: (params: { session: unknown; decorateUrl: (url: string) => string }) => void | Promise<unknown> }) => Promise<{ error: ClerkError | null }>;
    reset: () => Promise<{ error: ClerkError | null }>;
  }

  export function useSignUp(): {
    signUp: SignUpFuture | null;
    errors: SignUpErrors;
    fetchStatus: 'idle' | 'fetching';
  };

  export function useOAuth(params: { strategy: string }): {
    startOAuthFlow: () => Promise<{ createdSessionId: string | null; setActive: ((params: { session: string }) => Promise<void>) | null }>;
  };

  export function useSSO(): {
    startSSOFlow: (params: { strategy: string }) => Promise<{
      createdSessionId: string | null;
      setActive?: (params: { session: string }) => Promise<void>;
      authSessionResult?: { type: string } | null;
    }>;
  };
}

declare module '@clerk/expo/google' {
  export function useSignInWithGoogle(): {
    startGoogleAuthenticationFlow: (params?: { unsafeMetadata?: Record<string, unknown> }) => Promise<{
      createdSessionId: string | null;
      setActive?: (params: { session: string }) => Promise<void>;
    }>;
  };
}

declare module '@clerk/expo/apple' {
  export function useSignInWithApple(): {
    startAppleAuthenticationFlow: (params?: { unsafeMetadata?: Record<string, unknown> }) => Promise<{
      createdSessionId: string | null;
      setActive?: (params: { session: string }) => Promise<void>;
    }>;
  };
}
