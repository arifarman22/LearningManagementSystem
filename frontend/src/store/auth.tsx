'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, clearToken, getToken } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(token: string): Promise<User> {
  return api.get<User>('/admin-panel/me', { token });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await fetchMe(token);
      setState({ user, token, isLoading: false, isAuthenticated: true });
    } catch {
      clearToken();
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await api.post<{ jwt: string; user: User }>('/auth/local', { identifier, password });
    setToken(res.jwt);
    // Always fetch /users/me after login to get the populated role
    const user = await fetchMe(res.jwt);
    setState({ user, token: res.jwt, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await api.post<{ jwt: string; user: User }>('/auth/local/register', {
      username,
      email,
      password,
    });
    setToken(res.jwt);
    const user = await fetchMe(res.jwt);
    setState({ user, token: res.jwt, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRole(...roles: string[]): boolean {
  const { user } = useAuth();
  return roles.includes(user?.role?.type ?? '');
}
