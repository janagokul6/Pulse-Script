import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/expo';
import api, { setTokenGetter } from '@/lib/api';

export type User = {
  id: string;
  email: string | null;
  name: string;
  role: string;
  specialization?: string | null;
  experienceYears?: number | null;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
};

type AuthContextValue = AuthState & {
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken, signOut } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  const refreshUser = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const { data } = await api.get<User>('/users/me');
      setUser(data);
    } catch (_) {
      setUser(null);
    }
  }, [isSignedIn]);

  useEffect(() => {
    let mounted = true;
    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get<User>('/users/me');
        if (mounted) setUser(data);
      } catch (_) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isSignedIn]);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, [signOut]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isLoggedIn: !!user && !!isSignedIn,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
