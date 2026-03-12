/**
 * Type declaration for @clerk/expo/web (Expo web uses Clerk's React components).
 * The package exports this subpath; this file fixes TypeScript resolution when needed.
 */
declare module '@clerk/expo/web' {
  import type { ComponentType } from 'react';

  export const SignIn: ComponentType<Record<string, unknown>>;
  export const SignUp: ComponentType<Record<string, unknown>>;
  export const UserButton: ComponentType<Record<string, unknown>>;
  export const UserProfile: ComponentType<Record<string, unknown>>;
  export const SignOutButton: ComponentType<Record<string, unknown>>;
  export const SignInButton: ComponentType<Record<string, unknown>>;
  export const SignUpButton: ComponentType<Record<string, unknown>>;
}
