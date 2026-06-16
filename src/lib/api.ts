// Thin wrapper around Supabase edge functions.
//
// Why this exists: every screen was doing the same `fetch(SUPABASE_URL/...)`
// with the same headers. Centralising it means we set the apikey/auth header
// once, JSON-parse uniformly, and surface { error } payloads as thrown errors
// so calling code can use try/catch instead of branching on `data.error`.
//
// Two ways to call:
//   await invokeFn('list-campaigns', { page: 1 })            // POST JSON body
//   await invokeFn('public-media-kit', { id }, { method: 'GET' })  // GET via URL params
//
// Auth: if there's a logged-in Supabase session, its access_token is sent in
// the Authorization header; otherwise we fall back to the anon key. This
// matches what the web app does and lets edge functions read auth.uid().

import {safeGetSession} from '../utils/supabase';
import {
  NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY,
} from '@env';

export type InvokeOptions = {
  method?: 'GET' | 'POST';
  signal?: AbortSignal;
  // Default 20s. Some emulator/cellular round-trips to Supabase edge can run
  // 5-10s; 20s gives them headroom while still surfacing real hangs as a
  // catchable error instead of an infinite loader. Pass a custom value or
  // your own AbortSignal to override.
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 20000;

export class EdgeFunctionError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.status = status;
    this.data = data;
  }
}

async function getAuthToken(): Promise<string> {
  // supabase.auth.getSession() can hang on RN if AsyncStorage is contended or
  // the session row is in a weird state (we saw the "Checking your number…"
  // loader stick here on sign-in). Race it against a 3s fallback — anon key
  // is a safe default; edge functions that need auth.uid() will reject and
  // surface a real error instead of an infinite spinner.
  //
  // safeGetSession also catches "Invalid Refresh Token" — without it, every
  // edge function call with a stale token would throw an unhandled AuthApiError.
  const sessionPromise = safeGetSession()
    .then(session => session?.access_token || SUPABASE_ANON_KEY)
    .catch(() => SUPABASE_ANON_KEY);
  const fallback = new Promise<string>(resolve =>
    setTimeout(() => resolve(SUPABASE_ANON_KEY), 3000),
  );
  return Promise.race([sessionPromise, fallback]);
}

export async function invokeFn<T = any>(
  name: string,
  body: Record<string, any> = {},
  options: InvokeOptions = {},
): Promise<T> {
  const method = options.method || 'POST';
  const token = await getAuthToken();

  let url = `${SUPABASE_URL}/functions/v1/${name}`;

  // Hook caller's signal onto our timeout-driven AbortController so either can
  // cancel the request. Without a timeout the RN fetch polyfill can hang
  // indefinitely on a dropped connection, which is what was leaving the
  // "Checking your number…" loader stuck on flaky networks.
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => controller.abort());
  }

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  };

  if (method === 'GET') {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  } else {
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new EdgeFunctionError(
        `Request to "${name}" timed out. Check your connection and try again.`,
        408,
        null,
      );
    }
    throw err;
  }
  clearTimeout(timeoutId);

  let parsed: any = null;
  try {
    parsed = await res.json();
  } catch {
    // Edge function returned non-JSON — keep parsed null
  }

  if (!res.ok || parsed?.error) {
    const msg =
      parsed?.message ||
      parsed?.error ||
      `Edge function "${name}" failed (${res.status})`;
    throw new EdgeFunctionError(msg, res.status, parsed);
  }

  return parsed as T;
}

// FormData variant — the upload-* edge functions take multipart bodies, not
// JSON. Same auth + error semantics as invokeFn, but the caller hands us a
// pre-built FormData. We deliberately don't set Content-Type — fetch needs
// to pick its own multipart boundary; setting it manually breaks the upload.
export async function invokeFormFn<T = any>(
  name: string,
  form: FormData,
  options: {signal?: AbortSignal} = {},
): Promise<T> {
  const token = await getAuthToken();
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      // No Content-Type — see comment above.
    },
    body: form as any,
    signal: options.signal,
  });
  let parsed: any = null;
  try {
    parsed = await res.json();
  } catch {
    // Non-JSON response — leave parsed null.
  }
  if (!res.ok || parsed?.error) {
    const msg =
      parsed?.message ||
      parsed?.error ||
      `Edge function "${name}" failed (${res.status})`;
    throw new EdgeFunctionError(msg, res.status, parsed);
  }
  return parsed as T;
}
