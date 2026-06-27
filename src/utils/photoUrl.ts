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

export function cacheBustedPhotoUrl(
  profile: any,
  extraVersion?: string | number,
): string | undefined {
  // Resolve in the same order media-kit/shared.ts does:
  //   1. custom_profile_photo_url — the manual upload field set by
  //      `upload-profile-photo` when the user picks a custom picture
  //   2. profile_photo_url — synced from Instagram on connect / refresh
  // Previously this helper only read profile_photo_url, which meant a
  // custom upload landed on the media-kit surface (which already used the
  // 2-field fallback) but every other avatar in the app kept showing the
  // Instagram CDN photo because that field never gets overwritten on a
  // custom upload.
  const url: string | undefined =
    profile?.custom_profile_photo_url ||
    profile?.customProfilePhotoUrl ||
    profile?.profile_photo_url ||
    profile?.profilePhotoUrl;
  if (!url) return undefined;
  const dbVersion: string | number | undefined =
    profile?.updated_at ||
    profile?.photo_updated_at ||
    profile?.profile_photo_updated_at;
  // Combine the DB timestamp with the client-side photoVersion counter from
  // AuthContext (passed as `extraVersion`). Either one changing busts the
  // RN/CDN image cache. The client counter is required because some upload
  // edge functions overwrite the storage object without bumping the row's
  // updated_at column.
  const v =
    dbVersion && extraVersion != null
      ? `${dbVersion}-${extraVersion}`
      : dbVersion ?? extraVersion;
  if (v == null) return url;
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

// Convenience hook — wraps cacheBustedPhotoUrl with the AuthContext
// photoVersion counter so consumers can just do:
//
//   const photo = useProfilePhoto();
//   <Image source={{uri: photo}} ... />
//
// without having to remember to pass photoVersion every time. Pass an
// optional profile arg when rendering a non-logged-in profile (e.g.
// influencer cards in a brand's view).
import {useAuth} from '../context/AuthContext';

export function useProfilePhoto(profileOverride?: any): string | undefined {
  const {profile, photoVersion} = useAuth();
  const target = profileOverride !== undefined ? profileOverride : profile;
  return cacheBustedPhotoUrl(target, photoVersion);
}
