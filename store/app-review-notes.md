# App Review Information — answers for the Guideline 2.1 reply

The 2.1 rejection of the first submission was **not** a bug report: Apple asked for information
that was missing from the App Review Information section. Reply in App Store Connect with the seven
answers below, and paste the same text into **App Review Information → Notes** so future
submissions don't repeat the round trip.

Anything in «angle brackets» is a value only you can supply.

---

## Before you reply — four things to check

1. **The demo account must work.** Sign-in is a phone number plus a one-time code, and the reviewer
   has no access to the phone. `REVIEW_TEST_PHONES` / `REVIEW_TEST_OTP` must be set in Supabase so
   the code is accepted without an SMS or WhatsApp message being sent. Test this end-to-end on a
   real device from a clean install before replying. If a reviewer cannot sign in, nothing else in
   this document matters.
2. **`IAP_ALLOW_SANDBOX=true` must still be set on the backend.** Reviewers buy in the sandbox
   environment; with it off the server rejects their receipt and the subscription flow fails, which
   reads as a bug.
3. **Give the reviewer a creator account, not a brand account** — or give both. See the risk note
   at the end: the report/block mechanism is currently only on the brand side.
4. **Upload a build that includes the recent work.** iOS is at `MARKETING_VERSION 1.0`,
   `CURRENT_PROJECT_VERSION 18`. If build 18 has already been uploaded to TestFlight, bump to 19
   before archiving, or App Store Connect will refuse it.

---

## 1. Screen recording

Record on a **physical iPhone** running the current iOS, starting from launch. Apple names four
things that must appear if the app has them — this app has all four, so all four must be in the
recording.

Suggested single take, roughly 4–6 minutes:

| # | Show | Why Apple asked |
|---|---|---|
| 1 | Launch from the home screen (cold start) | Required opening shot |
| 2 | Sign in: phone number, OTP, creator dashboard | Registration / login flow |
| 3 | Home, Brands, Campaigns, Services tabs | Core features |
| 4 | Open a campaign, apply, submit the application | The app's central flow |
| 5 | Media kit: open it, edit top reels, publish | Creator-generated content |
| 6 | Photo permission prompt when picking a profile picture | Prompt for sensitive data |
| 7 | Profile, Plans: the subscription screen, prices, Terms and Privacy links | Paid content |
| 8 | Buy a subscription in the sandbox, then **Restore purchases** | Purchase + restore flow |
| 9 | A brand account: open a creator card, safety menu, Report, then Block | UGC reporting and blocking |
| 10 | Profile, Privacy & Security, Delete Account, through to confirmation | Account deletion |

The app never asks for location or contacts and does not use App Tracking Transparency, so nothing
more is needed for the "sensitive data" bullet than the photo/camera prompt.

## 2. Devices and OS tested

Only you can answer this truthfully. Fill in what was genuinely used, for example:

```
Tested before submission on:
- «iPhone 15 Pro, iOS 26.x» (physical device, TestFlight build «18»)
- «iPhone 11, iOS 26.x» (physical device)
- iPhone 16 Pro Max simulator, iOS 26.x (layout checks only)
```

Do not list a device the build was not actually run on.

## 3. What the app does and who it is for

```
RGossips is an influencer marketing marketplace for the Indian market.

Creators (Instagram content creators) use the app to find brand campaigns that
match their audience, apply to them with a pitch and their rate, submit the
content they produce, and track payment. They also maintain a media kit - a
shareable profile carrying their reach, engagement and best reels - which is
what brands review before shortlisting.

Brands use the app to publish campaign requests, search a directory of verified
creators, invite them, review applications, approve deliverables, and pay
creators through escrow.

The problem it solves: creator/brand deals in India are arranged ad hoc over
DMs, with no verified audience data, no agreed scope, and no payment guarantee.
RGossips gives both sides verified Instagram statistics, a written brief, and
escrow, so the creator knows the money exists before producing content and the
brand knows the content is delivered before it is released.

Audience: Instagram creators aged 18+, and the marketing teams of small and
mid-sized brands. It is not directed at children.
```

## 4. Setting up and accessing the main features

```
Sign-in is by phone number and a one-time code.

  1. Open the app and choose "Sign in".
  2. Enter phone number: «REVIEW NUMBER»
  3. Tap "Send OTP". No SMS or WhatsApp message is sent for this number.
  4. Enter the code: «REVIEW CODE»

CREATOR ACCOUNT (above) - pre-configured with a connected Instagram profile, so
no Instagram login is required at any point. From the dashboard:
  - Campaigns tab, open any campaign, "Apply for Campaign"
  - Profile, Media Kit, "Edit top reels" / "Publish"
  - Profile, Plans - subscription options and "Restore purchases"
  - Profile, Privacy & Security, Delete Account

BRAND ACCOUNT - phone «BRAND REVIEW NUMBER», code «REVIEW CODE».
  - Search tab, open a creator, safety menu, Report or Block
  - Campaigns tab, "Post Request" to publish a campaign
  - Profile, Delete Account

Subscriptions are Apple auto-renewable subscriptions and can be purchased in the
sandbox environment with the reviewer's sandbox Apple ID. No purchase is needed
to see the core flows; the free tier covers browsing and applying to barter
campaigns.
```

## 5. External services used

```
- Supabase - authentication, database, file storage and server functions. All
  app data is stored here.
- Meta WhatsApp Business Cloud API - delivers the one-time sign-in code.
- Instagram Graph API (Instagram Business Login) - with the creator's consent,
  reads their Instagram profile, follower count, recent posts and 30-day
  insights to build the media kit and verify audience claims to brands.
- Apple StoreKit (in-app purchase) - creator subscriptions (Starter, Pro,
  Elite). This is the only way to subscribe in the app.
- Razorpay - used ONLY by brands, to fund campaign escrow and pay for creator
  services. These purchase a real-world service performed by a person (a
  creator producing content), which is why they are not in-app purchases.
- Firebase Cloud Messaging - push notifications.
- Anthropic Claude API (OpenAI and Google Gemini are configurable
  alternatives) - optional AI writing assistance for captions, scripts,
  hashtags and pitch drafting. AI output is a draft the creator edits; it is
  never posted anywhere automatically.
```

## 6. Regional differences

```
The app is available in India only, and functions identically for every user
there. There are no region-gated features, no region-specific content, and no
behaviour that varies by location within India.

Availability is limited to India because the marketplace itself is: campaigns
are published by Indian brands, creators are Indian, and payouts are made in
Indian rupees to Indian bank accounts and UPI IDs. Subscription prices are set
through Apple's Indian pricing tier and display in rupees on the Indian
storefront.
```

Note for the reviewer, worth adding if they raise it: a reviewer using a
non-Indian sandbox Apple ID will see the subscription prices converted to their own storefront's
currency (for example US dollars). That is Apple's tier conversion, not a second price list — real
users on the Indian storefront see rupees.

## 7. Regulated industry / third-party material

```
RGossips does not operate in a regulated industry. It is a marketplace: it does
not hold funds as a licensed institution, and does not provide financial,
medical or legal services. Brand payments are processed by Razorpay, a licensed
Indian payment gateway, and creator subscriptions by Apple.

Instagram data is accessed only through Meta's official Instagram Graph API,
with each creator's explicit consent at connection time, under our approved Meta
app «APP ID». No content is scraped and no third-party copyrighted material is
redistributed. Creator photos, reels and campaign images belong to the creators
and brands who upload them.
```

Attach the Meta app-review approval for the Instagram permissions if you have it, and the Razorpay
merchant account confirmation. These are the "credentials" item 7 refers to.

---

## Risk: creators have no way to report or block

`ReportBlockSheet` is mounted in exactly one place - `src/components/brands/InfluencerCard.tsx`,
the creator card on the **brand** side. A brand can report or block a creator; a creator has no
report or block control anywhere, although they see brand-authored campaign briefs and brand
profiles.

Guideline 1.2 expects reporting and blocking wherever user-generated content is shown. If the
reviewer signs in with a creator account - which is the account the notes above lead with - and
looks for it, this is a plausible second rejection.

Two options, in order of preference:

1. **Add report/block to the creator side** (campaign detail and brand profile), reusing the
   existing `ReportBlockSheet` and the `block-user` edge function, which already exist. This is
   small work and removes the risk.
2. **Give the reviewer the brand account as the primary login** and say plainly in the notes where
   reporting lives, accepting that a creator-side reviewer may still ask.

## Risk: an undiagnosed crash

A crash was reported twice during Android testing and was never traced - the app has no crash
reporting installed (Firebase messaging is present; Crashlytics is not). Apple reviews on physical
devices and rejects under the same 2.1 for crashes.

Before resubmitting, either reproduce and fix it, or install Crashlytics so a crash on the
reviewer's device produces a stack trace you can act on instead of a rejection you have to guess at.
