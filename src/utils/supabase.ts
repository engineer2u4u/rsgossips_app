import 'react-native-url-polyfill/auto';
import { createClient, AuthError, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// "Invalid Refresh Token" / "Refresh Token Not Found" — Supabase throws these
// when the refresh token stored in AsyncStorage is no longer accepted by the
// server (rotated by another device, revoked, project reset, etc.). The
// session is unrecoverable; the only safe response is to drop the local copy
// and treat the user as signed out.
export function isInvalidRefreshTokenError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    (err as any)?.message ||
    (typeof err === 'string' ? err : '') ||
    '';
  return /refresh token/i.test(msg);
}

// Wraps getSession() so a stale refresh token clears local state instead of
// bubbling an unhandled AuthApiError up through the auth init / poll paths.
export async function safeGetSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        await supabase.auth.signOut().catch(() => {});
        return null;
      }
      throw error;
    }
    return data?.session ?? null;
  } catch (err) {
    if (isInvalidRefreshTokenError(err) || err instanceof AuthError) {
      await supabase.auth.signOut().catch(() => {});
      return null;
    }
    throw err;
  }
}
