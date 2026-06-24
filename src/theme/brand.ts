// Brand palette — sampled from the recentgossips logo.
// coral → pink → magenta → purple → blue, with magenta as the live accent.
// Mirrors the design system shipped in the Mobile (offline) prototype.

export const BRAND = {
  coral: '#f5907f',
  pink: '#e88398',
  magenta: '#c95fa2',
  purple: '#8b64ba',
  violet: '#6a64c0',
  blue: '#5e6fc0',
  accent: '#d2418f', // key brand pop — primary action / active tab
  green: '#16a34a',
  amber: '#f59e0b',
} as const;

// Full logo gradient (left → right, matches the wordmark).
export const BRAND_GRADIENT: readonly [string, string, string, string, string] = [
  '#f5907f',
  '#e07f9a',
  '#c95fa2',
  '#8b64ba',
  '#5e6fc0',
];

// Two-stop variant — useful for compact gradients (buttons, badges) where
// a 5-stop spectrum would just read as muddy purple at small sizes.
export const BRAND_GRADIENT_2: readonly [string, string] = ['#c95fa2', '#5e6fc0'];

// Same two-stop but warm side — primary action buttons read more vibrant
// than the cool-side 2-stop above.
export const BRAND_GRADIENT_WARM: readonly [string, string] = ['#f5907f', '#c95fa2'];

// Soft tinted gradient used behind the "N brands are looking…" row inside
// the greeting card. Coral → magenta → violet, each at ~12-14% alpha so the
// stop colours bleed into the surface rather than dominate it.
export const BRAND_GRADIENT_SOFT: readonly [string, string, string] = [
  'rgba(245,144,127,0.14)',
  'rgba(201,95,162,0.12)',
  'rgba(106,100,192,0.13)',
];

// Page-level surface colours — soft lavender so the white cards have something
// to push against. Matches `--bg` / `--bg-grad` in the offline prototype.
export const BG = {
  page: '#f5f4f8',
  pageGrad: '#efedf5',
} as const;

// Reusable soft card shadow — neutral black drop so home / campaign /
// brand / service cards lift off the page consistently. Spread the same
// style across every list/home card for unified depth.
export const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.18,
  shadowRadius: 16,
  shadowOffset: {width: 0, height: 8},
  elevation: 6,
} as const;
