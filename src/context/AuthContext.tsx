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
import {
  getRememberedRole,
  rememberRole,
  forgetRole,
  tableForRole,
  type AppRole,
} from '../utils/role-storage';

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
  content_languages?: string[];
  welcome_reward_seen?: boolean;
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
  /** Set when a role-scoped profile lookup found nothing — e.g. signing in as
   *  a brand on an account that only has a creator profile. The session is
   *  ended in that case, so this is copy for the login screen rather than a
   *  state the app keeps running in. */
  roleError: string | null;
  setRoleError: React.Dispatch<React.SetStateAction<string | null>>;
  /** Bumped every time refreshProfile() runs. Used as a fallback cache
   *  buster for the profile photo URL when the DB's updated_at column
   *  hasn't changed (some upload edge functions only touch
   *  profile_photo_url without bumping updated_at). */
  photoVersion: number;
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
  roleError: null,
  setRoleError: () => {},
  photoVersion: 0,
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
  const [roleError, setRoleError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, roleHint?: AppRole) => {
    try {
      // Scope the lookup to ONE profile table whenever we know the role —
      // passed in at sign-in, or remembered from the last one on restore.
      //
      // Without a `table`, check-profile queries both tables and returns
      // whichever it finds, checking influencer FIRST. A brand who also has an
      // influencer row would resolve as an influencer, and even without one the
      // unscoped path made role resolution slower and less certain. Scoping it
      // also turns "not found" into a truthful answer: no brand profile on this
      // account, rather than a silent fall-through to the other role.
      const role = roleHint || (await getRememberedRole());
      const data = await invokeFn<{
        exists?: boolean;
        profile?: Profile;
        role?: string;
        error?: string;
      }>('check-profile', {
        userId,
        ...(role ? {table: tableForRole(role)} : {}),
      });

      // check-profile returns `{error}` (no `exists`/`role`) when its DB read
      // fails. That is NOT "account removed" — treat it like the catch below
      // and keep the current session/role. Clearing role here would flip
      // RootStack to the splash (unmounting the whole navigator mid-flow,
      // which surfaces as "Couldn't find a navigation context") and the
      // signOut below would kick a paying user out on a blip.
      if (data?.error) {
        console.warn('check-profile transient error, keeping session:', data.error);
        return;
      }

      if (data?.exists && data.profile) {
        setProfile(data.profile);
        const resolved = data.role || data.profile.role || null;
        setRole(resolved);
        // Remember it so the next restore can scope its lookup the same way.
        rememberRole(resolved);
        setRoleError(null);

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
        // Two different situations reach here, and they need different copy.
        //
        // Scoped lookup (we asked for one table): the account exists but has
        // no profile of THAT role — signing in as a brand on a creator-only
        // account, say. Say so plainly instead of silently handing back the
        // other role's dashboard, which is what the unscoped lookup used to do.
        //
        // Unscoped lookup: no profile in either table, so the account really
        // is gone (e.g. admin deletion). A signed-in user always has a profile
        // — create-profile issues the session only after writing one.
        setRoleError(
          role
            ? role === 'brand'
              ? 'No brand profile found for this account.'
              : 'No creator profile found for this account.'
            : null,
        );
        // Either way the session is no longer usable, so don't leave a stale
        // JWT lingering until it expires — onAuthStateChange routes back to
        // login. Drop the remembered role too, or the next sign-in would be
        // scoped to the role that just failed.
        await forgetRole();
        try {
          const session = await safeGetSession();
          if (session?.user) await supabase.auth.signOut();
        } catch {
          /* best-effort */
        }
      }
    } catch (err) {
      // Transient error (network / edge fn) — do NOT sign out, and do NOT
      // clear role/profile. Nulling role flips RootStack to the splash, which
      // unmounts the navigator out from under whatever flow is mid-run (the
      // post-payment refreshProfile is the common case) and throws
      // "Couldn't find a navigation context". Keep the last-known good state;
      // the next successful refresh corrects it.
      console.error('Failed to fetch profile (keeping session):', err);
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
        if (data?.success) {
          // Either the server refreshed the token (skipped=false) or it
          // confirmed the existing token is still valid (skipped=true).
          // Both mean "IG is connected" — clear the banner. The previous
          // branch only cleared it on a hard refresh, which left users
          // with a stuck banner whenever check-profile returned a stale
          // `instagram_connected: false` and refresh-instagram saw a
          // still-valid token (no refresh needed).
          setInstagramTokenMissing(false);
          if (!data?.skipped) {
            await fetchProfile(uid);
          }
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

  // Bumped on every refreshProfile() so consumers can build a cache-bust
  // query param for the profile photo. Falls back to this when the DB
  // updated_at didn't change (the upload edge function may overwrite the
  // storage object without touching updated_at on the profile row).
  const [photoVersion, setPhotoVersion] = useState(0);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
      setPhotoVersion(v => v + 1);
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    // Drop the remembered role, or the next account signed in on this device
    // would have its profile looked up under the previous user's role.
    await forgetRole();
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
        roleError,
        setRoleError,
        photoVersion,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
