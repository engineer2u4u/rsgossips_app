// instagram-url: dumb, robust parser for the URLs influencers paste when
// submitting deliverables. Ported from web app src/utils/instagram-url.js —
// keep in sync.
//
// We use it for two things:
//   1. Show the user what kind of link they pasted ("Reel detected") so the
//      mismatch with a "Story" deliverable is obvious before submit.
//   2. Normalise URLs for the duplicate check so https://www.instagram.com/reel/Cxyz/
//      and instagram.com/reel/Cxyz match.

export type LinkType =
  | 'reel'
  | 'post'
  | 'story'
  | 'igtv'
  | 'tv'
  | 'unknown';

export function detectInstagramLinkType(raw: string | null | undefined): LinkType {
  if (!raw) return 'unknown';
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return 'unknown';
  }
  const host = url.hostname.toLowerCase();
  if (!host.includes('instagram.com')) return 'unknown';
  const path = url.pathname.toLowerCase();
  if (path.includes('/reel/') || path.includes('/reels/')) return 'reel';
  if (path.includes('/stories/')) return 'story';
  if (path.includes('/tv/')) return 'igtv';
  if (path.includes('/p/')) return 'post';
  return 'unknown';
}

export function labelForLinkType(type: LinkType): string {
  switch (type) {
    case 'reel':
      return 'Reel';
    case 'post':
      return 'Post';
    case 'story':
      return 'Story';
    case 'igtv':
    case 'tv':
      return 'IGTV';
    default:
      return 'Link';
  }
}

// Returns the type the deliverable name implies. Deliverable types come
// through as e.g. "reels", "stories", "posts", "carousel", "igtv".
export function expectedLinkType(
  deliverableType: string | null | undefined,
): LinkType | null {
  if (!deliverableType) return null;
  const t = deliverableType.toLowerCase();
  if (t.startsWith('reel')) return 'reel';
  if (t.startsWith('stor')) return 'story';
  if (t.startsWith('post') || t.startsWith('carousel') || t.startsWith('static'))
    return 'post';
  if (t === 'igtv' || t === 'tv') return 'igtv';
  return null;
}
// URL identity lives in ONE module, mirrored from the web repo's
// supabase/functions/_shared/submission-url.js and pinned by the shared
// vectors both repos test against. It used to be written out separately here,
// in the web form and in submit-deliverables, and all three drifted into the
// same bug: dropping the query, which made every Google Drive link in a
// submission look like the same file.
//
// `normaliseInstagramUrl` keeps its old name because that is what the
// deliverables modal imports; it normalises ANY submission link, which is why
// `isInstagramUrl` is separate.
export {
  isInstagramUrl,
  normaliseSubmissionUrl,
  normaliseSubmissionUrl as normaliseInstagramUrl,
} from './submission-url';
