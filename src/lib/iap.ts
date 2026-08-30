// Store billing for creator subscriptions.
//
// Creator plans are digital goods consumed in the app, so Apple guideline
// 3.1.1 and Google's payments policy require the store's own rail on mobile.
// Brand payments — escrow funding, service orders — stay on Razorpay, because
// those buy a real-world service from a person and store billing may NOT be
// used for them (Apple 3.1.5(a)). Do not route those through here.
//
// The entitlement is never decided on the device. A purchase yields a receipt
// which is sent to verify-iap-purchase; the server asks Apple or Google
// directly and writes subscription_plan only on their answer. Everything here
// is UI plumbing around that.

import {Platform} from 'react-native';
import type {Purchase} from 'react-native-iap';
import {invokeFn} from './api';
import type {PlanId, BillingCycle} from './plans';

// Must match PRODUCT_MAP in supabase/functions/_shared/iap.ts exactly, and the
// SKUs created in App Store Connect and Play Console. A mismatch fails
// verification loudly rather than granting the wrong tier — which is the
// intended behaviour, so keep all three in step.
export const IAP_SKUS: Record<PlanId, Record<BillingCycle, string>> = {
  starter: {
    monthly: 'rgossips.starter.monthly',
    annual: 'rgossips.starter.annual',
  },
  pro: {
    monthly: 'rgossips.pro.monthly',
    annual: 'rgossips.pro.annual',
  },
  elite: {
    monthly: 'rgossips.elite.monthly',
    annual: 'rgossips.elite.annual',
  },
};

export const ALL_IAP_SKUS = Object.values(IAP_SKUS).flatMap(c => [
  c.monthly,
  c.annual,
]);

export type VerifyResult = {
  success?: boolean;
  entitled?: boolean;
  plan?: PlanId | null;
  status?: string;
  expiresAt?: string | null;
  error?: string;
};

/**
 * Hand a purchase to the server for verification.
 *
 * iOS identifies a transaction by its id; Android by the purchase token. Only
 * that identifier is sent — the server re-reads everything else from the store,
 * so nothing the device claims about price, product or validity is trusted.
 */
export async function verifyPurchase(purchase: Purchase): Promise<VerifyResult> {
  const isIOS = Platform.OS === 'ios';
  return invokeFn<VerifyResult>('verify-iap-purchase', {
    platform: isIOS ? 'ios' : 'android',
    ...(isIOS
      ? {transactionId: purchase.transactionId ?? (purchase as any).id}
      : {purchaseToken: purchase.purchaseToken}),
  });
}

/** SKU → plan, for showing the right tier after a restore. */
export function planForSku(sku: string): {plan: PlanId; cycle: BillingCycle} | null {
  for (const [plan, cycles] of Object.entries(IAP_SKUS) as [
    PlanId,
    Record<BillingCycle, string>,
  ][]) {
    for (const [cycle, id] of Object.entries(cycles) as [BillingCycle, string][]) {
      if (id === sku) return {plan, cycle};
    }
  }
  return null;
}

/**
 * Where "Manage plan" should go on mobile.
 *
 * Once billing runs through the store, the store owns cancellation and payment
 * method — and both forbid sending users elsewhere to manage it. The web
 * pricing hand-off in manage-plan.ts stays correct for the web app only.
 */
export const MANAGE_SUBSCRIPTION_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';
