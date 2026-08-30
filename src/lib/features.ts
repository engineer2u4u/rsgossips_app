// Client-side feature switches.
//
// These mirror server-side gates so the UI never advertises something the
// backend will refuse. Keep them in step — a screen offering a benefit the
// server declines is worse than not offering it at all, and on a store listing
// it is a review problem rather than just a bug.

/**
 * Rewards programme: referral discount, welcome RC bonus, RC balance and
 * redemption.
 *
 * OFF while store billing ships. Apple IAP and Google Play Billing charge a
 * fixed price from a price point fixed when the SKU is created — there is no
 * way to express a per-user discount computed from a wallet balance. Leaving
 * it enabled on the web only would mean this app either promises a discount it
 * cannot deliver, or points users at the website for a cheaper price, and the
 * latter is exactly the steering Apple guideline 3.1.1 prohibits.
 *
 * Mirrors REWARDS_ENABLED in supabase/functions/_shared/rewards.ts. Flip both
 * together, never one alone.
 */
export const REWARDS_ENABLED = false;
