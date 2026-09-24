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

    const value = await res.json();
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
