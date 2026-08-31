# Publishing RGossips to the App Store

Companion to `release-guide.md`, which covers Google Play. The three-phase order is the same —
**Supabase backend → web app → mobile build** — and Phases 1 and 2 there are shared. Do them once
and both stores are served. Everything below replaces Phases 3 and 4.

> **You cannot do this on Windows.** Archiving and uploading require Xcode, which is macOS only.
> Every step in Phases 3 and 4 needs a Mac or a hosted macOS runner. There is no fastlane or CI
> config in this repo, so the flow is manual Xcode.

---

## Four blockers in the code

Unlike the Android side, iOS has real defects that must be fixed before an archive will even build
or behave. Fix all four on the Mac before anything else.

### 1. No signing team

`RGossips.xcodeproj/project.pbxproj` has `DEVELOPMENT_TEAM = ""` with `CODE_SIGN_STYLE = Manual`.
Xcode cannot resolve a provisioning profile, so **Archive fails outright**.

Fix: open the workspace, select the RGossips target → *Signing & Capabilities*, set your Team.
Switching to Automatic signing is the simpler path and lets Xcode manage the profile.

### 2. Push entitlement is set to development

`ios/RGossips/RGossips.entitlements`:

```xml
<key>aps-environment</key>
<string>development</string>
```

TestFlight and App Store builds run against the **production** APNs gateway. Every push token a
released build mints would be invalid, and notifications simply never arrive — with no error
surfaced to users or to you.

Fix: change to `production`. Xcode usually rewrites this automatically once the target uses a
distribution profile, so fixing blocker 1 may resolve it. Verify rather than assume.

### 3. The `rgossips://` URL scheme is not registered

`Info.plist` registers only `com.rgossips` under `CFBundleURLSchemes`. But `App.tsx` declares its
linking prefix as `rgossips://`, and the web app's "open in app" button navigates to exactly that.
On iOS nothing claims the URL, the fallback timer fires, and users land in the App Store instead of
the app they already have. Android registers both schemes and works correctly.

Fix: add `rgossips` alongside the existing entry:

```xml
<key>CFBundleURLSchemes</key>
<array>
  <string>com.rgossips</string>
  <string>rgossips</string>
</array>
```

### 4. App Transport Security is fully disabled

`NSAllowsArbitraryLoads` is `true`, permitting plaintext HTTP to any host. Reviewers ask for written
justification, and a blanket exception is the version they push back on most.

Fix: if nothing needs cleartext, delete the key. If something does, scope it to that host under
`NSExceptionDomains`. Note this also sits awkwardly with the App Privacy answer "data encrypted in
transit" — Android already ships `usesCleartextTraffic="false"` in release, and iOS should match.

---

## Phase 3 — Build on the Mac

### 3a. Install dependencies

```bash
cd ios
bundle install
bundle exec pod install
```

Use `bundle exec` — the Gemfile pins CocoaPods `>= 1.13` while excluding 1.15.0 and 1.15.1, which
break the build. A system-wide `pod` may be one of those.

Then open **`ios/RGossips.xcworkspace`** — never the `.xcodeproj`. The project alone omits the pods.

### 3b. Set the version and build number

Target → *General*, or in build settings:

| Setting | Current | Notes |
|---|---|---|
| `MARKETING_VERSION` | `1.0` | The version users see. Matches Android's `versionName` |
| `CURRENT_PROJECT_VERSION` | `14` | The build number. **Must increase on every upload** |

App Store Connect rejects a build whose number it has already seen for that version. Unlike Play,
you may reuse a build number under a *different* marketing version, but incrementing always is
simpler.

### 3c. Archive

Select **Any iOS Device (arm64)** as the destination — Archive is disabled while a simulator is
selected. Then *Product → Archive*.

The Organizer opens when it finishes. Choose *Distribute App → App Store Connect → Upload*.

### 3d. Verify before you upload

Worth checking in the Organizer, since each has bitten this project or its Android twin:

- Bundle ID reads `com.rgossips`
- The entitlements show `aps-environment: production`, not development
- The build number is higher than any previously uploaded

---

## Phase 4 — App Store Connect

### 4a. Create the app record

*My Apps → + → New App*

| Field | Value | Limit |
|---|---|---|
| Platform | iOS | |
| Name | `RGossips` | 30 |
| Subtitle | `Brand campaigns for creators` | 30 |
| Primary language | English (India) | |
| Bundle ID | `com.rgossips` | |
| SKU | anything internal, e.g. `rgossips-ios-001` | |

**On the name/subtitle pairing.** Apple indexes name + subtitle + keywords *together*, so a word
spent in one is wasted in the others. Keeping the name as the bare brand leaves the subtitle free to
carry every search term, and pushes "influencer" into the keywords field where it costs 10
characters instead of 21 of a visible title. This deliberately differs from the Play listing title
(`RGossips: Influencer Platform`), because Play has no subtitle field to carry those words.

**Keywords** — 100 characters, comma-separated, never shown to users. Repeat nothing from the name
or subtitle, and use no spaces after commas (Apple counts them):

```
influencer,collab,sponsorship,ugc,creator economy,barter,instagram,reels,brand deal,marketing
```

**This mints the numeric App Store ID.** Grab it immediately and paste it into `APP_STORE_URL` in
`rgossips_web/src/components/OpenInAppGate.jsx`, which currently ships the placeholder
`id0000000000`, then redeploy the web app. Any iOS visitor tapping "Use mobile app" today hits a
dead link.

### 4b. App Information

| Field | Value |
|---|---|
| Category | Business |
| Secondary category | Social Networking (optional) |
| Content rights | **Contains, shows, or accesses third-party content** — see below |
| Age rating | Questionnaire calculates **4+** — override to **18+**, see below |

**Age Ratings → Step 1: Features.** In-app controls first:

| Question | Answer | Why |
|---|---|---|
| Parental Controls | No | None exist |
| Age Assurance | No | No DOB collected in the app, no verification mechanism. The 18+ policy is stated, not enforced |

Then capabilities:

| Question | Answer | Why |
|---|---|---|
| Unrestricted Web Access | No | No embedded browser for free navigation. `Linking.openURL` hands off to Safari, and the in-app browser is scoped to the fixed Instagram OAuth URL |
| User-Generated Content | **Yes** | Media kits, profiles, campaign briefs, deliverables |
| Social Media | No | No feed, likes, shares or resharing. Discovery is marketplace listing, not amplification |
| Social Media Disabled for Under 13 | n/a | Should grey out once Social Media is No. If forced, answer No — there are no social capabilities to gate |
| Messaging and Chat | No | No user-to-user messaging. Pitches and deliverables are one-way submissions; support chat is user-to-operator |
| Advertising | No | No ads SDK, and `featured_campaigns` is admin-curated (`position`, `is_active`, no payment columns) — featured placement is editorial, not sold |

Two caveats:

- **Messaging = No depends on removing the mock chat routes.** A reviewer who reaches `BrandChats`
  or `InfluencerChats` sees a chat UI with contacts, which directly contradicts the answer. That
  makes unrouting them a submission blocker, not a tidiness item.
- **Unrestricted Web Access is a judgement call.** Creator deliverable links in
  `ApplicationStatusBar` are user-supplied URLs opened externally. No is the truer description of an
  app with no browser, but Yes is defensible if you prefer the conservative answer.

**Calculated rating vs override.** Those answers produce a calculated rating of **4+**. Do not
accept it — choose *Override to Higher Age Rating* and set **18+** (17+ if 18+ is unavailable).

4+ is indefensible here: creators enter commercial arrangements and receive payouts, which needs
capacity to contract; the app collects PAN, GSTIN and bank details; user content is unmoderated by
age; and Play's target audience is already declared "18 and over only", so 4+ would contradict it
across stores.

Never select **Made for Kids** — that pulls the app into the Kids Category with COPPA obligations,
ad restrictions and mandatory parental gates.

**Age Suitability URL** (optional): `https://rgossips.com/consent/influencer`, which states the age
requirement.

> **Unresolved conflict.** Privacy Policy §14 says the platform is 18+ *except* that influencers
> aged 13–17 may use it with verifiable guardian consent. No age assurance exists — the app never
> collects or checks a date of birth — so that pathway is written but unimplemented. Either strike
> the provision so the policy reads as a clean 18+ platform, or build DOB collection plus a
> guardian-consent flow. Given payouts and tax identifiers are involved, striking it is the safer
> course; an unimplemented minors provision is a liability.

**Content Rights — answer Yes.** The app shows third-party content on three fronts: Instagram media
and metrics via Meta's Graph API, creator uploads (media kits, deliverables, profile photos), and
brand logos and campaign creative. Answering No would be plainly false — the media kit screen is
nothing but someone's Instagram posts.

Ticking Yes attests that the rights exist, and they are papered:

- **Instagram** — the creator authorises access per-account through Instagram Business OAuth, under
  Meta's platform terms, revocably.
- **Creator uploads** — Influencer Consent Policy §6.2 leaves ownership with the creator, §6.3
  grants a time-bound licence, so display rights are explicit rather than assumed.
- **Brand assets** — Brand Consent Policy §8 has brands warrant they own or have licensed what they
  upload, with indemnity.

Note this answer pairs with Guideline 1.2: an app showing third-party content is expected to
moderate it. Yes here plus no way to action a report is the combination reviewers notice — see the
outstanding moderation queue in `rsgossips_admin`.

### 4c. App Privacy

Apple's nutrition labels cover the same ground as Play's Data safety. The table in `listing.md`
maps across directly:

| Apple category | Collected |
|---|---|
| Contact Info | Name, Email Address, Phone Number |
| Financial Info | Payment Info, Purchase History, Other Financial Info |
| Location | Coarse Location only |
| User Content | Photos or Videos, Other User Content |
| Identifiers | Device ID, User ID |
| Usage Data | Product Interaction |

For each: **Used for App Functionality**, **linked to the user**, **not used for tracking**. Declare
no Diagnostics — there is no crash-reporting SDK in the app.

"Not used for tracking" is correct only while there is no ads or attribution SDK. Adding one later
means updating this and shipping an ATT prompt.

### 4d. App Review Information — the part that gets apps rejected

**Sign-in required: Yes.** Provide the review account, same as Play:

```
Login is by phone number and a one-time code.

1. Open the app and choose "Sign in".
2. Enter phone number: <REVIEW NUMBER>
3. Tap "Send OTP". No SMS or WhatsApp message is sent for this number.
4. Enter the code: <REVIEW CODE>

This account is pre-configured with a connected Instagram profile, so no
Instagram login is required at any point.
```

This depends on `REVIEW_TEST_PHONES` / `REVIEW_TEST_OTP` being set in Supabase (Phase 1c of
`release-guide.md`). Without them the reviewer waits for a WhatsApp message on a phone they do not
have, and the submission fails on day one.

Add notes covering the three guidelines most likely to be raised:

- **Guideline 1.2 — user-generated content.** State that the app provides in-app reporting and
  blocking, and name where: the safety menu on creator cards. This must be *shipped* in the build
  you submit, not merely built.
- **Guideline 5.1.1(v) — account deletion.** State that account deletion is available in-app for
  both roles (creators: Profile → Privacy & Security → Delete Account; brands: Profile → Delete
  Account), with a 30-day grace window, and give the public URL
  `https://rgossips.com/consent/delete-account`. Apple requires deletion to be initiated **from
  inside the app** — a web-only route is not sufficient here, which is stricter than Play.
- **Guideline 3.1.1 — in-app purchase.** Resolved by shipping IAP, and worth stating plainly in the
  review notes: creator subscriptions are sold through **StoreKit auto-renewable subscriptions**
  (`rgossips.{starter|pro|elite}.{monthly|annual}` in the RGossips Plans group). "Manage plan" opens
  the in-app pricing screen, cancellation links to the system subscription settings, and nothing in
  the app directs a user to a website to subscribe.
- **Guideline 3.1.5(a) — real-world services.** Explain the second payment rail before a reviewer
  asks. Brand escrow funding and service orders go through **Razorpay**, deliberately: those buy a
  real-world service performed by a person (a creator making a Reel), which store billing may not be
  used for. That is why the app contains both an IAP flow and a Razorpay flow — they serve different
  purchases, and neither is an alternative to the other.
- **Restore Purchases** exists on the pricing screen, as 3.1.1 requires.
- **Sandbox** — `IAP_ALLOW_SANDBOX=true` is set on the backend. Reviewers purchase in the sandbox
  environment, and the server would otherwise reject their receipts and fail the subscription flow.
  Do not turn it off before review.

### 4e. Screenshots

Apple requires per-device-size sets, and unlike Play will not accept a single set:

| Display | Size | Required |
|---|---|---|
| 6.9" (iPhone 16 Pro Max) | 1320 × 2868 | Yes |
| 6.5" (iPhone 11 Pro Max) | 1242 × 2688 | Yes |
| 13" iPad Pro | 2064 × 2752 | Only if you ship iPad support |

Capture from a release build on the simulator (`⌘S` in Simulator saves to Desktop). Same subjects as
Play: creator Home, campaign detail with the match score, apply flow, media kit, brand discover,
transactions.

### 4e-bis. Pricing and Availability

| Field | Value |
|---|---|
| Base Country or Region | **India (INR)** — not the US default |
| Price | **Free** — no IAP; subscriptions are handled on the web |
| App Availability | **Specific Countries or Regions → India only** |

**India-only is a technical constraint, not a commercial preference.** Both OTP functions hardcode
the country code:

```js
const canonicalPhone  = `91${phoneDigits.slice(-10)}`;                       // sender
const normalizedPhone = `91${String(phone).replace(/\D/g,"").slice(-10)}`;   // verifier
```

A US number `+1 415 555 0123` normalises to `914155550123` — a nonsense Indian number that never
receives a code. **Sign-up is impossible outside India.** Payouts agree: `register-payout-method`
validates NPCI VPAs and 11-character IFSC codes, so a non-Indian creator cannot be paid either.

Releasing worldwide would ship an app that 174 of 175 regions cannot register for — grounds for
rejection on functionality, and a stream of one-star reviews from users stuck at the OTP screen if
it passes. EU availability additionally triggers Apple's DSA trader requirements, publishing
verified trader details on the listing, for a market the payout pipeline cannot serve.

Expanding later is a settings change with no resubmission.

### 4f. Submit

Attach the uploaded build, complete Pricing (Free) and Availability, then *Add for Review*.

First reviews typically take 24–48 hours, faster than Play's first pass, but a 3.1.1 or 1.2 flag
turns it into a multi-round conversation.

---

## After it is live

- [ ] Clear `REVIEW_TEST_PHONES` in Supabase — the static-OTP account should not outlive review
- [ ] Confirm `APP_STORE_URL` in `OpenInAppGate.jsx` carries the real numeric ID
- [ ] Test a real push notification through TestFlight before trusting production APNs
- [ ] Verify `rgossips://` deep links open the app from the web "open in app" button

---

## Differences from Play worth knowing

| | Play | App Store |
|---|---|---|
| Build artifact | `.aab` via Gradle | `.xcarchive` via Xcode |
| Version gate | `versionCode`, permanently burned | Build number, per marketing version |
| Signing | Your upload key; Google re-signs | Apple distribution certificate + profile |
| Account deletion | Public URL sufficient | Must also be initiated **in-app** |
| Subscriptions | Product + base plan, two objects | One product per subscription, in a group |
| Store billing | Play Billing | StoreKit — same entitlement, one `subscription_plan` field |
| Restore Purchases | Not required | **Required**; review fails without it |
| IAP review assets | None | A **screenshot of the purchase sheet** per subscription |
| Screenshots | One phone set | One set per required display size |
| First review | Several days | Usually 24–48 hours |

The subscription modelling difference is the one that bites: Google nests base plans inside a
subscription, so six SKUs could be three subscriptions with two plans each — but
`purchases.subscriptionsv2.get` reports the *subscription* id, not the base plan id, so that shape
would make monthly and annual indistinguishable to the verifier. Play therefore has six separate
subscriptions with one base plan apiece, mirroring Apple one-to-one.
