// Languages an influencer creates content in. Surfaced as a multi-select on
// the influencer profile edit (EditProfilePage) and the brand-side search
// FilterDrawer ("Content Language" group); stored in
// influencer_profiles.content_languages (text[]). Language names are proper
// nouns and are NOT translated (same rule as city names). Mirrors the web's
// src/utils/contentLanguages.js — keep the two lists in sync.
export const CONTENT_LANGUAGES: string[] = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Punjabi',
  'Odia',
  'Urdu',
  'Bhojpuri',
  'Assamese',
  'Haryanvi',
  'Rajasthani',
  'Tulu',
  'Konkani',
  'Maithili',
  'Chhattisgarhi',
  'Awadhi',
  'Magahi',
  'Nepali',
  'Manipuri',
  'Bodo',
  'Dogri',
  'Kashmiri',
  'Sanskrit',
  'Santali',
  'Sindhi',
];
