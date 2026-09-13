// How many of the free tier's barter applications the signed-in creator has
// left. Mirrors the web hook (src/hooks/useFreeApplications.js).
//
// There is no trial: an unsubscribed creator gets FREE_BARTER_APPLICATIONS
// applications for the life of the account, and nothing else, so several
// surfaces need this number.
//
// It counts rows directly. `applications_creator_self_rw` (migration 035)
// scopes campaign_applications to `influencer_id = auth.uid()`, so a
// head-count from the client returns the creator's own rows and nobody
// else's — the same number apply-campaign counts server-side when it decides
// whether to allow the apply.
//
// A subscriber never pays the query: `subscribed` short-circuits first.

import {useCallback, useEffect, useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../utils/supabase';
import {FREE_BARTER_APPLICATIONS, isSubscribed} from '../lib/plans';

export interface FreeApplications {
  loading: boolean;
  subscribed: boolean;
  /** False until the count has actually been read — render neutral copy. */
  known: boolean;
  used: number;
  limit: number;
  /** Infinity for subscribers, null while unknown. */
  remaining: number | null;
  exhausted: boolean;
  refresh: () => Promise<void>;
}

export function useFreeApplications(): FreeApplications {
  const {user, profile} = useAuth();
  const subscribed = isSubscribed(profile);
  const [used, setUsed] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id || subscribed) return;
    setLoading(true);
    try {
      const {count, error} = await supabase
        .from('campaign_applications')
        .select('id', {count: 'exact', head: true})
        .eq('influencer_id', user.id);
      // On failure leave `used` null — callers render the neutral "free plan"
      // copy rather than a wrong number. The server is the real gate anyway.
      if (!error) setUsed(count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, subscribed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const known = used != null;
  const remaining = subscribed
    ? Infinity
    : known
      ? Math.max(0, FREE_BARTER_APPLICATIONS - (used as number))
      : null;

  return {
    loading,
    subscribed,
    known,
    used: used ?? 0,
    limit: FREE_BARTER_APPLICATIONS,
    remaining,
    exhausted: !subscribed && known && remaining === 0,
    refresh,
  };
}
