// Brand profile helpers — validation + trust-band PRESENTATION only.
//
// The trust score itself is NOT computed here any more. There used to be four
// implementations of it (web dashboard, this app, list-brands, and a stray
// band ladder in BrandCard) and a brand could see three different numbers for
// itself while creators saw a fourth. The one implementation now lives in
// supabase/functions/_shared/brand-trust.ts; this app reads it through
// `brand-campaigns { action: "trustScore" }` (own dashboard) and the
// `trustScore` / `trustBand` fields list-brands puts on a brand row
// (creator-facing cards).
//
// What stays here: GST/PAN validation, and the band → colour/label mapping
// every trust surface needs to render what the server sent.

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidGstOrPan(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = String(value).toUpperCase().trim();
  return PAN_RE.test(v) || GSTIN_RE.test(v);
}

export type GstPanKind = 'empty' | 'pan' | 'gst' | 'unknown';

export function classifyGstPan(value: string | null | undefined): {
  kind: GstPanKind;
  valid: boolean;
} {
  if (!value) return {kind: 'empty', valid: false};
  const v = String(value).toUpperCase().trim();
  if (PAN_RE.test(v)) return {kind: 'pan', valid: true};
  if (GSTIN_RE.test(v)) return {kind: 'gst', valid: true};
  if (v.length === 10) return {kind: 'pan', valid: false};
  if (v.length === 15) return {kind: 'gst', valid: false};
  return {kind: 'unknown', valid: false};
}

/* ─────────── Trust band presentation ─────────── */

// Mirrors _shared/brand-trust.ts. The scale is 300–900 (CIBIL-style), NOT
// 0–1000, and the bands are deliberately non-punitive — the old
// Excellent/Very Good/Good/Fair/Poor ladder was retired in 2026-07.
export const TRUST_SCALE_MIN = 300;
export const TRUST_SCALE_MAX = 900;

export type TrustBandLabel =
  | 'Elite'
  | 'Trusted'
  | 'Established'
  | 'Emerging'
  | 'Building Trust';

const BAND_THRESHOLDS: Array<{min: number; label: TrustBandLabel}> = [
  {min: 800, label: 'Elite'},
  {min: 740, label: 'Trusted'},
  {min: 670, label: 'Established'},
  {min: 580, label: 'Emerging'},
  {min: 0, label: 'Building Trust'},
];

/**
 * Fallback ONLY. Every server surface (list-brands rows, the trustScore
 * action) already carries the band it computed — render that. This exists
 * because a brand row can arrive from an older cache or a stub path without
 * one, and a missing band should not blank the card.
 */
export function bandForScore(score: number): TrustBandLabel {
  for (const b of BAND_THRESHOLDS) if (score >= b.min) return b.label;
  return 'Building Trust';
}

export type TrustBandKey =
  | 'elite'
  | 'trusted'
  | 'established'
  | 'emerging'
  | 'buildingTrust';

const BAND_KEYS: Record<TrustBandLabel, TrustBandKey> = {
  Elite: 'elite',
  Trusted: 'trusted',
  Established: 'established',
  Emerging: 'emerging',
  'Building Trust': 'buildingTrust',
};

/**
 * Server band string → i18n key under the `TrustBands` namespace. Unknown
 * input (an older server, a hand-written row) falls back to buildingTrust
 * rather than rendering a raw English string.
 */
export function trustBandKey(band: string | null | undefined): TrustBandKey {
  return BAND_KEYS[(band || '') as TrustBandLabel] || 'buildingTrust';
}

export interface TrustBandColors {
  /** Solid accent — text, chip border, progress fill. */
  accent: string;
  /** Tinted background for a filled pill. */
  bg: string;
  /** Readable text colour on top of `bg`. */
  on: string;
}

// Same accents as the web BAND_RING map so the two apps agree visually.
export const TRUST_BAND_COLORS: Record<TrustBandKey, TrustBandColors> = {
  elite: {accent: '#10b981', bg: '#D1FAE5', on: '#065F46'},
  trusted: {accent: '#3b82f6', bg: '#DBEAFE', on: '#1E40AF'},
  established: {accent: '#6A66C9', bg: '#E8E7F8', on: '#3F3B96'},
  emerging: {accent: '#f59e0b', bg: '#FEF3C7', on: '#92400E'},
  buildingTrust: {accent: '#64748b', bg: '#E2E8F0', on: '#334155'},
};

export function trustBandColors(band: string | null | undefined): TrustBandColors {
  return TRUST_BAND_COLORS[trustBandKey(band)];
}
