import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {supabase, safeGetSession, isInvalidRefreshTokenError} from '../utils/supabase';
import {invokeFn} from '../lib/api';
import {
  registerDeviceSession,
  isCurrentDeviceActive,
} from '../utils/device-session';

interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  instagram_handle?: string;
  profile_photo_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  categories?: string[];
  services?: string[];
  service_rates?: Record<string, number>;
  subscription_plan?: string;
  media_kit_published?: boolean;
  created_at?: string;
  updated_at?: string;
  // check-profile now strips the raw access token and exposes a derived
  // boolean instead. The actual token never reaches the client.
  instagram_connected?: boolean;
  instagram_token_expires_at?: string | null;
  [key: string]: any;
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshInstagram: (userId?: string) => Promise<void>;
  instagramTokenMissing: boolean;
  setInstagramTokenMissing: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  setProfile: () => {},
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshInstagram: async () => {},
  instagramTokenMissing: false,
  setInstagramTokenMissing: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [instagramTokenMissing, setInstagramTokenMissing] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const data = await invokeFn<{
        exists?: boolean;
        profile?: Profile;
        role?: string;
      }>('check-profile', {userId});

      if (data?.exists && data.profile) {
        setProfile(data.profile);
        setRole(data.role || data.profile.role || null);

        // check-profile now returns a derived `instagram_connected` boolean
        // (raw token stripped server-side). Only flag missing when the
        // server EXPLICITLY says disconnected — `undefined` means an old
        // API response and we'd rather under-warn than show a false
        // banner to a connected user.
        if (
          data.profile.instagram_handle &&
          data.profile.instagram_connected === false
        ) {
          setInstagramTokenMissing(true);
        } else {
          setInstagramTokenMissing(false);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfile(null);
      setRole(null);
    }
  }, []);

  const refreshInstagram = useCallback(
    async (userId?: string) => {
      const uid = userId || user?.id;
      if (!uid) return;
      try {
        const data = await invokeFn<{
          success?: boolean;
          skipped?: boolean;
          error?: string;
        }>('refresh-instagram', {userId: uid});
        if (data?.success && !data?.skipped) {
          setInstagramTokenMissing(false);
          await fetchProfile(uid);
        } else if (
          data?.error &&
          (data.error.includes('No Instagram token stored') ||
            data.error.includes('token expired'))
        ) {
          setInstagramTokenMissing(true);
        }
      } catch (err: any) {
        // invokeFn throws on { error: "..." } responses, which is exactly
        // how refresh-instagram reports "No token stored" / "token expired"
        // — the cases that should flip the banner on. Without this branch
        // we'd silently miss expired-but-stored tokens (the web equivalent
        // catches them in its branched response check).
        const msg = err?.message || String(err);
        if (
          msg.includes('No Instagram token stored') ||
          msg.includes('token expired')
        ) {
          setInstagramTokenMissing(true);
        } else {
          // Truly unexpected — don't surface to the UI.
          console.warn('Instagram refresh failed:', err);
        }
      }
    },
    [user, fetchProfile],
  );

  const checkProfileNotification = useCallback(async (userId: string) => {
    try {
      await invokeFn('notifications', {action: 'checkProfile', userId});
    } catch {
      // Best-effort.
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const session = await safeGetSession();
        if (!isMounted) return;
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          // Background, non-blocking
          refreshInstagram(session.user.id);
          checkProfileNotification(session.user.id);
          registerDeviceSession(supabase, session.user.id);
        }
      } catch (err) {
        if (isInvalidRefreshTokenError(err)) {
          // Stale refresh token — already cleared inside safeGetSession in
          // most paths; ensure local state is reset and let the user re-login.
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          setProfile(null);
          setRole(null);
        } else {
          console.error('Auth init failed:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        // Re-register on auth-state-change so a new device shows up in the
        // Trusted Devices list right after sign-in.
        registerDeviceSession(supabase, session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    // Safety: don't hang on loading=true forever if init throws unexpectedly.
    const safety = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 5000);

    // Trusted Devices revocation poll — 60s cadence, matches the web. If the
    // user removed this device from the Trusted Devices list elsewhere, we
    // sign them out within a minute.
    const REVOCATION_POLL_MS = 60_000;
    const revokePoll = setInterval(async () => {
      if (!isMounted) return;
      const session = await safeGetSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const active = await isCurrentDeviceActive(supabase, uid);
      if (!active) {
        console.warn('Device session revoked — signing out.');
        await supabase.auth.signOut();
      }
    }, REVOCATION_POLL_MS);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safety);
      clearInterval(revokePoll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        setProfile,
        role,
        loading,
        signOut,
        refreshProfile,
        refreshInstagram,
        instagramTokenMissing,
        setInstagramTokenMissing,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
