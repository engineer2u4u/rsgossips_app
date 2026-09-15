// Shared helpers + normalisation used by every mobile media-kit template.
// Mirrors the web's src/components/mediaKitTemplates/shared.js so the
// shape each template sees is identical across the two platforms.

export const SERVICE_LABELS: Record<string, string> = {
  reels: 'Reels',
  stories: 'Stories',
  shorts: 'YouTube Shorts',
  posts: 'Static Posts',
  ugc: 'UGC Videos',
};

export const toServiceLabel = (id: string): string => SERVICE_LABELS[id] || id;

export const formatCount = (n: number | string | undefined | null): string => {
  const num = Number(n) || 0;
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
};

export interface NormalisedProfile {
  name: string;
  handle: string;
  photo: string | null;
  categories: string[];
  languages: string[];
  bio: string;
  location: string;
  followers: number;
  following: number;
  posts: number;
  services: string[];
  serviceRates: Record<string, number | string>;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  totalImpressions: number;
  totalReach: number;
  topReels: any[];
  demographics: any;
  initials: string;
  primaryCategory: string;
  nonFollowerReachPct: number;
}

export function readProfile(profile: any): NormalisedProfile {
  const name = profile?.full_name || profile?.fullName || 'Creator';
  const handle =
    profile?.username ||
    profile?.instagram_handle ||
    profile?.instagramHandle ||
    'creator';
  const photo =
    profile?.custom_profile_photo_url ||
    profile?.customProfilePhotoUrl ||
    profile?.profile_photo_url ||
    profile?.profilePhotoUrl ||
    null;
  const categories = Array.isArray(profile?.categories) ? profile.categories : [];
  // Content languages are proper nouns — surfaced verbatim, never translated.
  const languages = Array.isArray(
    profile?.content_languages || profile?.contentLanguages,
  )
    ? profile.content_languages || profile.contentLanguages
    : [];
  const bio =
    profile?.bio ||
    'Passionate content creator helping brands connect with audiences through authentic storytelling and creative content.';
  const location = profile?.location || '';
  const followers = profile?.followers_count || profile?.followersCount || 0;
  const following = profile?.follows_count || profile?.followsCount || 0;
  const posts = profile?.media_count || profile?.mediaCount || 0;
  const services = Array.isArray(profile?.services) ? profile.services : [];
  const serviceRates = profile?.service_rates || profile?.serviceRates || {};
  const engagementRate =
    profile?.engagement_rate || profile?.engagementRate || 0;
  const avgLikes = profile?.avg_likes || profile?.avgLikes || 0;
  const avgComments = profile?.avg_comments || profile?.avgComments || 0;
  const totalImpressions =
    profile?.total_impressions || profile?.totalImpressions || 0;
  const totalReach = profile?.total_reach || profile?.totalReach || 0;
  const topReels = Array.isArray(profile?.top_reels || profile?.topReels)
    ? profile.top_reels || profile.topReels
    : [];
  const demographics =
    profile?.audience_demographics || profile?.audienceDemographics || {};
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const primaryCategory = categories.slice(0, 2).join(' & ') || 'Creator';
  const nonFollowerReachPct =
    totalReach && followers ? Math.round((totalReach / followers) * 100) : 0;

  return {
    name,
    handle,
    photo,
    categories,
    languages,
    bio,
    location,
    followers,
    following,
    posts,
    services,
    serviceRates,
    engagementRate,
    avgLikes,
    avgComments,
    totalImpressions,
    totalReach,
    topReels,
    demographics,
    initials,
    primaryCategory,
    nonFollowerReachPct,
  };
}

export interface DemographicCity {
  name: string;
  pct: number;
}

export interface DemographicAge {
  range: string;
  pct: number;
}

export interface DemographicGender {
  male: number;
  female: number;
  other: number;
}

export interface NormalisedDemographics {
  topCities: DemographicCity[];
  ageRanges: DemographicAge[];
  gender: DemographicGender;
  topCountries: DemographicCity[];
}

export function readDemographics(
  d: any,
  location: string,
): NormalisedDemographics {
  const topCities =
    d?.topCities?.length > 0
      ? d.topCities
      : [{name: location || '—', pct: 0}];
  const ageRanges =
    d?.ageRanges?.length > 0
      ? d.ageRanges
      : [
          {range: '18-24', pct: 0},
          {range: '25-34', pct: 0},
          {range: '35-44', pct: 0},
          {range: '45+', pct: 0},
        ];
  const gender = normaliseGender(d?.gender);
  const topCountries = (d?.topCountries || []).map((c: DemographicCity) => ({
    ...c,
    name: countryName(c.name),
  }));
  return {topCities, ageRanges, gender, topCountries};
}

// Gender as Instagram reports it: split over KNOWN gender only. Rows saved
// before 2026-09 carry Instagram's "unknown" bucket as `other` — often most
// of the audience. Mirrors web shared.js.
export function normaliseGender(g: any): DemographicGender {
  const male = Number(g?.male) || 0;
  const female = Number(g?.female) || 0;
  const other = Number(g?.other) || 0;
  if (other > 0 && g?.unknownPct === undefined && male + female > 0) {
    const known = male + female;
    return {
      male: Math.round((male / known) * 1000) / 10,
      female: Math.round((female / known) * 1000) / 10,
      other: 0,
    };
  }
  return {male, female, other};
}

// "IN" → "India". Hermes may lack Intl.DisplayNames, so a short table covers
// the countries this audience actually has; anything else shows its code.
const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', BR: 'Brazil', BD: 'Bangladesh', PK: 'Pakistan',
  GB: 'United Kingdom', AE: 'United Arab Emirates', TR: 'Türkiye', ID: 'Indonesia',
  NP: 'Nepal', CA: 'Canada', AU: 'Australia', SA: 'Saudi Arabia', DE: 'Germany',
  UZ: 'Uzbekistan', LK: 'Sri Lanka', PH: 'Philippines', MY: 'Malaysia', SG: 'Singapore',
  EG: 'Egypt', NG: 'Nigeria', MX: 'Mexico', FR: 'France', IT: 'Italy', RU: 'Russia',
  IR: 'Iran', IQ: 'Iraq', QA: 'Qatar', KW: 'Kuwait', OM: 'Oman', ZA: 'South Africa',
};
export function countryName(value: unknown): string {
  const v = String(value || '');
  if (!/^[A-Z]{2}$/.test(v)) return v;
  try {
    const DN = (Intl as any).DisplayNames;
    if (DN) return new DN(['en'], {type: 'region'}).of(v) || COUNTRY_NAMES[v] || v;
  } catch {
    // fall through
  }
  return COUNTRY_NAMES[v] || v;
}

// Instagram's 30-day account totals (refresh-instagram → instagram_insights)
// plus how fresh they are. Every template renders the same set in its own
// style from this reader; labels live under the "MediaKitInsights" i18n
// namespace. Mirrors web shared.js readInsights.
export const INSIGHT_KEYS = [
  'reelViews', 'reach', 'likes', 'comments', 'shares', 'saves', 'reposts',
] as const;
export type InsightKey = (typeof INSIGHT_KEYS)[number];
export const STALE_AFTER_DAYS = 30;

export interface InsightItem {
  key: InsightKey;
  value: number;
  display: string;
}

export interface NormalisedInsights {
  hasData: boolean;
  items: InsightItem[];
  days: number;
  rangeLabel: string | null;
  updatedLabel: string | null;
  ageDays: number | null;
  stale: boolean;
  tokenInvalid: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Manual format: toLocaleDateString options are unreliable on Hermes.
const fmtDate = (d: Date, withYear: boolean) =>
  `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;

export function readInsights(profile: any): NormalisedInsights {
  const raw = profile?.instagram_insights || profile?.instagramInsights || null;
  const updatedRaw = profile?.instagram_refreshed_at || profile?.analyticsUpdatedAt || null;
  const tokenInvalid = !!(profile?.instagram_token_invalid_at || profile?.instagramTokenInvalid);

  const updatedAt = updatedRaw ? new Date(updatedRaw) : null;
  const validUpdated = updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : null;
  const ageDays = validUpdated
    ? Math.floor((Date.now() - validUpdated.getTime()) / 86_400_000)
    : null;

  const since = raw?.since ? new Date(raw.since) : null;
  const until = raw?.until ? new Date(raw.until) : null;
  const rangeLabel =
    since && until && !Number.isNaN(since.getTime()) && !Number.isNaN(until.getTime())
      ? `${fmtDate(since, false)} – ${fmtDate(until, true)}`
      : null;

  // A metric Instagram did not return is left out, never shown as 0.
  const items: InsightItem[] = raw
    ? INSIGHT_KEYS.filter(k => raw[k] !== null && raw[k] !== undefined).map(k => ({
        key: k,
        value: Number(raw[k]) || 0,
        display: formatCount(Number(raw[k]) || 0),
      }))
    : [];

  return {
    hasData: items.length > 0,
    items,
    days: raw?.days || 30,
    rangeLabel,
    updatedLabel: validUpdated ? fmtDate(validUpdated, true) : null,
    ageDays,
    stale: tokenInvalid || (ageDays !== null && ageDays > STALE_AFTER_DAYS),
    tokenInvalid,
  };
}

export interface SocialRollup {
  key: string;
  label: string;
  sub: string;
  value: string;
}

export function readSocials(followers: number): SocialRollup[] {
  return [
    {key: 'instagram', label: 'Instagram', sub: 'Followers', value: formatCount(followers)},
    {key: 'tiktok', label: 'TikTok', sub: 'Followers', value: '—'},
    {key: 'youtube', label: 'YouTube', sub: 'Subscribers', value: '—'},
    {key: 'facebook', label: 'Facebook', sub: 'Followers', value: '—'},
  ];
}

export interface TemplateProps {
  profile: any;
  /** Optional bio editor — only the Classic template surfaces edit affordances. */
  editingBio?: boolean;
  bioDraft?: string;
  setBioDraft?: (b: string) => void;
  setEditingBio?: (b: boolean) => void;
  onBioSave?: () => void;
}
