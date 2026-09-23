// The brand's own trust score, read from the server.
//
// This hook used to compute the score in the client from direct
// campaign_ratings / campaigns / campaign_applications queries, on a 3-pillar
// 0–1000 scale with LOW/GOOD/HIGH bands — a fourth, disagreeing implementation
// of a number the brand also saw elsewhere. It now fetches the ONE
// implementation (supabase/functions/_shared/brand-trust.ts) through
// `brand-campaigns { action: "trustScore" }`, so the number a brand sees on
// its dashboard is the same number a creator sees on its card.
//
// Safe to call on any screen — short-circuits for non-brand users and returns
// a neutral placeholder so callers never have to null-check.

import {useCallback, useEffect, useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {
  TRUST_SCALE_MAX,
  TRUST_SCALE_MIN,
  type TrustBandLabel,
} from '../lib/brandProfile';

/* ─────────── Response shape (mirrors _shared/brand-trust.ts) ─────────── */

interface PillarBase {
  percent: number;
  weight: number;
  label: string;
  hasData: boolean;
}

export interface ReviewsPillar extends PillarBase {
  count: number;
  axes: {target: number; brief: number; fair: number; feedback: number} | null;
}

export interface ExecutionPillar extends PillarBase {
  completionRatio: number | null;
  draftRatio: number | null;
  avgRevisions: number;
  finalAcceptedCount: number;
  approvedCount: number;
  abandonedAfterApproval: number;
}

export interface VerificationPillar extends PillarBase {
  items: {
    emailVerified: boolean;
    phoneVerified: boolean;
    panProvided: boolean;
    gstinVerified: boolean;
  };
}

export interface CommunicationPillar extends PillarBase {
  responseAvg: number;
  richnessPct: number;
}

export interface EngagementPillar extends PillarBase {
  loginScore: number;
  activityScore: number;
  profileCompletionPct: number;
  campaignsLast90d: number;
}

export interface BrandTrust {
  /** 300–900. */
  score: number;
  band: TrustBandLabel;
  /** 0–100 weighted pillar average, before the scale + cold-start cap. */
  overallPercent: number;
  coldStart: boolean;
  coldStartCap: number;
  coldStartThreshold: number;
  penaltyApplied: number;
  breakdown: {
    influencerReviews: ReviewsPillar;
    campaignExecution: ExecutionPillar;
    verification: VerificationPillar;
    communication: CommunicationPillar;
    engagement: EngagementPillar;
  };
  scaleMin: number;
  scaleMax: number;
}

export interface BrandProfileCompletion {
  percent: number;
  missing: string[];
  filled: string[];
}

/* ─────────── Neutral placeholder ─────────── */

const pillar = (weight: number, label: string): PillarBase => ({
  percent: 0,
  weight,
  label,
  hasData: false,
});

const EMPTY_TRUST: BrandTrust = {
  score: TRUST_SCALE_MIN,
  band: 'Building Trust',
  overallPercent: 0,
  coldStart: true,
  coldStartCap: 720,
  coldStartThreshold: 3,
  penaltyApplied: 0,
  breakdown: {
    influencerReviews: {
      ...pillar(0.3, 'Influencer Reviews'),
      count: 0,
      axes: null,
    },
    campaignExecution: {
      ...pillar(0.25, 'Campaign Execution'),
      completionRatio: null,
      draftRatio: null,
      avgRevisions: 0,
      finalAcceptedCount: 0,
      approvedCount: 0,
      abandonedAfterApproval: 0,
    },
    verification: {
      ...pillar(0.2, 'Verification & Identity'),
      items: {
        emailVerified: false,
        phoneVerified: false,
        panProvided: false,
        gstinVerified: false,
      },
    },
    communication: {
      ...pillar(0.15, 'Communication Quality'),
      responseAvg: 0,
      richnessPct: 0,
    },
    engagement: {
      ...pillar(0.1, 'Platform Engagement'),
      loginScore: 0,
      activityScore: 0,
      profileCompletionPct: 0,
      campaignsLast90d: 0,
    },
  },
  scaleMin: TRUST_SCALE_MIN,
  scaleMax: TRUST_SCALE_MAX,
};

const EMPTY_COMPLETION: BrandProfileCompletion = {
  percent: 0,
  missing: [],
  filled: [],
};

export interface UseBrandTrustScore {
  loading: boolean;
  trust: BrandTrust;
  completion: BrandProfileCompletion;
  /** Non-null when the fetch failed; the placeholder is rendered instead. */
  error: string | null;
  refresh: () => void;
}

export function useBrandTrustScore(): UseBrandTrustScore {
  const {user, role} = useAuth();
  const [trust, setTrust] = useState<BrandTrust>(EMPTY_TRUST);
  const [completion, setCompletion] =
    useState<BrandProfileCompletion>(EMPTY_COMPLETION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    if (!user?.id || role !== 'brand') {
      setTrust(EMPTY_TRUST);
      setCompletion(EMPTY_COMPLETION);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await invokeFn<{
          trust?: BrandTrust;
          completion?: BrandProfileCompletion;
        }>('brand-campaigns', {action: 'trustScore', brandId: user.id});
        if (cancelled) return;
        setTrust(res?.trust || EMPTY_TRUST);
        setCompletion(res?.completion || EMPTY_COMPLETION);
        setError(null);
      } catch (e: any) {
        // Best-effort — the screen falls back to the neutral placeholder.
        if (cancelled) return;
        console.warn('useBrandTrustScore failed:', e?.message || e);
        setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, role, nonce]);

  return {loading, trust, completion, error, refresh};
}
