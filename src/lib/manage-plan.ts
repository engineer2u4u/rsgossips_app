// Plan management is handled on the web, not in the app. The mobile app shows
// no prices and no in-app checkout — a "Manage plan" action simply opens the
// website in the system browser, where the user can view and change their
// plan. This keeps the app aligned with App Store / Play Store rules for
// consumption-only apps (no in-app purchase UI, no steering copy).
//
// We open the pricing URL directly: the web app serves it straight to a
// logged-in session, and bounces a logged-out visitor to
// `/login?redirect=/influencer/pricing` so they sign in and land back on
// pricing instead of the dashboard.

import {Linking} from 'react-native';

// Matches the deep-link prefixes registered in App.tsx.
const WEB_BASE_URL = 'https://rgossips.com';
const MANAGE_PLAN_PATH = '/influencer/pricing';

// Tells the web app this visitor arrived from the mobile app so it can skip
// its "for a better experience use our mobile app" nudge — the user is
// coming *from* that app, so the prompt is confusing. The web side latches
// this into sessionStorage on first load (src/lib/app-handoff.js) because
// the param does not survive its logged-out redirect to /login.
const APP_HANDOFF_QUERY = 'from=app';

export const MANAGE_PLAN_URL = `${WEB_BASE_URL}${MANAGE_PLAN_PATH}?${APP_HANDOFF_QUERY}`;

export async function openManagePlan(): Promise<void> {
  try {
    await Linking.openURL(MANAGE_PLAN_URL);
  } catch {
    // If the browser can't be opened there's nothing actionable to show the
    // user; swallow so a failed hand-off never crashes the calling screen.
  }
}
