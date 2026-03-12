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

  export interface SignInFuture {
    status: string;
    reset: () => void;
    password: (params: { emailAddress: string; password: string }) => Promise<{ error?: unknown }>;
    finalize: (params: { navigate: (opts: { decorateUrl: (path: string) => string }) => void }) => Promise<{ error?: unknown }>;
    supportedSecondFactors?: Array<{ strategy: string }>;
    mfa: {
      sendEmailCode: () => Promise<unknown>;
      verifyEmailCode: (params: { code: string }) => Promise<unknown>;
    };
    create: (params: { identifier: string }) => Promise<{ error?: unknown }>;
    resetPasswordEmailCode?: {
      sendCode: () => Promise<{ error?: unknown }>;
      verifyCode: (params: { code: string }) => Promise<{ error?: unknown }>;
      submitPassword: (params: { password: string }) => Promise<{ error?: unknown }>;
    };
  }

  export interface Errors {
    fields?: Record<string, { message: string }>;
  }

  export function useSignIn(): {
    signIn: SignInFuture | null;
    errors: Errors;
    fetchStatus: 'idle' | 'fetching';
  };

  export interface SignUpFuture {
    status: string;
    unverifiedFields: string[];
    missingFields: string[];
    password: (params: { emailAddress: string; password: string }) => Promise<{ error?: unknown }>;
    verifications: { sendEmailCode: () => Promise<unknown>; verifyEmailCode: (params: { code: string }) => Promise<unknown> };
    finalize: (params: { navigate: (opts: { decorateUrl: (path: string) => string }) => void }) => Promise<{ error?: unknown }>;
  }

  export function useSignUp(): {
    signUp: SignUpFuture | null;
    errors: Errors;
    fetchStatus: 'idle' | 'fetching';
  };
}
