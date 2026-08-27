import type { ApiError } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:1337/api';

// ── Token storage (client-side only) ─────────────────────────────────────────
const TOKEN_KEY = 'lms_jwt';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch ────────────────────────────────────────────────────────────────
interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function buildUrl(path: string, params?: FetchOptions['params']): string {
  const base = `${BASE_URL}${path}`;
  if (!params) return base;
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return base;
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
  return base.includes('?') ? `${base}&${qs}` : `${base}?${qs}`;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, token, params, headers: extraHeaders, ...rest } = options;

  // token === null means explicitly no auth (public routes on server)
  // token === undefined means use stored token
  const resolvedToken = token === undefined ? getToken() : token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`;
  }

  const res = await fetch(buildUrl(path, params), {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) throw new ApiClientError(res.status, res.statusText);
    return undefined as T;
  }

  if (!res.ok) {
    const err = json as { error?: { message?: string; details?: unknown } };
    const message =
      err?.error?.message ??
      (json as ApiError)?.message ??
      `Request failed with status ${res.status}`;
    throw new ApiClientError(res.status, message, err?.error?.details);
  }

  return json as T;
}

// ── Convenience methods ───────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'GET', ...opts }),

  post: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'POST', body, ...opts }),

  put: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'PUT', body, ...opts }),

  patch: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'PATCH', body, ...opts }),

  delete: <T>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: 'DELETE', ...opts }),
};
