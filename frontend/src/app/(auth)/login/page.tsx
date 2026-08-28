'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Shield, Users, Zap } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ApiClientError } from '@/lib/api';
import { defaultRouteForRole, sanitizeRedirect } from '@/lib/auth-redirect';

// ─── Login Form Component ────────────────────────────────────────────────────
function LoginForm() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{ identifier?: string; password?: string }>({});

  // ─── Redirect if already authenticated ──────────────────────────────────
  React.useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.role?.type) return;
    const from = sanitizeRedirect(searchParams.get('from'));
    router.replace(from ?? defaultRouteForRole(user.role.type));
  }, [isLoading, isAuthenticated, user, router, searchParams]);

  // ─── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    const e: typeof errors = {};
    if (!identifier.trim()) e.identifier = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(identifier.trim())) e.identifier = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      // redirect is handled by the useEffect above when isAuthenticated flips
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.status === 400 || err.status === 401
          ? 'Invalid email or password.'
          : err.message || 'Something went wrong. Please try again.');
      } else {
        setFormError('Unable to connect. Check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || (isAuthenticated && user?.role?.type)) return null;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="relative z-10 w-full max-w-md animate-slide-up">
      {/* Brand Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-500 blur-2xl opacity-20 animate-glow" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-lg shadow-brand-500/25">
              <Sparkles className="h-8 w-8 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Sign in to continue your learning journey
        </p>
      </div>

      {/* Login Card */}
      <Card 
        padding="lg" 
        className="relative overflow-hidden border-0 shadow-2xl shadow-brand-500/5 dark:shadow-brand-500/10"
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent animate-pulse" />
        
        {/* Card content */}
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-brand-500/5 to-indigo-500/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-brand-500/5 to-purple-500/5 blur-3xl" />

          <form onSubmit={handleSubmit} noValidate className="relative space-y-5">
            {/* Error Alert */}
            {formError && (
              <div 
                role="alert" 
                className="animate-slide-up rounded-xl bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-start gap-2"
              >
                <span className="mt-0.5">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrors((p) => ({ ...p, identifier: undefined }));
                  }}
                  className={`w-full rounded-xl border bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm pl-10 pr-4 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 hover:border-neutral-300 dark:hover:border-neutral-600 ${errors.identifier ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
              {errors.identifier && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.identifier}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className={`w-full rounded-xl border bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm pl-10 pr-10 py-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 hover:border-neutral-300 dark:hover:border-neutral-600 ${errors.password ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              fullWidth 
              loading={submitting} 
              size="lg" 
              className="mt-2 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? 'Signing in...' : 'Sign in'}
                {!submitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </span>
              {/* Button shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </Button>
          </form>

          {/* Social Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-neutral-900 px-3 text-neutral-500 dark:text-neutral-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-md"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-md"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025.8-.223 1.65-.334 2.5-.334.85 0 1.7.111 2.5.334 1.91-1.294 2.75-1.025 2.75-1.025.545 1.376.201 2.393.099 2.646.64.698 1.03 1.591 1.03 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </button>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Don&apos;t have an account?{' '}
          <Link 
            href="/register" 
            className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors hover:underline underline-offset-2"
          >
            Create one
          </Link>
        </p>
        
        {/* Feature badges */}
        <div className="flex items-center justify-center gap-6 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
            <Users className="h-3.5 w-3.5" />
            <span>10k+ users</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
            <Zap className="h-3.5 w-3.5" />
            <span>Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}