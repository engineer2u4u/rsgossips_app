// Which rail owns this creator's subscription, and may this app sell here?
//
// Mirror of supabase/functions/_shared/subscription-rail.ts — keep the two in
// step. The server copy guards Razorpay checkout; this one guards the mobile
// paywall, and it has to, because a store purchase cannot be refused after
// the fact: Apple and Google only tell us about it when we verify the
// receipt, by which point the creator has been charged. The only place to
// stop a double subscription is before the sheet opens.
//
// `payment_gateway` names who bills TODAY. The platform in the user's hand
// says nothing about it — someone who subscribed on the web on Monday is
// holding an iPhone on Tuesday.

import {Platform} from 'react-native';

export type Rail = 'apple_iap' | 'google_play' | 'razorpay' | 'stripe';

const PAID_PLANS = new Set(['starter', 'pro', 'elite']);

/** The only rail allowed to sell inside this app. */
export function railForThisApp(): Rail {
  return Platform.OS === 'ios' ? 'apple_iap' : 'google_play';
}

export interface RailProfile {
  subscription_plan?: string | null;
  payment_gateway?: string | null;
  plan_expires_at?: string | null;
}

export interface RailStatus {
  rail: Rail | null;
  live: boolean;
  plan: string | null;
}

/**
 * Live until the paid period ends — which includes a cancelled subscription
 * that has not expired yet (they still hold what they paid for) and a
 * billing-retry or grace window (unlocking mid-hiccup would start a second
 * subscription on another rail). A null expiry means "no known end" and
 * keeps the plan.
 */
export function subscriptionRail(
  profile: RailProfile | null | undefined,
): RailStatus {
  const plan = String(profile?.subscription_plan || '').toLowerCase();
  if (!PAID_PLANS.has(plan)) return {rail: null, live: false, plan: null};

  const raw = profile?.plan_expires_at;
  if (raw) {
    const at = Date.parse(String(raw));
    if (Number.isFinite(at) && at < Date.now()) {
      return {rail: null, live: false, plan: null};
    }
  }

  const gateway = String(profile?.payment_gateway || '').toLowerCase();
  const rail =
    gateway === 'apple_iap' ||
    gateway === 'google_play' ||
    gateway === 'razorpay' ||
    gateway === 'stripe'
      ? (gateway as Rail)
      : null;

  return {rail, live: true, plan};
}

/**
 * May this app sell a new plan?
 *
 * Same rail → yes. Apple and Google handle upgrades and downgrades natively
 * within a subscription group, with proration; making someone cancel first
 * would throw away the days they have already paid for.
 *
 * A live plan with an unrecognised gateway is allowed through: locking
 * somebody out over missing data is worse than the rare duplicate.
 */
export function canSellInThisApp(profile: RailProfile | null | undefined): {
  allowed: boolean;
  blockedBy: Rail | null;
} {
  const status = subscriptionRail(profile);
  if (!status.live || !status.rail) return {allowed: true, blockedBy: null};
  if (status.rail === railForThisApp()) return {allowed: true, blockedBy: null};
  return {allowed: false, blockedBy: status.rail};
}
