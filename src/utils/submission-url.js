// MIRROR of rgossips_web/supabase/functions/_shared/submission-url.js.
// React Native cannot import across repos, so this is a copy — kept honest by
// submission-url.vectors.json, which both repos test against. Change one and
// the other repo fails until it is updated.
//
/** Params that identify a sharer or a session, never the file itself. */
export const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "igsh",
  "igshid",
  "si",
  "usp",
  "sharing",
]);

/**
 * Is this an Instagram link?
 *
 * Its own function because `normaliseSubmissionUrl` does NOT answer this —
 * it normalises anything it is handed, so truthiness-testing the result says
 * "yes" for a Google Drive link. That mistake put the "Instagram links aren't
 * needed for drafts" hint under every pasted link.
 */
export function isInstagramUrl(raw) {
  if (!raw) return false;
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return host === "instagram.com" || host.endsWith(".instagram.com") || host === "instagr.am";
}

/**
 * A comparison key: two links with the same key are the same submission.
 *
 * Instagram keeps host + path only. Everything else keeps the query too,
 * minus tracking params and order-independent, because that is where a
 * draft file's identity lives.
 */
export function normaliseSubmissionUrl(raw) {
  if (!raw) return "";
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    // Not a URL at all — compare the raw text so two identical pastes still
    // match, rather than silently counting as unique.
    return String(raw).trim().toLowerCase();
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  // Stripping a trailing slash makes /reel/X and /reel/X/ identical.
  const path = url.pathname.replace(/\/+$/, "").toLowerCase();
  const base = `${host}${path}`;

  if (isInstagramUrl(raw)) return base;

  const params = [...url.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.has(k.toLowerCase()))
    // Sorted so ?a=1&b=2 matches ?b=2&a=1. Values keep their case: a Drive
    // id is case-sensitive.
    .map(([k, v]) => [k.toLowerCase(), v])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  const query = params.map(([k, v]) => `${k}=${v}`).join("&");
  return query ? `${base}?${query}` : base;
}
