# Play Console values for RGossips

**Status:** not yet published. `versionCode` is still `1` and nothing has been uploaded.

Everything below is meant to be pasted straight into Play Console. Nothing here is read by the
build — the store listing lives entirely in the Console, and this file is the record of what was
submitted so the two don't drift.

Character counts are given where Play enforces a limit.

Package: `com.rgossips` · Upload cert: `CN=RGossips` · SHA-256 `0F:64:8D:52:BD:5B:D4:E5…`

---

## Main store listing

### App name — 29/30

```
RGossips: Influencer Platform
```

"RGossips" alone has no search volume, so the category term carries the title — the heaviest field
Play indexes. Keep `app_name` in `strings.xml` as the bare "RGossips"; the launcher label and the
store title are independent, and a 29-character launcher label wraps badly on the home screen.

### Short description — 72/80

```
Get paid brand deals. Creators find campaigns, apply, and track payouts.
```

Second-most indexed field. It repeats "brand deals", "campaigns" and "payouts" deliberately — those
are the terms creators actually search.

### Full description — ~1,720/4,000

```
RGossips connects Indian brands with verified Instagram creators.

FOR CREATORS

• Find campaigns that fit — browse paid and barter collaborations filtered by your niche, location
  and follower range, with a match score that shows how well each brief suits your profile.
• Apply in a tap — your media kit, engagement rate and audience data are already attached.
• Track everything — application status, approved deliverables, and what you are owed, in one place.
• Get paid through escrow — brands fund the campaign up front. Money is released when your work is
  approved, so you are never chasing an invoice.
• Build a media kit that sells — your Instagram stats, past collaborations and rate card in a
  shareable public page.

FOR BRANDS

• Discover verified creators — search by niche, city, follower count and real engagement, not
  vanity metrics.
• Run campaigns end to end — brief, applications, approvals and deliverables in one dashboard.
• Escrow-backed payments — fund once, release on approval, with a full transaction record.
• Sell services — offer Reels, story takeovers and ambassadorships with a built-in quote flow.

WHY ESCROW MATTERS

Creator payment disputes are the single biggest complaint in influencer marketing. RGossips holds
campaign funds from the moment a brand commits, and releases them only when the deliverable is
approved. Brands know the work lands. Creators know the money is already there.

VERIFIED INSTAGRAM DATA

Creator profiles are backed by a real Instagram Business connection, so follower counts and
engagement rates come from Instagram itself rather than a self-reported number.

RGossips is operated by RUDE LABS PVT. LTD. Subscription plans are managed on rgossips.com.
```

### Graphics

| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 PNG, 32-bit, under 1 MB | Source in `android/app/src/main/res/mipmap-*` — needs a 512 export |
| Feature graphic | 1024×500 PNG or JPEG, no alpha | **Missing — required to publish** |
| Phone screenshots | 2 minimum, 8 max; 320–3840px; max 2:1 ratio | **Missing — required to publish** |
| Tablet screenshots | 7" and 10" | Optional |
| Promo video | YouTube URL | Optional |

Provide 6–8 phone screenshots, not the minimum of 2 — this app has two distinct audiences and the
listing has to sell both. Good candidates: the creator Home with the deal carousel, a campaign
detail with the match score visible, the apply flow, the media kit, the brand discover grid, and the
escrow/transactions screen.

The feature graphic is a banner, not a screenshot. Keep text away from the edges; it gets cropped on
some surfaces.

---

## Store settings

| Field | Value |
|---|---|
| App or game | App |
| Category | Business |
| Tags | Influencer marketing, Social networking, Marketplace (up to 5 from Play's fixed list) |
| Email address | info@rgossips.com |
| Website | https://rgossips.com |
| Phone | Optional, but a real number reduces review friction for a marketplace app |
| External marketing | Opt in |

Business fits better than Social. The app is a two-sided marketplace with contracts and payouts, and
Social invites a stricter read on user-generated content and moderation.

**The contact email becomes publicly visible on the listing.** `info@rgossips.com` is already the
public address in the site's structured data, so it is the consistent choice.
`grievance@rgossips.com` is the separate India grievance-officer address — do not put it here.

---

## App content declarations

These gate release — the app cannot be published with any of them outstanding.

### Privacy policy

**Required.** Already hosted: `https://rgossips.com/consent/privacy`

### Ads

**No, my app does not contain ads.** There is no ads SDK — the manifest declares only `INTERNET`
and `POST_NOTIFICATIONS`, and no `AD_ID` permission.

### App access

**All or some functionality is restricted.** Everything sits behind a login, so Play requires
working credentials or the review is rejected without the app ever being opened.

Provide a single instruction set named "Full access":

```
Login is by phone number and a one-time code.

1. Open the app and choose "Sign in".
2. Enter phone number: <REVIEW NUMBER>
3. Tap "Send OTP". No SMS or WhatsApp message is sent for this number.
4. Enter the code: <REVIEW CODE>

This account is pre-configured with a connected Instagram profile, so no
Instagram login is required at any point.
```

This depends on `REVIEW_TEST_PHONES` / `REVIEW_TEST_OTP` being set as Supabase secrets on the
`whatsapp-otp-sender` function. Without them the reviewer gets a real OTP sent to a phone they do
not have, and the submission fails.

The account must also hold a valid `instagram_access_token`. `InstagramRequiredGate` is mounted in
both `BrandLayout` and `InfluencerLayout`, and `AuthContext` flips `instagramTokenMissing` true when
a profile has an `instagram_handle` but no live token — which covers the whole screen with a
"connect Instagram" wall a reviewer cannot get past. The seeded QA creator account (`+919999999991`)
has exactly that defect; do not hand it to Play.

### Content rating

**Category question → "All other app types".** Not "Social or communication".

The questionnaire opens by asking the app's primary purpose. Social is for apps where communicating
*is* the product — its own examples are Facebook, Twitter, Skype and SMS. RGossips is a two-sided
marketplace; the nearest example in "All other app types" is "consumer stores", and Upwork and
Fiverr sit in that same bucket for the same reason. Picking Social puts the app on a stricter rating
track with social-app disclosures that do not describe it, and contradicts the Business store
category above.

This does not understate the chat: the questionnaire asks separately about user interaction and
user-generated content, and both are answered Yes below.

Then the **User content sharing** block:

| Question | Answer |
|---|---|
| Ratings-relevant content downloaded as part of the package | No |
| Users can interact or exchange content (voice, text, images, audio) | **Yes** — see below |
| Is shared UGC the primary source of content? | **Yes** |
| Permits public sharing of nudity | No |
| Permits public sharing of real-world graphic violence | No |
| Ability to **block** users or user-generated content | **Yes** — once shipped, see below |
| Ability to **report** users or user-generated content | **Yes** — once shipped, see below |
| Chat moderation | **No** — there is no chat to moderate |
| Interactions limitable to invited friends only | No |

**There is no chat system.** `BrandChats.tsx` and `InfluencerChats.tsx` make no backend calls and
render a hardcoded `CONTACTS` array — they are static mockups. `SupportChatModal` is real but talks
to RGossips support, not to another user, so it does not count as user-to-user interaction.

"Users can interact or exchange content = Yes" is nonetheless correct, on two backend-wired flows:

- **Pitches** — `ApplyCampaignForm` sends a mandatory free-text `pitch` from creator to brand.
- **Deliverables** — `SubmitDeliverablesModal` sends creator media to the brand.

Both are user-authored content delivered to another user, which is what the question asks about.

"Primary source of content = Yes" follows for the same reason: campaign briefs, profiles, media kits
and deliverables are all user-supplied and RGossips authors none of it. Answering No would be the
convenient reading, not the true one.

> **Separate open item.** The two mock chat screens are registered as routes in `App.tsx` (lines 148
> and 157), so they ship and a reviewer can reach a chat list of fake contacts. Play's minimum
> functionality policy treats non-functional placeholder features as grounds for rejection. Either
> finish them or remove the routes before submitting.

> **Answer Yes only once this is actually shipped.** Play's UGC policy and Apple Guideline 1.2
> require an in-app reporting system and an in-app blocking system. Both are now **written but not
> live**:
>
> - `migrations/059_content_reports_and_blocks.sql` — `content_reports`, `user_blocks`,
>   `blocked_user_ids()`. **Not yet applied.**
> - `report-content` and `block-user` edge functions. **Not yet deployed.**
> - Block filtering in `list-campaigns`, `list-influencers`, `list-brands` and
>   `list-featured-campaigns`. (`list-services` needs none — the `services` table is a platform
>   catalogue with no owner column.) **Not yet deployed.**
> - `ReportBlockSheet` in the app, wired into `InfluencerCard`. **Not in the signed AAB** — that
>   build predates this work.
>
> Two gaps remain before the Yes answers are truthful in spirit as well as letter: there is **no
> unblock UI**, so a user can block with no way to reverse it, and **no moderation queue** in the
> admin app, so reports are collected but never actioned. Both stores ask whether reports are acted
> on, not merely accepted.

**Online content → Yes.** Not No.

The question asks whether the app features content that is not part of the initial download.
Practically everything in RGossips is server-fetched — campaign listings are the direct analogue of
the question's own "product listings in the Amazon Shopping app" example — and the app also ships
AI-generated content, which the question names explicitly. There are ten generators behind
`AIToolsGrid` / `useAiTool` / the `ai-generate` function: caption, hashtags, hooks, script, pitch,
rate_card, media_kit, brief_checklist, compliance and match_coach. No is not defensible here.

Answering Yes opens a sub-questionnaire that re-asks the rating questions about the *online*
content. Note its scoping caveat: it covers content sellers create as part of the app catalogue —
campaign briefs and services — and explicitly **excludes** user-generated content such as comments
and reviews. Creator uploads and application pitches are therefore out of scope for these.

| Online content sub-question | Answer |
|---|---|
| Violence | No |
| Sexuality | No |
| Language | No |
| Controlled Substance | No |
| Promotion or sale of age-restricted products or activities | No |

All five are No because the catalogue is structurally constrained. Brand and campaign categories
come from a closed list of nine (`CATEGORY_OPTIONS` in `EditProfilePage.tsx`): Beauty & Skincare,
Fashion & Lifestyle, Food & Beverage, Health/Fitness & Wellness, Travel & Hospitality, Technology &
Gadgets, Education & Career, Gaming & Entertainment, Home & Decor. There is no alcohol, tobacco,
gambling or adult vertical, so a brand cannot file a brief under one.

> The two categories where a non-compliant brief could still slip through are **Food & Beverage**
> (an alcohol brand) and **Gaming & Entertainment** (a violent title, or real-money gaming — a live
> issue in India). The content policy should prohibit alcohol, tobacco and real-money-gaming
> campaigns explicitly. That is what keeps these five answers true over time rather than merely
> true today, and the policy is needed for the UGC requirement regardless.

**Miscellaneous:**

| Question | Answer |
|---|---|
| Shares the user's current and precise physical location with other users | No |
| Allows users to purchase digital goods | No — see below |
| Cash rewards, gift cards, play-to-earn, convertible crypto, transferable digital assets | No |
| Is a web browser or search engine | No |
| Primarily a news or educational product | No |

**Location** is a self-typed city on the profile, not device location — there is no location
permission in the manifest, so nothing precise exists to share.

**Digital goods = No, but know that an in-app payment flow exists.**
`InfluencerServiceOrderDetail.tsx` opens `RazorpayCheckout` for service orders, and
`react-native-razorpay` is a live dependency. Subscriptions moved to the web; service-order payment
did not. No is still correct — services are Reels, story takeovers and ambassadorships, i.e.
creator labour, which Play treats as real-world services rather than digital goods (the basis
Fiverr and Upwork operate on). Be ready to say so: a reviewer may reach an in-app Razorpay sheet
while this declaration reads "no purchases". Same grey zone as the Financial features note above.

**Rewards = No, but closer than it looks.** The referral programme issues "Reward Credits (RC),
redeemable on your next renewal", plus a welcome bonus. That is a non-transferable account discount
— not cash, not a gift card, not a transferable asset. Creator payouts are payment for work
delivered, not a reward feature. If RC ever becomes withdrawable as money, this answer flips to Yes.

Expect **Teen / PEGI 12** rather than Everyone, driven entirely by the interaction and UGC answers.

### Target audience and content

**Select 18 and over only.** Then: **No, my app is not appealing to children.**

Creators are entering commercial arrangements and receiving payouts; there is no legitimate under-18
audience. Selecting any band under 13 pulls the app into the Families policy, which brings
moderation and data-handling requirements this app is not built for.

### Account creation

**"Users can create an account"**, and tick exactly two:

- **Username and other authentication** — the phone number is the username and the WhatsApp OTP is
  the "other authentication". Play's own wording settles this: usernames include phone numbers, and
  authentication includes one-time passwords. Not plain "Other".
- **OAuth** — Instagram Business OAuth is a required step in onboarding.

Do **not** tick "Username and password". There is no password anywhere in the app.

**"Can users log in with accounts created outside of the app?" → Yes** (Instagram).

**"Do you provide a way for users to request that their data is deleted?" → Yes**, and a URL is
required.

> **Open item — required field, and there is a gap behind it.**
>
> **The URL does not exist.** `/consent` has only `brand`, `influencer`, `privacy` and `refund`.
> `/instagram/deletion-status` is Meta's requirement, not Play's. Create
> `https://rgossips.com/consent/delete-account`; Play requires the page to name the app/developer,
> give the request steps prominently, and state what is deleted, what is kept, and any retention
> period.
>
> **Deletion is deliberately sign-in-only, and that is compliant.** Play requires the *page* to be
> publicly readable, not the *action* to be unauthenticated — requiring sign-in to verify identity
> before deleting is explicitly permitted, and is the safer design (an unauthenticated request
> channel invites deletion requests against other people's accounts). What gets rejected is a URL
> that 404s, redirects to login, or hides the process behind auth. So the page must render for
> anyone and simply say: sign in → Profile → Delete Account.
>
> **Deletion is brand-only.** `BrandProfile` / `BrandAccountActionsModal` offer Delete Account
> (soft delete, 30-day grace, then permanent removal of account, campaigns, applications and
> contact details). Creators get **Deactivate only** — the app's own copy calls it reversible:
> "you can reactivate any time by signing back in". There is no `InfluencerAccountActionsModal` in
> the app and no deletion edge function. A reviewer signing in as a creator will find no way to
> delete the account.
>
> Because deletion is sign-in-only by design, the email fallback is off the table — which makes
> **building creator deletion a hard prerequisite**, not one of two options. A reviewer signing in
> as a creator would otherwise find no deletion path at all, which is exactly what this policy
> checks. Mirror the brand flow: same soft delete, same 30-day grace, same restore-on-request.

**Partial deletion (optional) → No.** Answer Yes only if a real request channel for deleting *some*
data without closing the account is actually operated. It is optional, and Yes creates an
obligation.

### Advertising ID

**No, the app does not use advertising ID.** No ads SDK, and no `AD_ID` permission in the manifest.
Verify against the built AAB before answering — a permission merged in by a transitive dependency
would make this answer false.

### Data safety

Answer **Yes**, the app collects and shares user data. This app collects considerably more than a
typical utility, and the declaration is long. Baseline:

| Data type | Collected | Shared | Purpose | Required or optional |
|---|---|---|---|---|
| Personal info → Name | Yes | No | App functionality, Account management | Required |
| Personal info → Email address | Yes | No | App functionality, Account management | Required |
| Personal info → Phone number | Yes | No | App functionality, Account management | Required |
| Personal info → Other info (bio, city, categories) | Yes | No | App functionality | Optional |
| Financial info → Payment info (UPI VPA, bank account, IFSC) | Yes | No | App functionality | Optional |
| Photos and videos → Photos | Yes | No | App functionality | Optional |
| Messages → Other in-app messages | Yes | No | App functionality | Optional |
| *(covers application pitches and support chat — there is no user-to-user chat)* | | | | |
| App activity → App interactions | Yes | No | Analytics, App functionality | Required |
| App info and performance → Crash logs, Diagnostics | Yes | No | Analytics | Required |

Supporting answers:

- **Encrypted in transit? Yes** — all traffic is HTTPS to Supabase, and the merged **release**
  manifest sets `android:usesCleartextTraffic="false"` (debug sets it true, which does not ship).
  Verified in `build/intermediates/merged_manifest/release/`. Note the iOS side still sets
  `NSAllowsArbitraryLoads`, which permits cleartext — answering the App Store's equivalent question
  the same way sits awkwardly with that, another reason to scope or drop the ATS exception.
- **Can users request deletion? Yes** — same URL as the App access section, and it must be the real
  account-deletion route.
- **Processed ephemerally? No** for every row. All of it is persisted server-side.

Notes on the rows most likely to be got wrong:

- **Payment info.** `PaymentMethods` collects a UPI VPA, or a bank account number plus IFSC, and
  stores them server-side through `register-payout-method`. That is financial information under
  Play's definitions even though the app takes no payment — payouts *to* the user still count.
- **Instagram data** (handle, follower count, engagement rate, media count) is collected. It has no
  dedicated Play category; declare it under Personal info → Other info and describe it explicitly in
  the privacy policy.
- **Shared = No throughout** is correct only if no third party receives this data as an independent
  controller. Supabase and Firebase act as processors, which is not "sharing" in Play's sense.
  Revisit this the moment an analytics or attribution SDK is added.

### Financial features

RGossips takes no payment in the app — subscriptions were deliberately moved to the web — but it
does hold campaign funds in escrow and pay creators out. Work through Play's list rather than
defaulting to "None of these"; the payout flow is the part that may map onto a listed feature.

> **Open item, and the one worth resolving first.** Play's Payments policy requires Play Billing for
> in-app digital subscriptions, and "Manage plan" opens `rgossips.com/influencer/pricing` in the
> browser. This is the Google-side mirror of the Apple 3.1.1 problem in the launch readiness notes.
> India's user-choice-billing position and the CCI ruling change the calculus, but not to "no rules
> apply". Decide the position and write it into the review notes before submitting, rather than
> after a rejection.

### Remaining declarations

| Question | Answer |
|---|---|
| Is your app a news app? | No |
| COVID-19 contact tracing or status | No |
| Government app | No |
| Health apps declaration | Not applicable — category is Business |

---

## Before you submit

- [ ] Feature graphic produced (1024×500)
- [ ] 6–8 phone screenshots captured from a release build
- [ ] `REVIEW_TEST_PHONES` and `REVIEW_TEST_OTP` set, and `whatsapp-otp-sender` deployed
- [ ] Review account signs in end to end on a real device, with no Instagram wall
- [x] `rgossips.com/consent/delete-account` page written — deploy the web app, then paste the URL
- [x] Creator account deletion built — `InfluencerAccountActionsModal`, reached from
      Profile → Privacy &amp; Security → Delete Account
- [ ] Migration `059` applied (`supabase db push`)
- [ ] `report-content`, `block-user` and the four edited `list-*` functions deployed
- [ ] Unblock UI added — blocking is currently one-way with no reversal
- [ ] Moderation queue in `rsgossips_admin` — reports are collected but never actioned
- [ ] **App rebuilt and re-signed** — the current AAB predates `ReportBlockSheet`
- [ ] Mock chat screens either finished or unrouted from `App.tsx` — they ship non-functional today
- [ ] Play Billing position decided and written into review notes
- [ ] `versionCode` bumped past `1`
- [ ] Release AAB uploaded, signature confirmed as `CN=RGossips` — not `CN=Android Debug`
- [ ] `AD_ID` permission confirmed absent from the built artifact
