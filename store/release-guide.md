# Publishing RGossips to production

Step-by-step for the release flow. Written for the **first** release; most of it applies unchanged
to later ones.

Unlike a standalone app, RGossips ships in three pieces that must go out in order: **Supabase
backend → web app → mobile build**. Shipping the app first means users hit edge functions that do
not exist yet.

---

## Before you start

These gate submission. Play will not let you past "Preview and confirm" without them.

- [ ] **Feature graphic** — 1024×500, no alpha. `store/graphics/feature-graphic-1024x500.png`
- [ ] **App icon** — 512×512 PNG. `store/graphics/play-store-icon-512.png`
- [ ] **Phone screenshots** — 2 minimum, 6–8 recommended, from a release build
- [ ] **Privacy policy URL** — already live at `https://rgossips.com/consent/privacy`
- [ ] **Delete account URL** — `https://rgossips.com/consent/delete-account`, live only once the
      web app is deployed (see Phase 2)

Still open in the code, all tracked in `listing.md`:

- [ ] Unblock UI — users can block with no way to reverse it
- [ ] Moderation queue in `rsgossips_admin` — reports are collected but never actioned
- [ ] Mock chat screens finished or unrouted from `App.tsx` — they ship non-functional today
- [ ] Play Billing position decided for the external subscription hand-off

And one that gates production access itself:

- [ ] **Check the account's production eligibility.** Personal developer accounts created after
      13 Nov 2023 must run a closed test with **12+ testers opted in for 14 continuous days**
      before the production track unlocks. If that applies you start at *Testing → Closed testing*,
      and everything below still applies — just to that track first.

---

## Phase 1 — Supabase backend

Run from `D:\Development\React\rgossips_web`. Project ref is `hlfevcdtbehukxrrgykv`.

```bash
npx supabase login
npx supabase link --project-ref hlfevcdtbehukxrrgykv
```

### 1a. Apply the migration

```bash
npx supabase db push
```

This applies `059_content_reports_and_blocks.sql` — the `content_reports` and `user_blocks` tables
plus the `blocked_user_ids()` helper. Read it before running; it has never been applied and is
therefore untested against the live schema.

### 1b. Deploy the functions

Six, and the order does not matter:

```bash
npx supabase functions deploy report-content
npx supabase functions deploy block-user
npx supabase functions deploy list-campaigns
npx supabase functions deploy list-influencers
npx supabase functions deploy list-brands
npx supabase functions deploy list-featured-campaigns
npx supabase functions deploy whatsapp-otp-sender
```

The four `list-*` functions gained block filtering; without them a block writes a row and changes
nothing a user sees. `list-services` is deliberately untouched — the `services` table is a platform
catalogue with no owner column, so there is nobody to block.

### 1c. Set the review-account secrets

Store review cannot receive a WhatsApp OTP. These designate a test account:

```bash
npx supabase secrets set REVIEW_TEST_PHONES=<review number>
npx supabase secrets set REVIEW_TEST_OTP=<a non-obvious code>
```

Secrets apply without a redeploy. **Clear `REVIEW_TEST_PHONES` once review passes** — any number
listed accepts a static code indefinitely.

The account must also hold a valid `instagram_access_token`, or `InstagramRequiredGate` will cover
the screen with a "connect Instagram" wall the reviewer cannot pass. Do not use the seeded QA
creator (`+919999999991`) — it has an `instagram_handle` with no token, which is exactly the
combination that triggers the gate.

---

## Phase 2 — Web app

The delete-account URL Play requires is a page in this repo. It 404s until deployed, and Play
validates that the URL resolves.

Deploy `rgossips_web` however you normally do, then confirm both:

- `https://rgossips.com/consent/delete-account` renders **without signing in**
- `https://rgossips.com/influencer/pricing?from=app` does **not** show the "use our mobile app" popup

---

## Phase 3 — Build the app

### 3a. Environment

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
```

`JAVA_HOME` is set machine-wide, but **a running VS Code holds a stale environment block and passes
it to every integrated terminal it spawns** — a new terminal is not enough, VS Code must be fully
restarted. Setting it inline avoids the question.

### 3b. Bump the version code

`android/app/build.gradle`:

```groovy
versionCode 1        // -> increment, every single upload
versionName "1.0"
```

Play permanently burns each integer. A rejected or superseded upload can never reuse its
`versionCode`.

### 3c. Build

```powershell
cd android
.\gradlew.bat assembleRelease bundleRelease
```

Note the `.\` — this machine sets `NoDefaultCurrentDirectoryInExePath=1`, so a bare `gradlew.bat`
will not resolve.

Outputs:

```
android/app/build/outputs/bundle/release/app-release.aab   <- upload this
android/app/build/outputs/apk/release/app-release.apk      <- sideload testing only
```

First build from clean takes ~45 minutes. Incremental is well under a minute.

### 3d. Verify the signature — do not skip this

If `android/keystore.properties` is missing, the Gradle config **silently falls back to the debug
keystore**. The build still succeeds and hands you an AAB that Play rejects. This has already
happened once on this project.

```powershell
& "C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot\bin\keytool.exe" `
  -printcert -jarfile android\app\build\outputs\bundle\release\app-release.aab
```

Expect:

```
Owner:  CN=RGossips, OU=Mobile, O=RGossips, L=Mumbai, ST=Maharashtra, C=IN
SHA1:   C8:87:DB:A0:01:97:48:FB:48:FF:7E:FC:FE:1E:0C:58:93:35:73:2C
SHA256: 0F:64:8D:52:BD:5B:D4:E5:DD:BD:DF:0F:42:32:F4:2E:E1:09:62:71:12:73:9B:D1:12:11:14:70:2F:7B:CA:5A
```

If it says `CN=Android Debug`, stop — `keystore.properties` is missing or unreadable. Fix it and
rebuild rather than uploading.

### 3e. Capture screenshots

Install the release APK on a device and capture from it, not from a debug build:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb exec-out screencap -p > store/graphics/screenshot-1.png
```

Good candidates: creator Home with the deal carousel, campaign detail with the match score visible,
the apply flow, the media kit, brand discover, the transactions screen.

---

## Phase 4 — Play Console

### 4a. Countries and regions

*Production → Countries / regions → Add countries / regions*

**India only.** This is a technical constraint, not a commercial one: both OTP edge functions
hardcode the country code (`91${digits.slice(-10)}`), so any non-Indian number normalises to a
nonsense Indian one and never receives a code. Sign-up is impossible outside India. Payouts agree —
`register-payout-method` validates NPCI VPAs and 11-character IFSC codes.

Releasing more widely ships an app those users cannot register for. Expanding later is freely
editable.

### 4b. App signing

Play App Signing is mandatory for new apps. Accept it.

Your `release.keystore` becomes the **upload key**. Google generates and holds the real **app
signing key** and re-signs every download with it. You never see that key and cannot lose it.

### 4c. Upload the bundle

Upload the **.aab**, not the .apk. Play rejects APKs for new apps.

### 4d. Release notes

Keep them short and user-facing:

```
First release of RGossips.

• Discover brand campaigns matched to your niche and audience
• Apply in a tap with your media kit attached
• Track applications, approvals and deliverables in one place
• Escrow-backed campaigns — funds committed before work starts
• Build a shareable media kit backed by verified Instagram data
```

### 4e. Preview and confirm, then submit for review

First reviews commonly take a few days. Expect longer than a returning app.

---

## After it is live

- [ ] Clear `REVIEW_TEST_PHONES` — the static-OTP account should not outlive review
- [ ] Paste the numeric App Store ID into `APP_STORE_URL` in `OpenInAppGate.jsx` when the iOS app
      record exists; it currently ships a placeholder `id0000000000`
- [ ] Register the upload cert SHA-1 in Firebase **only if** you add Google Sign-In, Phone Auth or
      Dynamic Links. FCM alone does not need it

---

## About your keystore

`android/app/release.keystore` plus its password is the only thing that can ever ship an update to
`com.rgossips`. Both it and `android/keystore.properties` are gitignored, so they exist in exactly
one place on disk.

**Back both up off this machine before the first upload.** After that upload the key is locked in —
losing it means a Play upload-key reset request, which is recoverable but slow.

The keystore was regenerated during setup, so it is not the same key as any earlier file of the same
name: `keytool` mints a fresh keypair each run even with identical alias, password and DN. If an
older `release.keystore` ever turns up, do not mix them — this is the one Play will know.

---

## Known local quirks

Three things about this machine that will otherwise waste an afternoon:

- **Norton intercepts TLS.** Its root CA is trusted by Windows but not by tools carrying their own
  truststore. Java sees `PKIX path building failed`; winget needs `--source winget` pinned. The
  Norton root has been imported into the JDK's `cacerts` as alias `norton-web-shield` — that fix is
  wiped by any JDK upgrade and must be reapplied.
- **`gradlew.bat` needs `.\`** — `NoDefaultCurrentDirectoryInExePath=1` is set.
- **Metro on port 8081** — if one is already running, `run-android` prompts interactively and, with
  no stdin, exits 0 without building. Pass `--no-packager` to reuse it.
