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
  const gender = d?.gender || {male: 0, female: 0, other: 0};
  const topCountries = d?.topCountries || [];
  return {topCities, ageRanges, gender, topCountries};
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
