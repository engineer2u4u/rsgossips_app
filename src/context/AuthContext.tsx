import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {supabase} from '../utils/supabase';
import {NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY} from '@env';

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
  instagram_access_token?: string;
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
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/check-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({userId}),
        },
      );
      const data = await res.json();

      if (data?.profile) {
        setProfile(data.profile);
        setRole(data.role || data.profile.role || null);

        // Check if Instagram token is missing
        if (
          data.profile.instagram_handle &&
          !data.profile.instagram_access_token
        ) {
          setInstagramTokenMissing(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
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
    // Get initial session
    supabase.auth.getSession().then(({data: {session}}) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {data: {subscription}} = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      },
    );

    // Safety timeout
    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchProfile]);

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
        instagramTokenMissing,
        setInstagramTokenMissing,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
