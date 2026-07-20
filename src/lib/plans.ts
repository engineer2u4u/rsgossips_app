/**
 * Single source of truth for influencer subscription plans + feature matrix.
 *
 * Ported from the web app (`src/lib/plans.js`) — keep in sync. The matrix
 * mirrors `src/assets/Payment Plan.xlsx` on the web side. Use the
 * `feature_key` strings as DB / RBAC identifiers — never spread out copies
 * of these literals in components.
 *
 * Helpers:
 *  - `getEffectivePlan(profile)` — returns the plan a user is currently on,
 *    treating an active 30-day trial as Elite per product spec.
 *  - `hasFeature(plan, key)` — boolean gate for UI / edge-function checks.
 *  - `getFeatureValue(plan, key)` — for tiered values like
 *    "campaign_applications_limit" (number, or Infinity for Unlimited).
 *  - `isWithinTrial(profile)` — true when a user is in their first 30 days.
 */

import {
  NEXT_PUBLIC_RAZORPAY_KEY_ID,
  NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_MONTHLY,
  NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_ANNUAL,
  NEXT_PUBLIC_RAZORPAY_PLAN_PRO_MONTHLY,
  NEXT_PUBLIC_RAZORPAY_PLAN_PRO_ANNUAL,
  NEXT_PUBLIC_RAZORPAY_PLAN_ELITE_MONTHLY,
  NEXT_PUBLIC_RAZORPAY_PLAN_ELITE_ANNUAL,
  NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY,
  NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL,
  NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY,
  NEXT_PUBLIC_STRIPE_PRICE_ELITE_ANNUAL,
} from '@env';

export const PLAN_IDS = {
  STARTER: 'starter',
  PRO: 'pro',
  ELITE: 'elite',
} as const;

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS];

export const TRIAL_DAYS = 30;

export const PLAN_PRICING = {
  starter: {monthly: 99, annual: 899, monthlyEquivalent: 75},
  pro: {monthly: 299, annual: 2699, monthlyEquivalent: 225},
  elite: {monthly: 699, annual: 6299, monthlyEquivalent: 525},
};

/* ─────────── payment gateway plan / price ids ─────────── */

export type BillingCycle = 'monthly' | 'annual';

export const RAZORPAY_KEY_ID = NEXT_PUBLIC_RAZORPAY_KEY_ID;

export const PLAN_RAZORPAY_IDS: Record<PlanId, Record<BillingCycle, string>> = {
  starter: {
    monthly: NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_MONTHLY,
    annual:  NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_ANNUAL,
  },
  pro: {
    monthly: NEXT_PUBLIC_RAZORPAY_PLAN_PRO_MONTHLY,
    annual:  NEXT_PUBLIC_RAZORPAY_PLAN_PRO_ANNUAL,
  },
  elite: {
    monthly: NEXT_PUBLIC_RAZORPAY_PLAN_ELITE_MONTHLY,
    annual:  NEXT_PUBLIC_RAZORPAY_PLAN_ELITE_ANNUAL,
  },
};

export const PLAN_STRIPE_PRICES: Record<PlanId, Record<BillingCycle, string>> = {
  starter: {
    monthly: NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY,
    annual:  NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL,
  },
  pro: {
    monthly: NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
    annual:  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL,
  },
  elite: {
    monthly: NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY,
    annual:  NEXT_PUBLIC_STRIPE_PRICE_ELITE_ANNUAL,
  },
};

export type FeatureCell = boolean | number | string;
export type FeatureRow = Record<PlanId, FeatureCell>;

export const FEATURE_MATRIX: Record<string, FeatureRow> = {
  // Discovery & Visibility
  discovery_listed:             {starter: true,  pro: true,  elite: true},
  discovery_priority:           {starter: false, pro: true,  elite: true},
  discovery_top_placement:      {starter: false, pro: false, elite: true},
  discovery_homepage_spotlight: {starter: false, pro: false, elite: true},
  badge_verified_eligible:      {starter: true,  pro: true,  elite: true},
  badge_elite_verified:         {starter: false, pro: false, elite: true},

  // Applications & Outreach
  campaign_applications_limit: {starter: 3,     pro: 15,    elite: Infinity},
  brand_dms_limit:             {starter: 10,    pro: 50,    elite: Infinity},
  early_access_deals:          {starter: false, pro: true,  elite: true},
  priority_deal_matching:      {starter: false, pro: false, elite: true},
  manual_brand_curation:       {starter: false, pro: false, elite: true},

  // Analytics & Insights
  analytics_basic:                 {starter: true,  pro: true,         elite: true},
  analytics_advanced:              {starter: false, pro: true,         elite: true},
  analytics_audience_demographics: {starter: false, pro: true,         elite: true},
  analytics_deep_audience:         {starter: false, pro: false,        elite: true},
  analytics_fake_follower_audit:   {starter: false, pro: 'monthly',    elite: 'monthly'},
  analytics_roi_report:            {starter: false, pro: false,        elite: true},

  // AI Creator Tools (metered by ai_generations_limit; see ai-generate edge fn)
  ai_generations_limit: {starter: 25, pro: 150, elite: Infinity},
  ai_content_studio: {starter: true, pro: true, elite: true},
  ai_pitch_assistant: {starter: true, pro: true, elite: true},
  ai_match_coach: {starter: false, pro: true, elite: true},
  ai_media_kit_v2: {starter: false, pro: true, elite: true},
  ai_rate_card_benchmarks: {starter: false, pro: true, elite: true},
  ai_growth_audit: {starter: false, pro: true, elite: true},
  ai_preflight_review: {starter: false, pro: false, elite: true},
  ai_copilot: {starter: false, pro: false, elite: true},

  // Payouts
  payout_speed: {starter: '7–10 days', pro: '3–5 days', elite: 'Within 48 hrs'},

  // Support
  support_standard:          {starter: true,  pro: true,  elite: true},
  support_priority:          {starter: false, pro: true,  elite: true},
  support_dedicated_manager: {starter: false, pro: false, elite: true},
  support_strategy_call:     {starter: false, pro: false, elite: true},
};

export const FEATURE_GROUPS = [
  {
    title: 'Discovery & Visibility',
    features: [
      {key: 'discovery_listed', label: 'Listed in brand search'},
      {key: 'discovery_priority', label: 'Priority brand search placement'},
      {key: 'discovery_top_placement', label: 'Featured in brand search (top placement)'},
      {key: 'discovery_homepage_spotlight', label: 'Homepage spotlight feature'},
      {key: 'badge_verified_eligible', label: 'Verified badge eligibility'},
      {key: 'badge_elite_verified', label: 'Elite verified badge'},
    ],
  },
  {
    title: 'Applications & Outreach',
    features: [
      {key: 'campaign_applications_limit', label: 'Campaign applications per month'},
      {key: 'brand_dms_limit', label: 'Brand DMs per month'},
      {key: 'early_access_deals', label: 'Early access to brand deals (48hr head start)'},
      {key: 'priority_deal_matching', label: 'Priority deal matching'},
      {key: 'manual_brand_curation', label: 'Manual brand match curation by RGossips'},
    ],
  },
  {
    title: 'Analytics & Insights',
    features: [
      {key: 'analytics_basic', label: 'Basic analytics dashboard'},
      {key: 'analytics_advanced', label: 'Advanced analytics & reports (Excel, PDF, link)'},
      {key: 'analytics_audience_demographics', label: 'Audience insights (age, gender, location)'},
      {key: 'analytics_deep_audience', label: 'Deep audience analytics + psychographics'},
      {key: 'analytics_fake_follower_audit', label: 'Fake follower & engagement audit'},
      {key: 'analytics_roi_report', label: 'Campaign ROI report for brand partners'},
    ],
  },
  {
    title: 'Payouts',
    features: [{key: 'payout_speed', label: 'Payout speed'}],
  },
  {
    title: 'Support & Account Management',
    features: [
      {key: 'support_standard', label: 'Standard email support'},
      {key: 'support_priority', label: 'Priority support'},
      {key: 'support_dedicated_manager', label: 'Dedicated account manager (WhatsApp + email)'},
      {key: 'support_strategy_call', label: '1:1 content strategy call (monthly)'},
    ],
  },
];

export function formatFeatureValue(value: FeatureCell | null | undefined): string {
  if (value === true) return '✓';
  if (value === false || value === undefined || value === null) return '—';
  if (typeof value === 'number') {
    if (!isFinite(value)) return 'Unlimited';
    return `${value}/month`;
  }
  if (typeof value === 'string') {
    if (value === 'monthly') return 'Monthly';
    return value;
  }
  return String(value);
}

type PlanProfile = {
  subscription_plan?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
} | null | undefined;

export function isWithinTrial(profile: PlanProfile): boolean {
  if (!profile) return false;
  if (profile.subscription_plan && profile.subscription_plan !== 'trial') return false;
  const createdAt = profile.created_at || profile.updated_at;
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (!isFinite(created)) return false;
  const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return days >= 0 && days < TRIAL_DAYS;
}

export function trialDaysLeft(profile: PlanProfile): number {
  if (!profile) return 0;
  const createdAt = profile.created_at || profile.updated_at;
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (!isFinite(created)) return 0;
  const days =
    TRIAL_DAYS - Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function getEffectivePlan(profile: PlanProfile): PlanId {
  if (!profile) return PLAN_IDS.STARTER;
  const plan = (profile.subscription_plan || '').toLowerCase();
  if (plan === PLAN_IDS.PRO || plan === PLAN_IDS.ELITE || plan === PLAN_IDS.STARTER) {
    return plan as PlanId;
  }
  if (isWithinTrial(profile)) return PLAN_IDS.ELITE;
  return PLAN_IDS.STARTER;
}

export function hasFeature(plan: PlanId, key: string): boolean {
  const row = FEATURE_MATRIX[key];
  if (!row) return false;
  const v = row[plan];
  if (v === true) return true;
  if (typeof v === 'number') return v > 0;
  if (typeof v === 'string') return v.length > 0 && v !== '—';
  return false;
}

export function getFeatureValue(plan: PlanId, key: string): FeatureCell | null {
  const row = FEATURE_MATRIX[key];
  if (!row) return null;
  return row[plan];
}

export function profileHasFeature(profile: PlanProfile, key: string): boolean {
  return hasFeature(getEffectivePlan(profile), key);
}

export function profileFeatureValue(profile: PlanProfile, key: string): FeatureCell | null {
  return getFeatureValue(getEffectivePlan(profile), key);
}

// ─────────────────────────────────────────────────────────────────────────
// Media Kit templates — ported from web src/lib/plans.js (MEDIA_KIT_*).
//
// Plan unlocks:
//   Starter — Classic only; everything else is visible but locked
//   Pro     — Classic + Glass Blue + Editorial Noir (3 designs),
//             capped at 3 lifetime saves between them
//   Elite   — all five designs, unlimited saves
// On mobile, trial users land on Elite (see getEffectivePlan above), so
// they get the full five-template experience with no change cap.
// ─────────────────────────────────────────────────────────────────────────
export interface MediaKitTemplate {
  id: string;
  label: string;
  description: string;
  minPlan: PlanId;
  /** CSS-style background gradient string (kept for reference); mobile
   *  renders previews with `previewColors` in the LinearGradient component. */
  preview: string;
  /** Three hex stops React Native's LinearGradient renders directly — used
   *  as both the picker thumbnail and the media-kit hero gradient on the
   *  preview screen, so the page actually changes appearance per template. */
  previewColors: [string, string, string];
  /** Primary accent the rest of the page picks up (chip outline, links,
   *  divider rules, header-on-hero text contrast). */
  accent: string;
  /** Soft tint of the accent for chip / pill backgrounds, used so each
   *  template's vibe carries through past the hero. */
  accentSoft: string;
  /** Foreground colour for text overlaid on the hero gradient — dark
   *  templates (Noir, Glass Blue) want white; light hero templates need
   *  dark ink so the name + categories stay legible. */
  heroInk: string;
}

export const MEDIA_KIT_TEMPLATES: MediaKitTemplate[] = [
  {
    id: 'classic',
    label: 'Classic Gradient',
    description: 'The default RGossips two-column layout — friendly and balanced.',
    minPlan: PLAN_IDS.STARTER,
    preview: 'linear-gradient(135deg,#9810FA 0%,#E60076 55%,#f472b6 100%)',
    previewColors: ['#9810FA', '#E60076', '#f472b6'],
    accent: '#E60076',
    accentSoft: '#fdf2f8',
    heroInk: '#ffffff',
  },
  {
    id: 'glass_blue',
    label: 'Glass Blue',
    description: 'Frosted-glass cards over an editorial blue gradient — clean and modern.',
    minPlan: PLAN_IDS.PRO,
    preview: 'linear-gradient(160deg,#dce9f8 0%,#bcd6ef 50%,#1564d6 100%)',
    previewColors: ['#dce9f8', '#bcd6ef', '#1564d6'],
    accent: '#1564d6',
    accentSoft: '#eff6ff',
    heroInk: '#0b2545',
  },
  {
    id: 'editorial_noir',
    label: 'Editorial Noir',
    description: 'Magazine-style serif typography on warm paper — premium and considered.',
    minPlan: PLAN_IDS.PRO,
    preview: 'linear-gradient(135deg,#f4efe6 0%,#ddd2c0 60%,#16130f 100%)',
    previewColors: ['#f4efe6', '#ddd2c0', '#16130f'],
    accent: '#1f1a14',
    accentSoft: '#f4efe6',
    heroInk: '#1f1a14',
  },
  {
    id: 'bento_sunset',
    label: 'Bento Sunset',
    description: 'Bento-grid tiles with a sunset gradient — playful and high-energy.',
    minPlan: PLAN_IDS.ELITE,
    preview: 'linear-gradient(135deg,#ff9a56 0%,#ff5d73 50%,#c850c0 100%)',
    previewColors: ['#ff9a56', '#ff5d73', '#c850c0'],
    accent: '#c850c0',
    accentSoft: '#fdf4ff',
    heroInk: '#ffffff',
  },
  {
    id: 'neo_brutalist',
    label: 'Neo-Brutalist',
    description: 'Hard borders, mono type and chunky shadows — loud and unforgettable.',
    minPlan: PLAN_IDS.ELITE,
    preview: 'linear-gradient(135deg,#ffd23f 0%,#E94560 55%,#7F47CD 100%)',
    previewColors: ['#ffd23f', '#E94560', '#7F47CD'],
    accent: '#0f0a1a',
    accentSoft: '#fef9c3',
    heroInk: '#0f0a1a',
  },
];

const PLAN_RANK: Record<PlanId, number> = {
  [PLAN_IDS.STARTER]: 1,
  [PLAN_IDS.PRO]: 2,
  [PLAN_IDS.ELITE]: 3,
};

export const MEDIA_KIT_TEMPLATE_CHANGE_LIMITS: Record<PlanId, number> = {
  [PLAN_IDS.STARTER]: 0,
  [PLAN_IDS.PRO]: 3,
  [PLAN_IDS.ELITE]: Infinity,
};

export function canUseMediaKitTemplate(plan: PlanId, templateId: string): boolean {
  const tmpl = MEDIA_KIT_TEMPLATES.find(t => t.id === templateId);
  if (!tmpl) return false;
  return (PLAN_RANK[plan] || 0) >= (PLAN_RANK[tmpl.minPlan] || 0);
}

export function profileCanUseMediaKitTemplate(
  profile: PlanProfile,
  templateId: string,
): boolean {
  return canUseMediaKitTemplate(getEffectivePlan(profile), templateId);
}

export function getMediaKitTemplateChangeLimit(plan: PlanId): number {
  return MEDIA_KIT_TEMPLATE_CHANGE_LIMITS[plan] ?? 0;
}

export interface TemplateChangeUsage {
  used: number;
  limit: number;
  remaining: number;
  plan: PlanId;
}

export function getProfileTemplateChangeUsage(
  profile: PlanProfile,
): TemplateChangeUsage {
  const plan = getEffectivePlan(profile);
  const limit = getMediaKitTemplateChangeLimit(plan);
  const used =
    (profile as any)?.media_kit_template_changes ||
    (profile as any)?.mediaKitTemplateChanges ||
    0;
  const remaining = isFinite(limit) ? Math.max(0, limit - used) : Infinity;
  return {used, limit, remaining, plan};
}

/**
 * Monthly AI-generation quota status. `usedThisMonth` is fetched by the caller
 * from `ai_generation_usage` (sum of `count` for the current YYYY-MM). Mirrors
 * getProfileTemplateChangeUsage. `remaining` is Infinity for unlimited (Elite).
 */
export function getAiUsageStatus(profile: PlanProfile, usedThisMonth = 0) {
  const plan = getEffectivePlan(profile);
  const limit = getFeatureValue(plan, 'ai_generations_limit');
  const numeric = typeof limit === 'number' ? limit : 0;
  const unlimited = !isFinite(numeric);
  const remaining = unlimited ? Infinity : Math.max(0, numeric - usedThisMonth);
  return {used: usedThisMonth, limit: numeric, remaining, unlimited, plan};
}
