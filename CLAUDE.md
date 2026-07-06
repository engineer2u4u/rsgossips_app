# CLAUDE.md

Working notes for the RGossips React Native app. Keep this in sync as the codebase evolves — when adding a substantial pattern, screen, or workflow, come back and update the relevant section.

## What this app is

RGossips is an influencer marketing marketplace. Creators discover brand campaigns, apply, submit deliverables, and get paid. Brands can also sell "Services" (Reels, story takeovers, ambassadorships, etc.) with a quote flow. The Next.js web app at `D:/Development/React/RS_Gossips` is the source of truth for UX and edge functions; this mobile app is a React Native port that must stay in feature/element parity where possible.

## Tech stack

- **React Native 0.84.1** + **React 19** + **TypeScript**
- **NativeWind 4** (Tailwind classes compiled for RN) — className props are supported alongside `style`
- **React Navigation 7** with `createNativeStackNavigator` (see [App.tsx](App.tsx))
- **Supabase 2** for auth + edge functions (`invokeFn` wrapper in [src/lib/api.ts](src/lib/api.ts))
- **Reanimated 4** + **reanimated-carousel v4** — carousels use `onConfigurePanGesture` (not the deprecated `panGestureHandlerProps`)
- **react-native-linear-gradient** for gradients, **react-native-svg** + **@react-native-masked-view/masked-view** for gradient text/icons
- **react-native-razorpay** + **react-native-inappbrowser-reborn** for Stripe checkout on-device
- **react-native-chart-kit** for Campaign Analytics charts
- **react-native-async-storage** for session persistence (Supabase `storage` option)

## Repo layout

```
App.tsx                              — root, RootStack + linking config
android/                             — native Android project
  app/release.keystore               — signed release keystore (gitignored)
  keystore.properties                — signing creds (gitignored)
ios/                                 — native iOS project
src/
  screens/                           — top-level route components
  components/                        — shared UI (78+ files)
  layouts/                           — SafeArea + BottomNav wrappers
  context/                           — AuthContext, LoadingContext
  hooks/                             — useBrandTrustScore, useInfluencerCampaigns, usePlan
  lib/                               — api.ts, plans.ts, services.ts, image-upload.ts, etc.
  theme/brand.ts                     — BRAND palette + gradients + CARD_SHADOW
  utils/                             — matchScore, supabase client, device-session, instagram-url
```

## Auth flow

- Sessions persist via AsyncStorage (`utils/supabase.ts`).
- `AuthContext` (`src/context/AuthContext.tsx`) exposes `user`, `profile`, `role`, `loading`, `signOut`, `refreshProfile`, `refreshInstagram`, `instagramTokenMissing`.
- **RootStack in `App.tsx` splits into two stacks based on `user`** — unauthed stack has only `Login` + `ConsentPolicy` (modal); authed stack has every dashboard route. Once `user` flips truthy the navigator swaps stacks automatically (no `navigation.reset` needed).
- Splash stays up while `loading || (user && !role)` — 3s safety timeout falls through to influencer default so a slow/failed `check-profile` doesn't lock the user on a spinner.
- `check-profile` returns `instagram_connected: boolean` (raw token stays server-side). The `InstagramRequiredGate` fires only when BOTH `profile.instagram_connected === false` AND `instagramTokenMissing` — a stale check-profile alone can't gate a user whose token is actually still valid.
- Deep link: `rgossips://?invited=<handle>` opens LoginScreen with `route.params.invited`, which resolves via `lookup-invitation` and jumps straight to Instagram OAuth.

## Common commands

```bash
# Metro bundler
npx react-native start

# Android debug
npx react-native run-android

# Android release signed AAB + APK
cd android && ./gradlew.bat assembleRelease bundleRelease
# Outputs:
#   android/app/build/outputs/apk/release/app-release.apk
#   android/app/build/outputs/bundle/release/app-release.aab

# iOS (requires macOS)
cd ios && bundle install && bundle exec pod install
# then open ios/RGossips.xcworkspace in Xcode

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Known pre-existing issues (leave alone unless asked)

- `src/screens/InfluencerPricing.tsx` around line 340 has a TS2345 mismatch between a Promise-shaped `then(value => …)` and a `() => void` param. It's pre-existing; every TS check reports it. **Do not "fix" it as a side task** — the file has payment/subscription logic and any change needs a proper review.
- `src/lib/image-picker.ts` may report a missing `react-native-image-crop-picker` type declaration; the module IS installed and works at runtime.

## Web parity checklist

Whenever building or updating a screen that has a web equivalent, cross-check `D:/Development/React/RS_Gossips/src/{app,components}` for the corresponding file. Notable pairs:

| Mobile file | Web counterpart |
|---|---|
| `src/components/PaymentMethods.tsx` | `src/components/PaymentMethods.jsx` |
| `src/components/PrivacySettings.tsx` | `src/components/PrivacySettings.jsx` |
| `src/components/NotificationSettings.tsx` | `src/components/NotificationSettings.jsx` |
| `src/components/HelpAndSupport.tsx` | `src/components/HelpAndSupport.jsx` |
| `src/components/CampaignAnalytics.tsx` | `src/components/CampaignAnalytics.jsx` |
| `src/components/MyInformationDetail.tsx` | `src/components/MyInformationDetail.jsx` |
| `src/components/SupportChatModal.tsx` | `src/components/SupportChat.jsx` |
| `src/components/CompleteProfileCard.tsx` | Home streak card (part of home page) |
| `src/screens/InfluencerCampaign.tsx` | `src/app/influencer/campaigns/page.js` |
| `src/screens/InfluencerDiscover.tsx` | `src/app/influencer/brands/page.js` |
| `src/screens/InfluencerOfferDetail.tsx` | `src/app/influencer/offers/[id]/page.js` |
| `src/screens/InfluencerServicesList.tsx` | `src/app/influencer/services/page.js` |
| `src/screens/InfluencerServiceOrderDetail.tsx` | `src/app/influencer/services/orders/[id]/page.js` |

## Conventions

- **NativeWind + inline `style`** — use whichever is clearer; when combining, `style` wins for numeric values. For iOS-specific spacing, prefer `Platform.OS === 'ios' ? A : B` in `style` rather than conditional Tailwind classes.
- **Card shadows** — Tailwind's `shadow-sm` renders on iOS but not Android (no `elevation`). Use an explicit `shadowColor + shadowOpacity + shadowRadius + shadowOffset + elevation` block, or the `CARD_SHADOW` constant from `theme/brand.ts`.
- **Brand gradient** — `BRAND_GRADIENT_WARM = ['#f5907f', '#c95fa2']` is the app's warm gradient. The pink `#FA288A` is used for the primary CTA (Onboarding "Next", "Send OTP", "Verify & Continue"). The purple→pink `['#9810FA', '#E60076']` is used for secondary CTAs (Apply Now, Save Changes, etc.).
- **List pagination** — `InfluencerDiscover`, `InfluencerCampaign`, `InfluencerServicesList` use client-side pagination: `PAGE_SIZE=10` initially, `+LOAD_MORE_STEP=6` on scroll-near-end, gated by a `loadingMoreRef` debounce.
- **Home carousels** — `DealOfDayCarousel`, `TopPicksCarousel`, `StayCarousel` are `reanimated-carousel` v4 with `autoPlay`, and `onConfigurePanGesture={g => g.activeOffsetX([-5, 5]).failOffsetY([-8, 8])}` so vertical pans bubble to the parent ScrollView while horizontal claims early.
- **Match scoring** — `utils/matchScore.ts` exposes `calculateBrandMatchScore` and `calculateCampaignMatchScore` used by both cards and list sorting. Brands list sorts by `_matchScore` descending; cache the score on the row so the sort and the badge stay in lockstep.
- **Payment methods CRUD** — always route **add** through the `register-payout-method` edge function (not a direct `supabase.from('payment_methods').insert(...)`). It validates the payload shape server-side (NPCI VPA / 11-char IFSC / 9–18 digit account), inserts the row with every NOT NULL column populated (`validation_status`: `success` for UPI, `manual` for bank — admin verifies at payout time), auto-primaries the user's first method, and resumes `pending_creator_info` payouts for validated primaries. Payouts are manual: it makes **no RazorpayX calls** and inserts `razorpay_fund_account_id` as null. There is no edit mode — to change details, delete and re-add. Set-primary/delete stay as direct table writes (matching web), but always check the returned `error` — supabase-js resolves failed writes instead of throwing, so an unchecked result is a silent no-op.
- **Notifications** — the `NotificationsList` tap handler resolves a destination from the body `link` (web hrefs → RN routes via `routeFromLink`) or falls back to a type + campaign_id router. Tap always marks the row read; navigation happens after.
- **Instagram share** — `Share.share` on iOS treats `message` and `url` as separate components and concatenates them. Send them as separate keys on iOS; keep the URL inline in `message` on Android.

## Commit style

- Present tense, imperative mood (`feat(x): …`, `fix(y): …`, `chore: …`).
- `feat(scope):` for user-facing features, `fix(scope):` for bug fixes, `chore:` for tooling / dependencies / config.
- Body should explain WHY, not just what. Reference filenames + line ranges when it helps future readers understand the change.
- Trailer:
  ```
  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```
- **Never commit `.env`**. Rotate any secrets already in git history via the provider.
- **Never commit `android/keystore.properties`** or `android/app/release.keystore` — both gitignored.

## Update this file

When adding a **new screen, edge function, cross-platform contract, common bug pattern, or non-obvious runtime dependency**, update the relevant section here. Skip trivial UI tweaks and one-off fixes — those belong in the commit message, not in this doc.
