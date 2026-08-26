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

import {DeviceEventEmitter} from 'react-native';
import {safeGetSession} from '../utils/supabase';
import {NETWORK_ERROR_EVENT} from '../components/OfflineGate';
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

/**
 * Edge functions that MUST carry a real user session, never the publishable key.
 * F-10 / assertion A-43.
 *
 * getAuthToken() below deliberately falls back to the anon key when the session
 * read is slow — see the comment there for why. The gap that made it a finding
 * is that nothing distinguished a privileged call from a public one, so an
 * escrow or profile mutation could go out on the publishable key and, if the
 * server happened to answer 2xx, be treated as success.
 *
 * With this list, a privileged call fails CLOSED: one fully-awaited retry for a
 * session, and if there still isn't one, it throws before the request is made.
 *
 * Only functions this app actually calls are listed — every entry was checked
 * against the callers in src/. Two groups:
 *   - deployed with verify_jwt: true, so the platform already rejects the anon
 *     key; listing them turns a confusing server 401 into a clear client error
 *   - deployed with verify_jwt: false but doing their own auth.getUser() check,
 *     which is where the silent-anon-call risk actually lives
 *
 * Deliberately NOT listed: list-*, check-profile, public-media-kit and
 * notifications, which are legitimately callable pre-auth.
 */
const REQUIRES_SESSION = new Set([
  // verify_jwt: true — platform-gated
  'submit-deliverables',
  'update-application-status',
  'send-account-event-email',
  'verify-service-payment',
  // caller-JWT: the function derives the user from the token itself, so an anon
  // call is refused server-side but only after the round trip
  'ai-generate',
  'register-push',
  'update-profile',
  'register-payout-method',
  'apply-campaign',
  'brand-campaigns',
  'request-revision',
  'respond-to-quote',
  'submit-quote-request',
  'submit-service-review',
]);

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
  let token = await getAuthToken();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // F-10 / A-43: a privileged call must never go out on the publishable key.
  // getAuthToken's 3s race can hand back the anon key for a user who IS signed
  // in, so take one fully-awaited look before giving up — the same recovery the
  // 401 retry below performs, moved ahead of the request for calls where an
  // anon attempt has no legitimate meaning. If there is genuinely no session,
  // fail closed here rather than letting the request go and interpreting
  // whatever comes back.
  if (REQUIRES_SESSION.has(name) && token === SUPABASE_ANON_KEY) {
    const session = await safeGetSession().catch(() => null);
    if (session?.access_token) {
      token = session.access_token;
    } else {
      throw new EdgeFunctionError(
        `"${name}" requires you to be signed in. Please sign in and try again.`,
        401,
        {error: 'no_session'},
      );
    }
  }

  let url = `${SUPABASE_URL}/functions/v1/${name}`;

  if (method === 'GET') {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  // Hook caller's signal onto our timeout-driven AbortController so either can
  // cancel the request. Without a timeout the RN fetch polyfill can hang
  // indefinitely on a dropped connection, which is what was leaving the
  // "Checking your number…" loader stuck on flaky networks.
  const doFetch = async (authToken: string): Promise<Response> => {
    const controller = new AbortController();
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
        Authorization: `Bearer ${authToken}`,
      },
      signal: controller.signal,
    };
    if (method !== 'GET') {
      init.body = JSON.stringify(body);
    }
    try {
      return await fetch(url, init);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new EdgeFunctionError(
          `Request to "${name}" timed out. Check your connection and try again.`,
          408,
          null,
        );
      }
      // Network-level failure (no route to host / airplane mode): wake the
      // OfflineGate overlay, which takes over until connectivity returns.
      if (/network request failed/i.test(String(err?.message || ''))) {
        DeviceEventEmitter.emit(NETWORK_ERROR_EVENT);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let res = await doFetch(token);

  // getAuthToken's 3s race can lose to a slow AsyncStorage read and send the
  // anon key for a user who IS signed in — auth-required functions then 401
  // ("unauthorized") even though the session is fine. Retry once with a
  // fully-awaited session before surfacing the error; a 401'd request had no
  // server-side effect, so the retry is safe.
  if (res.status === 401 && token === SUPABASE_ANON_KEY) {
    const session = await safeGetSession().catch(() => null);
    if (session?.access_token) {
      res = await doFetch(session.access_token);
    }
  }

  let parsed: any = null;
  try {
    // The abort timeout above only covers fetch() reaching the response
    // headers; reading the body (res.json) is unbounded, so a stalled body
    // stream would hang the promise forever and leave the caller's loader
    // stuck (e.g. the Add-Payment sheet's "Saving…"). Bound the body read too.
    // Reading the body has no server-side effect, so a race is safe.
    let bodyTimer: ReturnType<typeof setTimeout> | undefined;
    parsed = await Promise.race([
      res.json(),
      new Promise((_, reject) => {
        bodyTimer = setTimeout(
          () =>
            reject(
              new EdgeFunctionError(
                `Request to "${name}" timed out. Check your connection and try again.`,
                408,
                null,
              ),
            ),
          timeoutMs,
        );
      }),
    ]).finally(() => {
      if (bodyTimer !== undefined) clearTimeout(bodyTimer);
    });
  } catch (err) {
    // A body-read timeout is a real failure — surface it. Any other parse
    // error just means the edge function returned non-JSON; keep parsed null.
    if (err instanceof EdgeFunctionError) throw err;
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
