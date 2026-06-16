// Pulls the inputs needed for the brand trust score and returns the computed
// score + completion. Safe to call on any brand-side page — short-circuits
// for non-brand users.
//
// Ported from web app src/hooks/useBrandTrustScore.js.

import {useEffect, useMemo, useState} from 'react';
import {supabase} from '../utils/supabase';
import {useAuth} from '../context/AuthContext';
import {
  computeBrandTrustScore,
  getProfileCompletion,
  type ProfileCompletion,
  type RatingStats,
  type DeliveryStats,
  type TrustScore,
} from '../lib/brandProfile';

const EMPTY_RATINGS: RatingStats = {
  avgRating: 0,
  avgBriefClarity: 0,
  avgFairness: 0,
  count: 0,
  briefCount: 0,
  fairnessCount: 0,
};

export interface UseBrandTrustScore {
  loading: boolean;
  trust: TrustScore;
  completion: ProfileCompletion;
  ratings: RatingStats;
  campaignStats: DeliveryStats;
}

export function useBrandTrustScore(): UseBrandTrustScore {
  const {user, profile, role} = useAuth();
  const [ratings, setRatings] = useState<RatingStats>(EMPTY_RATINGS);
  const [campaignStats, setCampaignStats] = useState<DeliveryStats>({
    completedCount: 0,
    staleCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || role !== 'brand') {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [ratingRowsRes, campaignRowsRes] = await Promise.all([
          supabase
            .from('campaign_ratings')
            .select('target_rating, brief_clarity, fairness')
            .eq('brand_id', user.id)
            .eq('rater_role', 'influencer'),
          supabase
            .from('campaigns')
            .select('campaign_id, status, campaign_end_date')
            .eq('brand_id', user.id),
        ]);

        if (cancelled) return;

        const ratingRows = ratingRowsRes.data || [];
        const campaignRows = campaignRowsRes.data || [];

        // Average each axis independently — sub-ratings are nullable, older
        // rows pre-migration only carry target_rating.
        const avg = (rows: any[], key: string) => {
          const vals = rows
            .map(r => Number(r[key]))
            .filter(n => Number.isFinite(n) && n > 0);
          return {
            avg: vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0,
            count: vals.length,
          };
        };
        const target = avg(ratingRows, 'target_rating');
        const brief = avg(ratingRows, 'brief_clarity');
        const fair = avg(ratingRows, 'fairness');
        setRatings({
          avgRating: target.avg,
          avgBriefClarity: brief.avg,
          avgFairness: fair.avg,
          count: target.count,
          briefCount: brief.count,
          fairnessCount: fair.count,
        });

        // Campaign delivery — needs to know which campaigns have a completed
        // application. One follow-up query keyed by campaign_id.
        let completedCount = 0;
        let staleCount = 0;
        if (campaignRows.length > 0) {
          const ids = campaignRows.map((c: any) => c.campaign_id);
          const {data: appRows} = await supabase
            .from('campaign_applications')
            .select('campaign_id, status')
            .in('campaign_id', ids)
            .eq('status', 'completed');
          if (cancelled) return;

          const completedSet = new Set(
            (appRows || []).map((a: any) => a.campaign_id),
          );
          const now = Date.now();

          for (const c of campaignRows as any[]) {
            if (completedSet.has(c.campaign_id)) {
              completedCount += 1;
              continue;
            }
            const ended =
              c.status === 'closed' ||
              c.status === 'completed' ||
              c.status === 'archived' ||
              (c.campaign_end_date &&
                new Date(c.campaign_end_date).getTime() < now);
            if (ended) staleCount += 1;
          }
        }
        setCampaignStats({completedCount, staleCount});
      } catch (e) {
        // Best-effort — the screen falls back to a zero score on failure.
        console.warn('useBrandTrustScore failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, role]);

  const completion = useMemo(() => getProfileCompletion(profile as any), [profile]);
  const trust = useMemo(
    () =>
      computeBrandTrustScore({
        profile: profile as any,
        ratings,
        campaignDelivery: campaignStats,
      }),
    [profile, ratings, campaignStats],
  );

  return {loading, trust, completion, ratings, campaignStats};
}
