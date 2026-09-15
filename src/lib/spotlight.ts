// Homepage spotlight — one of the three Elite discovery perks. Mirrors web
// src/lib/spotlight.js.
//
// The homepage creator carousels used to show only admin-curated rows, so
// buying Elite put nobody on the homepage. Live Elite creators now lead and
// the curated list follows. The Elite list comes from list-influencers
// ({eliteOnly: true}) because influencer_profiles is not client-readable and
// list-influencers already honours the Public Profile toggle and blocks.

import {invokeFn} from './api';

export type SpotlightRow = {
  influencer_id: string;
  full_name?: string;
  username?: string;
  instagram_handle?: string;
  profile_photo_url?: string;
  followers_count?: number;
  is_elite?: boolean;
};

export type SpotlightCard = {
  name: string;
  verified: boolean;
  elite?: boolean;
  image: string;
  followers: string;
  posts: string;
  following: string;
  bio: string;
  link: string;
  rating?: string;
};

export function formatFollowers(n?: number): string {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
}

/** Live Elite creators, best first. Never throws — the carousel keeps its curated list. */
export async function fetchEliteSpotlight(limit = 12): Promise<SpotlightRow[]> {
  try {
    const data = await invokeFn<{influencers?: SpotlightRow[]}>('list-influencers', {
      eliteOnly: true,
      limit,
    });
    return (data?.influencers || []).filter(r => r.is_elite);
  } catch {
    return [];
  }
}

export function spotlightCard(r: SpotlightRow): SpotlightCard {
  const handle = r.instagram_handle || r.username || '';
  return {
    name: handle || r.full_name || '',
    verified: true,
    elite: true,
    image: r.profile_photo_url || '',
    followers: formatFollowers(r.followers_count),
    posts: '',
    following: '',
    bio: r.full_name || '',
    link: handle ? `https://www.instagram.com/${handle}/` : '',
  };
}

/** Elite first, then the curated list, without showing anyone twice. */
export function mergeSpotlight<T extends {name: string}>(
  eliteRows: SpotlightRow[],
  curated: T[],
): Array<T | SpotlightCard> {
  const elite = eliteRows.map(spotlightCard).filter(c => c.name);
  const seen = new Set(elite.map(c => c.name.toLowerCase()));
  return [
    ...elite,
    ...curated.filter(c => !seen.has(String(c.name || '').toLowerCase())),
  ];
}
