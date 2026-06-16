// Validation + trust-score helpers for brand profiles.
// Ported from the web app (`src/lib/brandProfile.js`) — keep in sync.
//
// Trust score (out of 1000) blends three pillars:
//   50% — influencer ratings of this brand (target / brief clarity / fairness)
//   25% — completed-vs-stale ratio of the brand's campaigns
//   25% — profile completeness (GST/PAN, contact email, categories)
//
// Profile completion (and the trust score below) intentionally treat the
// same three fields as "what makes a brand legit enough to surface to
// creators". Don't add fluff fields here without raising the bar elsewhere
// — the rating-side weighting compounds on top of completion already.

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidGstOrPan(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = String(value).toUpperCase().trim();
  return PAN_RE.test(v) || GSTIN_RE.test(v);
}

export type GstPanKind = 'empty' | 'pan' | 'gst' | 'unknown';

export function classifyGstPan(value: string | null | undefined): {
  kind: GstPanKind;
  valid: boolean;
} {
  if (!value) return {kind: 'empty', valid: false};
  const v = String(value).toUpperCase().trim();
  if (PAN_RE.test(v)) return {kind: 'pan', valid: true};
  if (GSTIN_RE.test(v)) return {kind: 'gst', valid: true};
  if (v.length === 10) return {kind: 'pan', valid: false};
  if (v.length === 15) return {kind: 'gst', valid: false};
  return {kind: 'unknown', valid: false};
}

/* ─────────── Profile completion ─────────── */

type BrandProfileLike = {
  gstin?: string | null;
  contact_email?: string | null;
  categories?: string[] | null;
} | null | undefined;

const PROFILE_FIELDS: {
  key: string;
  label: string;
  test: (p: BrandProfileLike) => boolean;
}[] = [
  {key: 'gstPan', label: 'GST / PAN', test: p => !!p?.gstin},
  {key: 'email', label: 'Contact email', test: p => !!p?.contact_email},
  {
    key: 'categories',
    label: 'Categories',
    test: p => Array.isArray(p?.categories) && (p?.categories?.length || 0) > 0,
  },
];

export interface ProfileCompletion {
  percent: number;
  missing: string[];
  filled: string[];
}

export function getProfileCompletion(profile: BrandProfileLike): ProfileCompletion {
  if (!profile) {
    return {percent: 0, missing: PROFILE_FIELDS.map(f => f.label), filled: []};
  }
  const filled: string[] = [];
  const missing: string[] = [];
  for (const f of PROFILE_FIELDS) {
    if (f.test(profile)) filled.push(f.label);
    else missing.push(f.label);
  }
  const percent = Math.round((filled.length / PROFILE_FIELDS.length) * 100);
  return {percent, missing, filled};
}

/* ─────────── Campaign delivery ratio ─────────── */

export interface DeliveryStats {
  completedCount?: number;
  staleCount?: number;
}

export interface DeliveryRatio {
  percent: number;
  completedCount: number;
  staleCount: number;
  total: number;
}

// Stale = campaign that ended (closed / expired by end_date) without any
// completed application. Campaigns with at least one completed application
// count as "completed", everything else no-longer-running counts as stale.
export function getCampaignDeliveryRatio({
  completedCount = 0,
  staleCount = 0,
}: DeliveryStats = {}): DeliveryRatio {
  const total = completedCount + staleCount;
  if (total === 0) return {percent: 0, completedCount, staleCount, total};
  return {
    percent: Math.round((completedCount / total) * 100),
    completedCount,
    staleCount,
    total,
  };
}

/* ─────────── Influencer rating score ─────────── */

export interface RatingStats {
  avgRating?: number;
  avgBriefClarity?: number;
  avgFairness?: number;
  count?: number;
  briefCount?: number;
  fairnessCount?: number;
}

export interface RatingScore extends RatingStats {
  percent: number;
  shareTarget: number;
  shareBrief: number;
  shareFair: number;
}

const ratingToPct = (avg: number) =>
  avg > 0 ? Math.round((Math.min(5, avg) / 5) * 100) : 0;

// Blends overall + brief_clarity + fairness into one 0-100 number used for
// the 50% slice. Each sub-axis contributes a fixed share; if brief/fair have
// no samples we reuse the overall average so a brand isn't penalised for
// missing data the influencer chose not to provide.
export function getInfluencerRatingScore({
  avgRating = 0,
  avgBriefClarity = 0,
  avgFairness = 0,
  count = 0,
  briefCount = 0,
  fairnessCount = 0,
}: RatingStats = {}): RatingScore {
  if (!count || avgRating <= 0) {
    return {
      percent: 0,
      avgRating: 0,
      avgBriefClarity: 0,
      avgFairness: 0,
      count,
      briefCount,
      fairnessCount,
      // Sub-shares within the slice — kept here so the UI can render a
      // breakdown tooltip even when count is 0.
      shareTarget: 0.6,
      shareBrief: 0.2,
      shareFair: 0.2,
    };
  }

  const targetPct = ratingToPct(avgRating);
  const briefPct = briefCount > 0 ? ratingToPct(avgBriefClarity) : targetPct;
  const fairPct = fairnessCount > 0 ? ratingToPct(avgFairness) : targetPct;

  // 30/10/10 of the parent 50% slice → 0.6 / 0.2 / 0.2 within the slice.
  const blendedPercent = Math.round(
    targetPct * 0.6 + briefPct * 0.2 + fairPct * 0.2,
  );

  return {
    percent: blendedPercent,
    avgRating,
    avgBriefClarity,
    avgFairness,
    count,
    briefCount,
    fairnessCount,
    shareTarget: 0.6,
    shareBrief: 0.2,
    shareFair: 0.2,
  };
}

/* ─────────── Composite trust score ─────────── */

export type TrustBand = 'LOW' | 'GOOD' | 'HIGH';

export interface TrustScore {
  score: number; // 0-1000
  percent: number; // 0-100
  band: TrustBand;
  breakdown: {
    influencerRating: RatingScore & {weight: number};
    campaignDelivery: DeliveryRatio & {weight: number};
    profileCompleteness: ProfileCompletion & {weight: number};
  };
}

export function computeBrandTrustScore({
  profile,
  ratings,
  campaignDelivery,
}: {
  profile: BrandProfileLike;
  ratings?: RatingStats;
  campaignDelivery?: DeliveryStats;
}): TrustScore {
  const completion = getProfileCompletion(profile);
  const rating = getInfluencerRatingScore(ratings || {});
  const delivery = getCampaignDeliveryRatio(campaignDelivery || {});

  const weighted100 =
    rating.percent * 0.5 + delivery.percent * 0.25 + completion.percent * 0.25;
  const score1000 = Math.round(weighted100 * 10);

  let band: TrustBand = 'LOW';
  if (weighted100 >= 75) band = 'HIGH';
  else if (weighted100 >= 45) band = 'GOOD';

  return {
    score: score1000,
    percent: Math.round(weighted100),
    band,
    breakdown: {
      influencerRating: {...rating, weight: 0.5},
      campaignDelivery: {...delivery, weight: 0.25},
      profileCompleteness: {...completion, weight: 0.25},
    },
  };
}
