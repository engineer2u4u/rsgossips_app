// Is this creator's Instagram token dead? Mirrors web src/lib/instagramToken.js.
//
// Either signal is enough:
//   * instagram_token_invalid_at — refresh-instagram got OAuth error 190
//     (password change, revoked access, expiry).
//   * instagram_token_expires_at in the past — verified 2026-09-16 that every
//     row with a past expiry was also rejected by Instagram.
export function isInstagramTokenExpired(profile: any): boolean {
  if (!profile?.instagram_connected) return false;
  if (profile.instagram_token_invalid_at) return true;
  const raw = profile.instagram_token_expires_at;
  if (!raw) return false;
  const at = Date.parse(raw);
  return Number.isFinite(at) && at < Date.now();
}

// Connected, token fine, but the creator switched off the insights permission
// when connecting — so reach/views can never load until they reconnect with it
// on. Set by refresh-instagram (migration 073), cleared by a refresh that gets
// insights. Only meaningful when the token itself is healthy.
export function isInstagramInsightsNotGranted(profile: any): boolean {
  if (!profile?.instagram_connected) return false;
  return !!profile.instagram_insights_denied_at && !isInstagramTokenExpired(profile);
}
