// Fetches the current influencer's campaigns (with their applicationStatus
// computed server-side) and returns the precomputed dashboard/analytics
// aggregates. One call powers both DashboardView and AnalyticsPage so we
// don't double-fetch.

import {useEffect, useMemo, useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {
  computeInfluencerStats,
  type CampaignRow,
  type InfluencerStats,
} from '../lib/influencer-stats';

export interface UseInfluencerCampaigns {
  campaigns: CampaignRow[];
  stats: InfluencerStats;
  loading: boolean;
  error: string | null;
}

export function useInfluencerCampaigns(): UseInfluencerCampaigns {
  const {user} = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{campaigns?: CampaignRow[]}>(
          'list-campaigns',
          {influencerId: user.id},
        );
        if (cancelled) return;
        // Only keep rows where the user has an application — the rest are
        // background discovery results and would skew the stats.
        const mine = (data?.campaigns || []).filter(c => !!c.applicationStatus);
        setCampaigns(mine);
      } catch (e: any) {
        if (cancelled) return;
        console.warn('useInfluencerCampaigns failed:', e);
        setError(e?.message || 'Failed to load campaign stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const stats = useMemo(() => computeInfluencerStats(campaigns), [campaigns]);

  return {campaigns, stats, loading, error};
}
