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
 *  - `isSubscribed(profile)` — true when the user holds any paid plan.
 *
 * There is NO free trial. Anything that is not one of the three paid
 * tiers resolves to `free`, whose only entitlement is
 * FREE_BARTER_APPLICATIONS barter applications for the life of the
 * account. Most existing rows literally store "trial" in
 * subscription_plan — that was the signup default and now means nothing
 * more than "has not paid".
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
  // Not a purchasable plan — the state of having bought nothing.
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ELITE: 'elite',
} as const;

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS];

/** A tier a creator can actually pay for — `PlanId` minus `free`. */
export type PaidPlanId = Exclude<PlanId, 'free'>;

/** The three tiers a creator can actually buy. */
export const PAID_PLAN_IDS: string[] = [
  PLAN_IDS.STARTER,
  PLAN_IDS.PRO,
  PLAN_IDS.ELITE,
];

/**
 * How many barter campaigns an unsubscribed creator may apply to.
 * Lifetime, not monthly. Enforced server-side in apply-campaign
 * (supabase/functions/_shared/plan.ts); everything here is presentation.
 */
export const FREE_BARTER_APPLICATIONS = 3;

export const PLAN_PRICING = {
  starter: {monthly: 99, annual: 899, monthlyEquivalent: 75},
  pro: {monthly: 299, annual: 2699, monthlyEquivalent: 225},
  elite: {monthly: 699, annual: 6299, monthlyEquivalent: 525},
};

/* ─────────── payment gateway plan / price ids ─────────── */

export type BillingCycle = 'monthly' | 'annual';

export const RAZORPAY_KEY_ID = NEXT_PUBLIC_RAZORPAY_KEY_ID;

export const PLAN_RAZORPAY_IDS: Record<PaidPlanId, Record<BillingCycle, string>> = {
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

export const PLAN_STRIPE_PRICES: Record<PaidPlanId, Record<BillingCycle, string>> = {
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
export type FeatureRow = {
  starter: FeatureCell;
  pro: FeatureCell;
  elite: FeatureCell;
  /** Derived from the FREE_TIER allowlist below, not written by hand. */
  free?: FeatureCell;
};

export const FEATURE_MATRIX: Record<string, FeatureRow> = {
  // Discovery & Visibility
  discovery_listed:             {starter: true,  pro: true,  elite: true},
  discovery_priority:           {starter: false, pro: true,  elite: true},
  discovery_top_placement:      {starter: false, pro: false, elite: true},
  discovery_homepage_spotlight: {starter: false, pro: false, elite: true},
  badge_verified_eligible:      {starter: true,  pro: true,  elite: true},
  badge_pro_verified:           {starter: false, pro: true,  elite: false},
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

// Everything the free tier includes, and nothing else. Any key absent here
// is locked for free — the default is deny, so a feature added to the matrix
// later cannot leak into the free tier by omission.
//
// Discovery stays on deliberately: being findable by brands is supply for
// the marketplace, not a perk the creator is buying.
const FREE_TIER: Record<string, FeatureCell> = {
  discovery_listed: true,
  badge_verified_eligible: true,
  campaign_applications_limit: FREE_BARTER_APPLICATIONS,
  support_standard: true,
};

for (const [key, row] of Object.entries(FEATURE_MATRIX)) {
  row.free = Object.prototype.hasOwnProperty.call(FREE_TIER, key)
    ? FREE_TIER[key]
    : typeof row.starter === 'number'
      ? 0
      : false;
}

// The matrix stores a bare number for applications, but the free tier's three
// are lifetime AND barter-only — "3/month" would be a lie.
export const FREE_TIER_LABELS: Record<string, string> = {
  campaign_applications_limit: `${FREE_BARTER_APPLICATIONS} barter, one-time`,
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
      {key: 'badge_pro_verified', label: 'Pro verified badge'},
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

export function formatFeatureValue(
  value: FeatureCell | null | undefined,
  opts?: {plan?: PlanId; key?: string},
): string {
  // Free-tier values a generic formatter would misdescribe.
  if (opts?.plan === PLAN_IDS.FREE && opts.key && FREE_TIER_LABELS[opts.key]) {
    return FREE_TIER_LABELS[opts.key];
  }
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
  /** Paid through. NULL/absent = no known end, which never lapses. */
  plan_expires_at?: string | null;
  /** False once the recurring charge is stopped at the gateway. */
  auto_renew?: boolean | null;
} | null | undefined;

/**
 * Returns the plan ID a user is effectively on.
 *
 * An explicit paid tier wins; everything else — null, '', 'free', and the
 * legacy 'trial' most rows still carry — is `free`. No dates are consulted:
 * the trial was removed, so signup age no longer buys anything.
 *
 * Keep this identical to the web (src/lib/plans.js). A user's plan is
 * resolved from one field written by whichever rail they paid on, so any
 * divergence shows up as the app and web disagreeing about an unchanged
 * account.
 */
export function getEffectivePlan(profile: PlanProfile): PlanId {
  const plan = (profile?.subscription_plan || '').toLowerCase();
  if (!PAID_PLAN_IDS.includes(plan)) return PLAN_IDS.FREE;
  // A cancelled subscription keeps its plan until the paid period ends,
  // then drops to free — never to `starter`, which is itself a paid tier.
  return isPlanExpired(profile) ? PLAN_IDS.FREE : (plan as PlanId);
}

/**
 * True when a paid plan has run past the period it was paid for.
 *
 * Only a NON-NULL date in the past lapses anyone. Rows predating
 * migration 069 have plan_expires_at NULL and must keep their plan.
 */
export function isPlanExpired(profile: PlanProfile): boolean {
  const raw = profile?.plan_expires_at;
  if (!raw) return false;
  const at = Date.parse(String(raw));
  return Number.isFinite(at) && at < Date.now();
}

export interface SubscriptionStatus {
  plan: PlanId;
  subscribed: boolean;
  autoRenew: boolean;
  expiresAt: Date | null;
  daysLeft: number | null;
  cancelled: boolean;
  lapsed: boolean;
}

/** Renewal standing for the UI. Mirrors web getSubscriptionStatus. */
export function getSubscriptionStatus(profile: PlanProfile): SubscriptionStatus {
  const plan = getEffectivePlan(profile);
  const subscribed = plan !== PLAN_IDS.FREE;
  const raw = profile?.plan_expires_at;
  const parsed = raw ? new Date(String(raw)) : null;
  const expiresAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  // auto_renew defaults true, so a row predating 069 reads as renewing.
  const autoRenew = profile?.auto_renew !== false;
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000))
    : null;
  return {
    plan,
    subscribed,
    autoRenew,
    expiresAt,
    daysLeft,
    cancelled: subscribed && !autoRenew,
    lapsed: !subscribed && !!profile?.subscription_plan && isPlanExpired(profile),
  };
}

/** True when the creator holds any paid plan. The gate for everything. */
export function isSubscribed(profile: PlanProfile): boolean {
  return getEffectivePlan(profile) !== PLAN_IDS.FREE;
}

export interface FreeApplicationStatus {
  subscribed: boolean;
  used: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
}

/**
 * Free-tier application allowance. `used` is the creator's LIFETIME
 * application count, so the caller has to supply it — nothing on the profile
 * carries it.
 */
export function getFreeApplicationStatus(
  profile: PlanProfile,
  used = 0,
): FreeApplicationStatus {
  const subscribed = isSubscribed(profile);
  const remaining = subscribed
    ? Infinity
    : Math.max(0, FREE_BARTER_APPLICATIONS - used);
  return {
    subscribed,
    used,
    limit: FREE_BARTER_APPLICATIONS,
    remaining,
    exhausted: !subscribed && remaining === 0,
  };
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
  return row[plan] ?? null;
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
//   Free    — no media kit at all. It is a subscriber feature, so an
//             unsubscribed creator can pick no template (PLAN_RANK has no
//             `free` entry, so every template ranks above them).
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
  // Rank 0: every template sits above free, so an unsubscribed creator
  // can pick none of them.
  [PLAN_IDS.FREE]: 0,
  [PLAN_IDS.STARTER]: 1,
  [PLAN_IDS.PRO]: 2,
  [PLAN_IDS.ELITE]: 3,
};

export const MEDIA_KIT_TEMPLATE_CHANGE_LIMITS: Record<PlanId, number> = {
  [PLAN_IDS.FREE]: 0,
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
