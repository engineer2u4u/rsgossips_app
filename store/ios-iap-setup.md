# iOS In-App Purchase — end-to-end setup & troubleshooting

Auto-renewable subscriptions (Starter / Pro / Elite × monthly / annual) through
StoreKit, verified server-side and granted only on Apple's word. Written from
the RGossips setup, with every failure we actually hit and how it was fixed.

The golden rule that shapes everything: **the device is never trusted.** A
purchase from the app is a *claim*; the entitlement is written only after the
App Store Server API confirms the transaction. A forged receipt is otherwise a
free Elite plan.

**The one identifier that ties it all together — keep these THREE in exact,
character-for-character sync, or verification fails loudly (by design):**

| Where | What |
|---|---|
| App | `IAP_SKUS` in `src/lib/iap.ts` |
| Server | `PRODUCT_MAP` in `rgossips_web/supabase/functions/_shared/iap.ts` |
| Apple | the **Product ID** of each subscription in App Store Connect |

Product IDs used: `rgossips.{starter,pro,elite}.{monthly,annual}` — 6 total.

---

## Phase 1 — App code

1. **Deps** (already in `package.json`):
   ```
   react-native-iap          # StoreKit / Play Billing wrapper (v16, Nitro)
   react-native-nitro-modules # its native runtime
   ```
   `cd ios && bundle exec pod install` after adding. First iOS build with these
   is the most likely to surface native build errors — see Troubleshooting.

2. **`src/lib/iap.ts`** — the source-of-truth SKU map + the verify call:
   - `IAP_SKUS` → the 6 product ids.
   - `verifyPurchase(purchase)` → sends **only** the identifier
     (`transactionId` on iOS) to `verify-iap-purchase`; the server re-reads
     price/product/validity from Apple, so nothing the device claims is trusted.
   - `planForSku()` maps a SKU back to plan+cycle for restore display.

3. **`src/hooks/useSubscriptionPurchase.ts`** — the whole lifecycle. The order
   is not incidental:
   1. `fetchProducts({skus: ALL_IAP_SKUS, type: 'subs'})` once `connected` —
      **prices come from the store, never `PLAN_PRICING`** (showing anything
      else is wrong and a review risk).
   2. `requestPurchase(... apple: {sku, appAccountToken: user.id})` — attach the
      user id so the store's own record identifies the buyer even if the app
      dies mid-payment. Apple requires `appAccountToken` to be a UUID; our auth
      ids already are.
   3. Purchases arrive on the **`onPurchaseSuccess` listener**, NOT as a return
      value (a purchase can complete after backgrounding, or replay on next
      launch). An `expectingPurchase` ref guards against showing "success" for a
      transaction restored at launch.
   4. Verify server-side → **`finishTransaction` ONLY after verification
      succeeds.** Finishing before verifying drops the receipt while the
      entitlement failed to write = user paid, got nothing, unrecoverable. iOS
      replays unfinished transactions on every launch, which is the safety net.
   5. `restore` (Apple **requires** a Restore control or review fails) →
      `getAvailablePurchases` → verify each → grant.

4. **`src/screens/InfluencerPricing.tsx`** — the paywall. Real lessons baked in:
   - Real store prices, `—` placeholder while loading (never a fake number).
   - Button `disabled={busy || !connected || !price || isCurrent}`.
   - `isCurrent` must match **tier AND cycle** — Pro Monthly and Pro Annual are
     different products, so check `currentCycle === cycle` too or both toggles
     wrongly show "Current".
   - Whole-screen loading overlay during purchase/verify/restore.
   - Success alert gated on the **verified, entitled** result only.
   - Restore + Manage buttons with ⓘ tooltips (store wording is platform-aware).

---

## Phase 2 — Server verification (Supabase edge functions)

Lives in `rgossips_web/supabase/functions/`:

- **`verify-iap-purchase/index.ts`** — identity from the JWT (never the body),
  asks the store, maps SKU→plan via `PRODUCT_MAP`, upserts `iap_subscriptions`
  (unique on `platform,store_subscription_id` → idempotent), writes
  `subscription_plan` only when the store says the sub is live.
- **`_shared/iap.ts`** — `verifyApple()` uses the **App Store Server API**
  (StoreKit 2 era), not the deprecated `/verifyReceipt`. Tries the production
  host then the sandbox host (never branch on a build flag — review runs sandbox
  against the production binary).
- **`iap-notifications`** — App Store Server Notifications v2 for out-of-band
  renewals/cancellations/refunds.

**Required Supabase secrets** (this is the step most likely to bite you):

| Secret | Value / where |
|---|---|
| `APPLE_ISSUER_ID` | App Store Connect → Users and Access → Integrations → **In-App Purchase** → Issuer ID |
| `APPLE_KEY_ID` | the generated **In-App Purchase** key's Key ID |
| `APPLE_PRIVATE_KEY` | the `.p8` file contents (downloadable once; PEM, whitespace is stripped server-side so newlines don't matter) |
| `APPLE_BUNDLE_ID` | `com.rgossips` |
| `IAP_ALLOW_SANDBOX` | `true` — else sandbox purchases (incl. Apple's reviewers) are rejected |
| `GOOGLE_SERVICE_ACCOUNT`, `ANDROID_PACKAGE_NAME` | Android only |

> ⚠️ **It MUST be an "In-App Purchase" key, not an "App Store Connect API"
> (Team) key.** The JWT includes a `bid` (bundle id) claim, which In-App
> Purchase keys require and Team keys reject with **401**.

Set them (in a terminal where `supabase login` is done — the token lives in the
macOS Keychain and is not readable from a non-interactive shell):
```bash
cd rgossips_web
supabase link --project-ref <ref>          # if not linked
supabase secrets set \
  APPLE_KEY_ID=<id> APPLE_ISSUER_ID=<uuid> \
  APPLE_BUNDLE_ID=com.rgossips IAP_ALLOW_SANDBOX=true \
  APPLE_PRIVATE_KEY="$(cat ~/Downloads/AuthKey_<KEYID>.p8)"
supabase secrets list                        # names only
```
Secrets are read at runtime (`Deno.env.get`) — no redeploy needed, ~30s to
propagate.

---

## Phase 3 — App Store Connect

1. **Agreements, Tax, and Banking → Paid Applications agreement = Active.**
   Do this FIRST. Until it's active StoreKit returns **zero products**, silently.
2. Create a subscription **group** ("RGossips Plans") with a localized name.
3. Create the **6 auto-renewable subscriptions** in that group. For each:
   - **Product ID** = one of the 6 strings, exact.
   - **Subscription Price** (INR — Apple auto-maps other storefronts).
   - **Localization**: display name + description.
   - **Availability**: **India** (must include the region your testers/users are
     in, or StoreKit won't return it to them).
   - **Review screenshot** of the real purchase sheet (needed to reach *Ready to
     Submit*; see the review-screenshot rules below).
4. Status flow per sub: *Prepare for Submission* → (all metadata) → *Ready to
   Submit*. The **first** auto-renewable subscription must be submitted **with an
   app version** — it rides in the app's review, not standalone.

**Review screenshot rules:** genuine in-app screenshot of the paywall/purchase
sheet showing the plan + real price; **≥ 640×920**, PNG/JPEG; no mockups. Real
users (and reviewers, from India) see **₹**, so capture with the India storefront
active. (App *listing* screenshots are different and need exact device sizes —
6.9": 1290×2796, 6.5": 1284×2778 / 1242×2688. Don't confuse the two.)

---

## Phase 4 — Testing

- **You need a real device.** IAP does **not** work on the Simulator
  (`connected` stays false → everything disabled).
- **TestFlight build:** IAP runs in sandbox **automatically** with your normal
  Apple ID — purchases are free, **no separate sandbox account needed**.
- **Xcode-run (development) build:** needs a **Sandbox Tester** (App Store
  Connect → Users and Access → Sandbox). Sign in at the Buy prompt, or
  **Settings → App Store → Sandbox Account** (that row only appears once a
  StoreKit build is installed, and it's at the very bottom).
- Product **fetch** doesn't require a sandbox account; **purchase** does.
- **Sandbox subscriptions renew/expire in ~5 minutes** (accelerated). A
  "monthly" sub is dead in 5 min, so Restore may find nothing — just buy again.
- Cross-platform proof of a working grant: the plan shows on
  `rgossips.com/influencer` too (same `subscription_plan` field).

---

## Troubleshooting — symptom → cause → fix

| Symptom | Cause | Fix |
|---|---|---|
| All plan prices show `—`, buttons disabled, **no** banner | StoreKit returned 0 products | Work down: Paid Apps agreement Active? On a real device/TestFlight (not Simulator)? All 6 have price+localization+India availability? Product IDs exact? Then **wait — up to 24h** after the agreement goes active for products to appear. |
| Prices `—` with amber **"Connecting…"** banner | `connected` is false | Running on Simulator, or not a StoreKit-capable build. Use a real device / TestFlight build. |
| Prices show in **$**, but the charge is **₹** | Product display follows the **device's App Store account region** (Settings → your name → Media & Purchases), while the sandbox tester only governs the *purchase* | Not a bug. Real India users see ₹. To see ₹ while testing, sign the **India sandbox account** in *Settings → App Store → Sandbox Account* **before** opening the paywall, then relaunch so it re-fetches. |
| Purchase succeeds → **"We couldn't verify that purchase"** | Server `verifyApple()` threw. The reason is in the app error's `(detail)` and in the edge-function log `store verification failed: …` | Read the detail. Usually the secrets below. |
| Log: **`Apple IAP secrets are not configured`** | One of `APPLE_ISSUER_ID/KEY_ID/PRIVATE_KEY/BUNDLE_ID` unset on Supabase | Set all four (Phase 2). |
| Log: **`Apple verification failed: Apple responded 401`** | Wrong key/issuer, or a **Team** key used instead of an **In-App Purchase** key (the JWT carries `bid`) | Generate an **In-App Purchase** key; re-set `APPLE_KEY_ID` + `APPLE_PRIVATE_KEY`. |
| Log: **`Apple verification failed: transaction not found`** | Propagation, or bundle-id / account mismatch | Retry in a minute; confirm `APPLE_BUNDLE_ID=com.rgossips` and the key belongs to the same team as the app. |
| **"Sandbox purchases are not accepted here."** | `IAP_ALLOW_SANDBOX` not `true` | Set `IAP_ALLOW_SANDBOX=true`. Never turn it off — Apple's reviewers buy in sandbox. |
| Restore says "nothing to restore" right after buying | Sandbox sub already expired (~5 min) | Buy again. |
| Gradient buttons render **shrunk / thin line** on iOS | `BVLinearGradient` collapses on new-arch when it holds children and sizes from padding | Render the gradient as an **absolute background** (`StyleSheet.absoluteFill`, no children) with label/icon as siblings; give the button an explicit `height` + `overflow:'hidden'`. |
| Both Monthly & Annual cards show "Current" | `isCurrent` matched tier only | Add the cycle: `currentPlan===plan && isSubscribed && currentCycle===cycle`. |

### Native build gotchas hit while getting the IAP build out (RN 0.84)
| Symptom | Cause | Fix |
|---|---|---|
| Link error: `Undefined symbol: facebook::react::Sealable / ShadowNode::getDebugName / BaseViewProps` | RN 0.84 ships a **prebuilt Release** React core; Debug-compiled Fabric components reference debug-only symbols it omits | `ENV['RCT_USE_PREBUILT_RNCORE'] ||= '0'` in the Podfile so React core builds from source (already set). |
| `Command GenerateDSYMFile failed` / `failed to create temporary file` in DerivedData | **Disk full** — dsymutil (huge with from-source core) can't write | Free space: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`, delete old iOS DeviceSupport, unused simulator runtimes. Also set Debug **Debug Information Format → DWARF** (no dSYM on dev builds). |
| Firebase pod install: `GoogleUtilities does not define modules` | Swift Firebase pods need module maps from C deps under static libraries | Add `:modular_headers => true` to `GoogleUtilities`, `FirebaseCore*`, `FirebaseInstallations`, `GoogleDataTransport`, `nanopb` in the Podfile (targeted, not global). |

---

## Pre-submission checklist
- [ ] All 6 subscriptions **Ready to Submit** (price, localization, India, review screenshot).
- [ ] Server secrets set; a real sandbox purchase grants the plan and shows on web.
- [ ] Restore Purchases works; Manage subscription opens the store.
- [ ] `aps-environment` etc. aside — the build is signed and archived (see `ios-mac-session.md`).
- [ ] **Rotate any Apple key** that was shared insecurely; re-set the secret.
- [ ] First subscription attached to the app-version submission (not standalone).
