// Cache-busting helper for profile photos.
//
// React Native's <Image> caches by URL string, and Supabase Storage's CDN
// also caches aggressively. When a user uploads a new profile picture the
// backend overwrites the same key (e.g. profile-photos/{userId}.jpg), so
// the URL string doesn't change — and every avatar in the app keeps
// rendering the previously-cached image until the next cold start.
//
// Appending a ?v={updated_at} query param tied to the profile row's
// updated_at timestamp gives the new upload a unique URL string per save
// while leaving the underlying storage object untouched. iOS treats it as
// a brand-new resource and refetches.
//
// Usage:
//   const photoUrl = cacheBustedPhotoUrl(profile);
//   <Image source={{uri: photoUrl}} ... />

export function cacheBustedPhotoUrl(profile: any): string | undefined {
  const url: string | undefined = profile?.profile_photo_url;
  if (!url) return undefined;
  const v: string | number | undefined =
    profile?.updated_at ||
    profile?.photo_updated_at ||
    profile?.profile_photo_updated_at;
  if (!v) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(String(v))}`;
}

// Same idea but accepts an arbitrary URL + version key. Useful for
// non-profile images (e.g. media kit thumbnails) that follow the same
// overwrite-same-key pattern on Supabase Storage.
export function withCacheBuster(
  url: string | undefined,
  version: string | number | undefined,
): string | undefined {
  if (!url) return undefined;
  if (!version) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(String(version))}`;
}
