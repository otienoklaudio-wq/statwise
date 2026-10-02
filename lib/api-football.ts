// Server-only wrapper around the API-Football REST API.
// Never import this file from a 'use client' component - it reads a
// server-only env var (no NEXT_PUBLIC_ prefix) that must never reach
// the browser bundle.

const BASE_URL = 'https://v3.football.api-sports.io';

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const responseCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();
const MAX_CACHE_ENTRIES = 250;

function cacheTtl(endpoint: string): number {
  if (endpoint === '/predictions') return 5 * 60_000;
  if (endpoint === '/injuries') return 5 * 60_000;
  if (endpoint.startsWith('/fixtures')) return 60_000;
  return 10 * 60_000;
}

function requestKey(endpoint: string, params: Record<string, string | number>): string {
  const query = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${String(value)}`)
    .join('&');

  return `${endpoint}?${query}`;
}

function evictOldestEntry() {
  const oldestKey = responseCache.keys().next().value;
  if (oldestKey) responseCache.delete(oldestKey);
}

function providerErrorMessage(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return null;
  const entries = Object.entries(errors as Record<string, unknown>)
    .filter(([, value]) => value !== null && value !== undefined && value !== '' && value !== false);
  if (entries.length === 0) return null;

  const details = entries
    .map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
    .join('; ');
  return `API-Football rejected the request (${details})`;
}

export async function apiFootball<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY?.trim();
  if (!key) {
    throw new Error(
      'API_FOOTBALL_KEY is not set. Copy .env.local.example to .env.local and fill it in.'
    );
  }

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  ) as Record<string, string | number>;

  const cacheKey = requestKey(endpoint, cleanParams);
  const cached = responseCache.get(cacheKey);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
    responseCache.delete(cacheKey);
  }

  const pending = pendingRequests.get(cacheKey);
  if (pending) return pending as Promise<T>;

  const query = new URLSearchParams(
    Object.entries(cleanParams).map(([k, v]) => [k, String(v)])
  );

  const url = query.toString() ? `${BASE_URL}${endpoint}?${query}` : `${BASE_URL}${endpoint}`;

  const request = (async () => {
    const res = await fetch(url, {
      headers: { 'x-apisports-key': key },
    });

    if (!res.ok) {
      throw new Error(`API-Football error ${res.status}: ${res.statusText} (${endpoint})`);
    }

    const value: unknown = await res.json();
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const providerError = providerErrorMessage((value as { errors?: unknown }).errors);
      if (providerError) throw new Error(providerError);
    }

    if (responseCache.size >= MAX_CACHE_ENTRIES) evictOldestEntry();
    responseCache.set(cacheKey, { expiresAt: Date.now() + cacheTtl(endpoint), value });
    return value;
  })();

  pendingRequests.set(cacheKey, request);
  try {
    return await request as T;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}
