// Remembers which role the user signed in as, so a session restored on the
// next launch can look up the RIGHT profile table.
//
// Why this exists: `check-profile` accepts an optional `table` and, when it is
// omitted, queries influencer_profiles and brand_profiles together and returns
// whichever it finds — checking influencer FIRST. On restore the app had no
// role to pass, so it always took that unscoped path. Combined with the
// role-timeout fallback in App.tsx, a brand could land on InfluencerHome
// rendering a brand account's data.
//
// Scoping the lookup also gives an honest failure: asking for a brand profile
// and finding none is "no brand profile on this account", not "here, have the
// influencer one".
//
// AsyncStorage matches how device-session.ts persists `rg.device_id`.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'rg.role';

export type AppRole = 'brand' | 'influencer';

/** The profile table backing a role — the `table` argument check-profile wants. */
export function tableForRole(role: AppRole): string {
  return role === 'brand' ? 'brand_profiles' : 'influencer_profiles';
}

/** Persist the role the user signed in as. Never throws. */
export async function rememberRole(role: string | null | undefined): Promise<void> {
  try {
    if (role === 'brand' || role === 'influencer') {
      await AsyncStorage.setItem(STORAGE_KEY, role);
    }
  } catch {
    // Storage failure just means the next restore falls back to the unscoped
    // lookup — degraded, not broken.
  }
}

/** The remembered role, or null when there isn't one. Never throws. */
export async function getRememberedRole(): Promise<AppRole | null> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v === 'brand' || v === 'influencer' ? v : null;
  } catch {
    return null;
  }
}

/** Clear on sign-out so the next account is not looked up as the previous one. */
export async function forgetRole(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Non-fatal.
  }
}
