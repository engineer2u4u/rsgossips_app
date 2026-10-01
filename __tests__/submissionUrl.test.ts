/**
 * Deliverable-link identity, held to the SAME vectors as the web repo.
 *
 * src/utils/submission-url.js is a mirror of
 * rgossips_web/supabase/functions/_shared/submission-url.js — React Native
 * cannot import across repos. These vectors are the contract: change the
 * rules in one repo without mirroring them here and this fails.
 *
 * The bug behind it: the key was host + path with the query dropped. Right
 * for Instagram, where the media id is in the path. Wrong for a draft link,
 * where a Drive file IS its query — so every Drive link in a submission
 * collapsed to "drive.google.com/open" and distinct files read as duplicates.
 */
import {isInstagramUrl, normaliseInstagramUrl} from '../src/utils/instagram-url';
import vectors from '../src/utils/submission-url.vectors.json';

const key = (u: string) => normaliseInstagramUrl(u);

describe('submission URL identity', () => {
  it.each(vectors.sameLink.map(v => [v.why, v.a, v.b]))(
    'same link — %s',
    (_why, a, b) => {
      expect(key(a as string)).toBe(key(b as string));
    },
  );

  it.each(vectors.differentLinks.map(v => [v.why, v.a, v.b]))(
    'different links — %s',
    (_why, a, b) => {
      expect(key(a as string)).not.toBe(key(b as string));
    },
  );

  it.each(vectors.isInstagram.map(v => [v.url, v.expected]))(
    'isInstagramUrl(%s) === %s',
    (url, expected) => {
      expect(isInstagramUrl(url as string)).toBe(expected);
    },
  );
});
