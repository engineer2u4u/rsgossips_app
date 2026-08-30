// Single entry point for every "upgrade" / "manage plan" CTA in the app.
//
// This USED to open rgossips.com in the system browser, back when the app
// carried no purchase UI and plans were bought on the web. Store billing
// reversed that: creator plans are digital goods, so Apple guideline 3.1.1
// and Google's payments policy require the store's own rail on mobile — and
// they equally prohibit pointing users at a website to subscribe, which is
// what the old hand-off did.
//
// So this now navigates to the in-app pricing screen. Every upgrade CTA
// already funnels through here, which is why redirecting one function was
// enough to move all of them.
//
// MANAGE_PLAN_URL is kept for reference and for any non-purchase link that
// still wants the web pricing page; it is no longer used for navigation.

import {navigationRef} from './navigation';

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
  // Plans are now bought in-app through store billing, so this navigates to
  // the pricing screen instead of handing off to the website.
  //
  // Sending a mobile user to rgossips.com to subscribe is exactly the steering
  // Apple guideline 3.1.1 and Google's payments policy prohibit — the reason
  // the web hand-off had to go once IAP shipped. Every "upgrade" CTA in the
  // app funnels through this one function, so redirecting here fixes all of
  // them without touching ten call sites.
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)('InfluencerPricing');
    return;
  }

  // Navigation not mounted yet (deep link before the tree is ready, or an
  // early-render CTA). Falling back to the web is wrong under store rules, so
  // do nothing rather than steer — the user can reach plans from Profile.
}
