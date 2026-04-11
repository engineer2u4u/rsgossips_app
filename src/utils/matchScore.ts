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
  [key: string]: any;
}

export function calculateCampaignMatchScore(
  profile: Profile | null,
  campaign: Campaign,
): number {
  if (!profile) return 0;

  let score = 0;
  const userCategories = (profile.categories || []).map(c => c.toLowerCase());
  const userServices = profile.services || [];

  // 1. Tag/category overlap (40 points)
  const tags = (campaign.tags || []).map(t => t.toLowerCase());
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

  if (tags.length > 0) {
    const tagRatio = tagMatchCount / tags.length;
    score += Math.round(tagRatio * 40);
  } else {
    score += 10;
  }

  // 2. Platform match (25 points)
  const campaignPlatforms = (campaign.platforms || []).map(p => p.toLowerCase());
  const hasInstagram =
    campaignPlatforms.includes('instagram') && profile.instagram_handle;
  const hasYoutube =
    campaignPlatforms.includes('youtube') && userServices.includes('shorts');
  if (hasInstagram) score += 15;
  if (hasYoutube) score += 10;
  if (!hasInstagram && !hasYoutube) score += 5;

  // 3. Deliverables vs services fit (20 points)
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

  if (serviceMatchCount >= 2) score += 20;
  else if (serviceMatchCount >= 1) score += 12;
  else score += 5;

  // 4. Followers fit (15 points)
  const followers = profile.followers_count || 0;
  if (followers >= 10000) score += 15;
  else if (followers >= 5000) score += 10;
  else if (followers >= 1000) score += 7;
  else score += 3;

  return Math.min(score, 100);
}
