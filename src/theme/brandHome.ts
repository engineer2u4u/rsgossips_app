// Design tokens for the redesigned brand Home feed.
//
// Ported from the "RGossips Explore — Android" design (Home feed): a navy +
// violet→blue language, distinct from the app's warm-pink brand gradient. Kept
// in one place so every Home section — hero, stat row, section headers, cards —
// reads as one system. Gradient arrays are ordered for react-native-linear-gradient
// (use with the matching `locations` where a design stop isn't evenly spaced).

export const HOME_BG = '#F4F6FB';

// Navy hero gradient (design: 120deg #16224E→#22376F 40%→#31508F 72%→#1B2B5C).
export const NAVY_GRADIENT = ['#16224E', '#22376F', '#31508F', '#1B2B5C'];
export const NAVY_LOCATIONS = [0, 0.4, 0.72, 1];

// Primary action gradient (design: 96deg #9B5FC4→#8460CB 26%→#6A66C9 58%→#4F79C6).
export const VIOLET_BLUE = ['#9B5FC4', '#8460CB', '#6A66C9', '#4F79C6'];
export const VIOLET_BLUE_LOCATIONS = [0, 0.26, 0.58, 1];

// Vertical accent bar beside section titles (design: 180deg).
export const ACCENT_BAR = ['#9B5FC4', '#6A66C9', '#4F79C6'];
export const ACCENT_BAR_LOCATIONS = [0, 0.55, 1];

// City-card footer band.
export const CITY_GRADIENT = ['#22376F', '#31508F', '#4667AE'];

// Soft violet chip tint (labels / "reason" pills).
export const CHIP_TINT = ['#F0E8F9', '#E7EBF8'];

export const HOME_COLORS = {
  ink: '#16224E', // primary text (navy)
  muted: '#6B7391', // secondary text
  faint: '#9AA4BE', // placeholder / meta
  cardBorder: '#E7EBF5',
  card: '#FFFFFF',
  violet: '#6A66C9', // link / accent text
  violetDeep: '#6A4FB8', // chip text
} as const;

// Diagonal linear-gradient start/end that reads as the design's 96°/120° angles
// (RN linear-gradient takes start/end points, not degrees).
export const ANGLE_96 = {start: {x: 0, y: 0.15}, end: {x: 1, y: 0.85}};
export const ANGLE_120 = {start: {x: 0, y: 0}, end: {x: 1, y: 1}};
export const ANGLE_180 = {start: {x: 0, y: 0}, end: {x: 0, y: 1}};
