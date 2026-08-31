# iOS — one Mac session, start to submitted

A working checklist for the session where iOS finally gets built. Written to be
worked top to bottom: the order avoids rework, because fixing signing rewrites
the entitlements file, and archiving before the SKU screenshot means archiving
twice.

Everything here needs macOS. Android is already published with working in-app
subscriptions; the backend, the SKUs and the entitlement model are shared, so
nothing server-side changes for iOS.

State verified against the repo before writing: all four blockers below are
still open.

---

## 0. Before you start

```bash
git clone <repo> && cd rsgossips_app && git checkout dev && git pull
npm install
```

Have ready:

- **Apple Team ID** — 10 characters, from developer.apple.com → Membership
- **App Store Connect access** for the RGossips app record
- A **Sandbox Tester** account — *Users and Access → Sandbox*. Your real Apple ID
  cannot make sandbox purchases; create one now, it takes a minute and blocks
  step 5 otherwise.

---

## 1. Fix the four blockers

Do all four before building. Three are one-line edits; the first is a dialog.

### 1a. Signing — Archive fails without it

`ios/RGossips.xcodeproj/project.pbxproj` currently has:

```
DEVELOPMENT_TEAM = "";
CODE_SIGN_STYLE = Manual;
```

Open `ios/RGossips.xcworkspace` → target **RGossips** → **Signing & Capabilities**:

- Tick **Automatically manage signing**
- Select your Team

Automatic is the simpler path — Xcode creates and maintains the profile. If you
have a reason to keep Manual, set the Team and attach a distribution profile for
`com.rgossips` yourself.

### 1b. Push entitlement — silently breaks notifications

`ios/RGossips/RGossips.entitlements`:

```xml
<key>aps-environment</key>
<string>development</string>   <!-- must become: production -->
```

TestFlight and App Store builds talk to the **production** APNs gateway. Left as
`development`, every push token a released build mints is invalid and
notifications simply never arrive — no error, nothing in logs.

Xcode usually rewrites this itself once the target uses a distribution profile,
so **check it after 1a rather than assuming**. If the Push Notifications
capability is missing from Signing & Capabilities, add it there.

### 1c. Register the `rgossips://` URL scheme

`ios/RGossips/Info.plist` registers only `com.rgossips`:

```xml
<key>CFBundleURLSchemes</key>
<array>
  <string>com.rgossips</string>
  <string>rgossips</string>      <!-- ADD THIS -->
</array>
```

`App.tsx` declares its linking prefix as `rgossips://`, and the website's "open
in app" button navigates to exactly that. Without the scheme, nothing on iOS
claims the URL, the fallback timer fires, and users land in the App Store
instead of the app they already have. Android registers both and works.

### 1d. Scope or remove the ATS exception

`ios/RGossips/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

This permits plaintext HTTP to any host. Reviewers ask for written
justification, and a blanket exception is the version they push back on. It also
contradicts the App Privacy answer "data encrypted in transit" — Android already
ships `usesCleartextTraffic="false"` in release.

If nothing needs cleartext, **delete the whole `NSAppTransportSecurity` dict**.
If something does, scope it to that host under `NSExceptionDomains`.

---

## 2. Build

```bash
cd ios
bundle install
bundle exec pod install
```

Use `bundle exec`. The Gemfile pins CocoaPods `>= 1.13` while excluding 1.15.0
and 1.15.1, which break the build; a system-wide `pod` may be one of those.

Then open **`ios/RGossips.xcworkspace`** — never the `.xcodeproj`, which omits
the pods.

This is also the first iOS build containing `react-native-iap` and
`react-native-nitro-modules`. If anything fails, it will most likely be there
rather than in app code.

---

## 3. Version, archive, upload

| Setting | Current | Action |
|---|---|---|
| `MARKETING_VERSION` | `1.0` | Keep — matches Android's `versionName` |
| `CURRENT_PROJECT_VERSION` | `14` | Bump if App Store Connect has seen it |

Select **Any iOS Device (arm64)** — Archive is disabled while a simulator is
selected — then *Product → Archive*, and from the Organizer
*Distribute App → App Store Connect → Upload*.

Check in the Organizer before uploading: bundle id reads `com.rgossips`, and
entitlements show `aps-environment: production`.

This upload is what creates the **app version** App Store Connect is waiting
for. Until it exists, subscriptions cannot be submitted at all — a new
subscription group must go with a version.

---

## 4. Sandbox purchase

On the device: **Settings → App Store → Sandbox Account**, sign in as your
sandbox tester. (Not the main Apple ID field — sandbox is separate.)

Run the app → Profile → **Plans**. Expect:

- Prices from the **store**, not `₹99` from `PLAN_PRICING`. A `—` means
  `fetchProducts` found nothing: check the six product ids match
  `IAP_SKUS` in `src/lib/iap.ts` exactly.
- Buy → the plan applies, and appears on `rgossips.com/influencer` too. That
  cross-platform check is the real proof: `verify-iap-purchase` writes
  `subscription_plan` and the web resolves it from the same field.

`IAP_ALLOW_SANDBOX=true` is already set on the backend. Do **not** turn it off —
Apple's reviewers purchase in sandbox, and the server would reject them.

---

## 5. The screenshot everything is waiting on

While the purchase sheet is on screen, capture it. Apple requires a **review
screenshot per subscription** showing the real purchase UI, and rejects mockups
or placeholders.

This is why the order matters: the screenshot needs a running build, and the
subscriptions cannot reach **Ready to Submit** without it.

---

## 6. Complete App Store Connect

**Subscriptions** — for each of the six, add localization (display name +
description), the review screenshot from step 5, and review notes. Each must
read **Ready to Submit**, not "Prepare for Submission". The group *RGossips
Plans* also needs its own localized display name.

**App Information**

| Field | Value |
|---|---|
| Privacy Policy URL | `https://rgossips.com/consent/privacy` — **currently empty, required** |
| Subtitle | `Brand campaigns for creators` |
| Content Rights | Contains third-party content |
| Age Rating | Questionnaire calculates **4+** → override to **18+** |

**Screenshots** — one set per required display size (6.9", 6.5"), captured from
a release build. Unlike Play, a single set is not accepted.

**App Review Information** — sign-in required, plus the two test accounts and
the fixed OTP. Add notes covering guidelines 1.2, 5.1.1(v), 3.1.1 and 3.1.5(a);
the wording is in `app-store-guide.md` §4d.

---

## 7. Submit

Attach the build, set Pricing (Free) and Availability (**India only** — the OTP
functions hardcode `91` + last 10 digits, so sign-up is impossible elsewhere),
then **Add for Review** with the subscriptions included.

---

## Immediately after the app record exists

Grab the numeric App Store ID and put it into `APP_STORE_URL` in
`rgossips_web/src/components/OpenInAppGate.jsx`, replacing the placeholder
`id0000000000`, then redeploy the web app. That dead link is live on the site
right now, and every iOS visitor who taps "Use mobile app" hits it.
