const CATEGORY_MAP: Record<string, string[]> = {
  Perfume: ['Beauty & Skincare', 'Fashion & Lifestyle'],
  Wellness: ['Health, Fitness & Wellness'],
  Fashion: ['Fashion & Lifestyle'],
  Food: ['Food & Beverage'],
  Travel: ['Travel & Hospitality'],
  Technology: ['Technology & Gadgets'],
  Beauty: ['Beauty & Skincare'],
  Fitness: ['Health, Fitness & Wellness'],
  Lifestyle: ['Fashion & Lifestyle'],
  Music: ['Gaming & Entertainment'],
  Events: ['Gaming & Entertainment'],
  Deals: ['Technology & Gadgets'],
  Entertainment: ['Gaming & Entertainment'],
  Health: ['Health, Fitness & Wellness'],
  'Home Decor': ['Home & Decor'],
  Luxury: ['Fashion & Lifestyle', 'Travel & Hospitality'],
  Sustainability: ['Sustainable & Eco-conscious Living'],
  Education: ['Education & Career'],
  Tech: ['Technology & Gadgets'],
  Festival: ['Fashion & Lifestyle'],
  Gaming: ['Gaming & Entertainment'],
  Skincare: ['Beauty & Skincare'],
  Hotel: ['Travel & Hospitality'],
  Cafe: ['Food & Beverage'],
  Tea: ['Food & Beverage'],
  Clothing: ['Fashion & Lifestyle'],
  'Hair Care': ['Beauty & Skincare'],
  Haircare: ['Beauty & Skincare'],
  Resort: ['Travel & Hospitality'],
  Salon: ['Beauty & Skincare'],
  Jewellery: ['Fashion & Lifestyle'],
};

interface Profile {
  categories?: string[];
  services?: string[];
  instagram_handle?: string;
  followers_count?: number;
  [key: string]: any;
}

interface Brand {
  category?: string;
  platforms?: string[];
  isVerified?: boolean;
  rating?: number;
  [key: string]: any;
}

export function calculateBrandMatchScore(
  profile: Profile | null,
  brand: Brand,
): number {
  if (!profile) return 0;

  let score = 0;
  const userCategories = (profile.categories || []).map(c => c.toLowerCase());

  // 1. Category match (40 points)
  const brandCategory = brand.category || '';
  const mappedCategories = CATEGORY_MAP[brandCategory] || [];
  const categoryMatch =
    mappedCategories.some(mc =>
      userCategories.includes(mc.toLowerCase()),
    ) ||
    userCategories.some(uc =>
      brandCategory.toLowerCase().includes(uc.split(' ')[0].toLowerCase()),
    );

  if (categoryMatch) score += 40;
  else score += 10;

  // 2. Platform overlap (25 points)
  const brandPlatforms = (brand.platforms || []).map(p => p.toLowerCase());
  const hasInstagram =
    brandPlatforms.includes('instagram') && profile.instagram_handle;
  if (hasInstagram) score += 25;
  else score += 5;

  // 3. Followers fit (20 points)
  const followers = profile.followers_count || 0;
  if (followers >= 10000) score += 20;
  else if (followers >= 5000) score += 15;
  else if (followers >= 1000) score += 10;
  else score += 5;

  // 4. Verified & rating bonus (15 points)
  if (brand.isVerified) score += 8;
  if ((brand.rating || 0) >= 4.5) score += 7;
  else if ((brand.rating || 0) >= 4.0) score += 4;

  return Math.min(score, 100);
}

interface Campaign {
  tags?: string[];
  platforms?: string[];
  deliverables?: string;
  budget?: string;
  location?: string;
  [key: string]: any;
}

// Categories adjacent enough to count as a soft, "indirect" fit. Lowercase
// canonical names on both sides. Mirrors web utils/matchScore.js.
const RELATED_CATEGORIES: Record<string, string[]> = {
  'beauty & skincare': ['fashion & lifestyle', 'health, fitness & wellness'],
  'fashion & lifestyle': ['beauty & skincare', 'home & decor'],
  'food & beverage': ['travel & hospitality', 'health, fitness & wellness'],
  'health, fitness & wellness': [
    'food & beverage',
    'beauty & skincare',
    'sustainable & eco-conscious living',
  ],
  'travel & hospitality': ['food & beverage', 'automobile & mobility'],
  'technology & gadgets': ['gaming & entertainment', 'automobile & mobility'],
  'parenting & family': ['pet care & animals', 'home & decor'],
  'home & decor': ['fashion & lifestyle', 'sustainable & eco-conscious living'],
  'finance & personal finance': [
    'entrepreneurship & business',
    'education & career',
  ],
  'education & career': [
    'entrepreneurship & business',
    'finance & personal finance',
  ],
  'gaming & entertainment': ['technology & gadgets'],
  'automobile & mobility': ['technology & gadgets', 'travel & hospitality'],
  'entrepreneurship & business': [
    'education & career',
    'finance & personal finance',
  ],
  'sustainable & eco-conscious living': [
    'health, fitness & wellness',
    'home & decor',
  ],
  'pet care & animals': ['parenting & family'],
};

// "₹5K-15K" / "₹3,500" / "₹2.5L" → midpoint in rupees. Used to compare
// campaign budgets to the creator's declared reel rate.
function parseBudgetMidpoint(raw?: string): number {
  if (!raw) return 0;
  const toNum = (s?: string) => {
    if (!s) return 0;
    const cleaned = String(s)
      .trim()
      .toLowerCase()
      .replace(/,/g, '')
      .replace(/\+/g, '');
    const num = parseFloat(cleaned);
    if (!Number.isFinite(num)) return 0;
    if (cleaned.endsWith('l')) return Math.round(num * 100000);
    if (cleaned.endsWith('m')) return Math.round(num * 1000000);
    if (cleaned.endsWith('k')) return Math.round(num * 1000);
    return Math.round(num);
  };
  const parts = String(raw).replace(/₹/g, '').split(/[-–—]/);
  const lo = toNum(parts[0]);
  const hi = parts.length > 1 ? toNum(parts[1]) : lo;
  if (lo && hi) return Math.round((lo + hi) / 2);
  return lo || hi;
}

// 3 = exact, 2 = partial (substring either way), 1 = indirect (related),
// 0 = none. Primary sort key for the Campaigns For You section.
function bestCategoryTier(userCategories: string[], tags: string[]): 0 | 1 | 2 | 3 {
  const u = userCategories.map(c => c.toLowerCase().trim());
  const t = tags.map(x => String(x).toLowerCase().trim());
  if (u.length === 0 || t.length === 0) return 0;

  let best: 0 | 1 | 2 | 3 = 0;
  for (const tag of t) {
    for (const cat of u) {
      if (tag === cat) return 3;
      if (tag.includes(cat) || cat.includes(tag)) {
        if (best < 2) best = 2;
        continue;
      }
      const relOfCat = RELATED_CATEGORIES[cat] || [];
      const relOfTag = RELATED_CATEGORIES[tag] || [];
      if (relOfCat.includes(tag) || relOfTag.includes(cat)) {
        if (best < 1) best = 1;
      }
    }
  }
  return best;
}

// Recommendation fit for the "Campaigns For You" section. Combines a tiered
// category match with a budget-vs-rate check. Mirrors web utils/matchScore.js.
export function scoreCampaignForUser(
  profile: Profile | null,
  campaign: Campaign,
): {score: number; categoryTier: 0 | 1 | 2 | 3} {
  if (!profile) return {score: 0, categoryTier: 0};

  const userCategories = profile.categories || [];
  const tags = campaign.tags || [];
  const categoryTier = bestCategoryTier(userCategories, tags);

  const CATEGORY_POINTS = {3: 65, 2: 45, 1: 28, 0: 10} as const;
  let score: number = CATEGORY_POINTS[categoryTier];

  const userRate = Number(profile?.service_rates?.reels) || 0;
  const campaignMid = parseBudgetMidpoint(campaign.budget);
  if (!userRate || !campaignMid) {
    score += 20;
  } else if (campaignMid >= userRate) {
    score += 35;
  } else if (campaignMid >= userRate * 0.6) {
    score += 24;
  } else {
    score += 10;
  }

  return {score: Math.min(100, Math.round(score)), categoryTier};
}

export type MatchFactorStatus = 'strong' | 'ok' | 'weak';

export interface MatchFactor {
  key: string;
  label: string;
  points: number;
  max: number;
  status: MatchFactorStatus;
  reason: string;
}

export interface MatchExplanation {
  score: number;
  breakdown: MatchFactor[];
}

/**
 * Full, explainable match breakdown between an influencer profile and a
 * campaign. Single source of truth for the campaign-card match % AND the AI
 * Match Coach — the coach narrates exactly these sub-scores, so they must stay
 * in sync. Mirrors web utils/matchScore.js `explainCampaignMatch`: unlike the
 * older number-only scorer, this factors in ENGAGEMENT RATE and LOCATION.
 *
 * `status` ∈ 'strong' | 'ok' | 'weak' — drives bar colour + coach tone.
 * Labels/reasons are plain English strings by design (same as web).
 */
export function explainCampaignMatch(
  profile: Profile | null,
  campaign: Campaign,
): MatchExplanation {
  if (!profile) return {score: 0, breakdown: []};

  const userCategories = (profile.categories || []).map(c => c.toLowerCase());
  const userServices = profile.services || [];
  const band = (pts: number, max: number): MatchFactorStatus =>
    pts >= max * 0.75 ? 'strong' : pts >= max * 0.45 ? 'ok' : 'weak';
  const breakdown: MatchFactor[] = [];

  // 1. Category / niche fit (40)
  const tags = (campaign.tags || []).map(tag => tag.toLowerCase());
  let tagMatchCount = 0;
  for (const tag of tags) {
    if (
      userCategories.some(
        uc => uc.includes(tag) || tag.includes(uc.split(' ')[0].toLowerCase()),
      )
    ) {
      tagMatchCount++;
      continue;
    }
    const titleCase = tag.charAt(0).toUpperCase() + tag.slice(1);
    const mapped = CATEGORY_MAP[titleCase] || [];
    if (mapped.some(mc => userCategories.includes(mc.toLowerCase()))) {
      tagMatchCount++;
    }
  }
  const catPts =
    tags.length > 0 ? Math.round((tagMatchCount / tags.length) * 40) : 12;
  breakdown.push({
    key: 'category',
    label: 'Niche fit',
    points: catPts,
    max: 40,
    status: band(catPts, 40),
    reason:
      tags.length === 0
        ? "This campaign has no niche tags, so it's open to all creators."
        : `${tagMatchCount} of ${tags.length} campaign tag${
            tags.length === 1 ? '' : 's'
          } overlap your categories (${
            (profile.categories || []).join(', ') || 'none set'
          }).`,
  });

  // 2. Engagement rate (15)
  const er = Number(profile.engagement_rate || profile.engagementRate) || 0;
  let erPts: number;
  if (!er) erPts = 8;
  else if (er >= 6) erPts = 15;
  else if (er >= 3) erPts = 11;
  else if (er >= 1.5) erPts = 7;
  else erPts = 4;
  breakdown.push({
    key: 'engagement',
    label: 'Engagement rate',
    points: erPts,
    max: 15,
    status: band(erPts, 15),
    reason: !er
      ? "Your engagement rate isn't synced yet — connect/refresh Instagram to strengthen this."
      : `Your engagement rate is ${er.toFixed(1)}% (${
          er >= 3 ? 'healthy' : 'below the ~3% brands look for'
        }).`,
  });

  // 3. Deliverables vs your services (15)
  const deliverables = (campaign.deliverables || '').toLowerCase();
  let serviceMatchCount = 0;
  if (deliverables.includes('reel') && userServices.includes('reels'))
    serviceMatchCount++;
  if (deliverables.includes('stor') && userServices.includes('stories'))
    serviceMatchCount++;
  if (deliverables.includes('short') && userServices.includes('shorts'))
    serviceMatchCount++;
  if (deliverables.includes('video') && userServices.includes('ugc'))
    serviceMatchCount++;
  if (deliverables.includes('post') && userServices.includes('posts'))
    serviceMatchCount++;
  const delPts = serviceMatchCount >= 2 ? 15 : serviceMatchCount >= 1 ? 9 : 4;
  breakdown.push({
    key: 'deliverables',
    label: 'Deliverables',
    points: delPts,
    max: 15,
    status: band(delPts, 15),
    reason:
      serviceMatchCount >= 1
        ? `You offer ${serviceMatchCount} of the formats this campaign needs (${
            campaign.deliverables || '—'
          }).`
        : `Add the formats this campaign needs (${
            campaign.deliverables || '—'
          }) to your services.`,
  });

  // 4. Location (10)
  const campLoc = String(campaign.location || '')
    .toLowerCase()
    .trim();
  const userLoc = String(profile.city || profile.location || '')
    .toLowerCase()
    .trim();
  const openLoc =
    !campLoc ||
    ['all india', 'remote', 'pan india', 'anywhere'].some(x =>
      campLoc.includes(x),
    );
  let locPts: number;
  let locReason: string;
  if (openLoc) {
    locPts = 10;
    locReason = 'This campaign is open to any location.';
  } else if (!userLoc) {
    locPts = 6;
    locReason = `Campaign targets ${campaign.location}. Add your city to your profile to match location-based briefs.`;
  } else if (campLoc.includes(userLoc) || userLoc.includes(campLoc)) {
    locPts = 10;
    locReason = `Your location (${
      profile.city || profile.location
    }) matches the campaign's target (${campaign.location}).`;
  } else {
    locPts = 4;
    locReason = `This campaign targets ${campaign.location}; you're in ${
      profile.city || profile.location
    }.`;
  }
  breakdown.push({
    key: 'location',
    label: 'Location',
    points: locPts,
    max: 10,
    status: band(locPts, 10),
    reason: locReason,
  });

  // 5. Platform (10)
  const campaignPlatforms = (campaign.platforms || []).map(p =>
    p.toLowerCase(),
  );
  const hasInstagram =
    campaignPlatforms.includes('instagram') &&
    !!(profile.instagram_handle || profile.instagramHandle);
  const hasYoutube =
    campaignPlatforms.includes('youtube') && userServices.includes('shorts');
  let platPts = 0;
  if (hasInstagram) platPts += 8;
  if (hasYoutube) platPts += 2;
  if (!platPts) platPts = 3;
  platPts = Math.min(platPts, 10);
  breakdown.push({
    key: 'platform',
    label: 'Platforms',
    points: platPts,
    max: 10,
    status: band(platPts, 10),
    reason:
      hasInstagram || hasYoutube
        ? "You're active on the platform(s) this campaign wants."
        : 'Connect the platform this campaign runs on to raise this.',
  });

  // 6. Reach / followers (10)
  const followers = profile.followers_count || profile.followersCount || 0;
  const folPts =
    followers >= 10000 ? 10 : followers >= 5000 ? 8 : followers >= 1000 ? 6 : 3;
  breakdown.push({
    key: 'reach',
    label: 'Reach',
    points: folPts,
    max: 10,
    status: band(folPts, 10),
    reason: `You have ${Number(followers).toLocaleString('en-IN')} followers.`,
  });

  const score = Math.min(
    100,
    breakdown.reduce((s, b) => s + b.points, 0),
  );
  return {score, breakdown};
}

/**
 * Calculate match score between an influencer profile and a campaign.
 * Thin wrapper over {@link explainCampaignMatch} so the card badge and the
 * AI Match Coach never disagree. Mirrors web utils/matchScore.js.
 */
export function calculateCampaignMatchScore(
  profile: Profile | null,
  campaign: Campaign,
): number {
  if (!profile) return 0;
  return explainCampaignMatch(profile, campaign).score;
}
