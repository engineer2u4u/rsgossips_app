// Brand vs agency — admin-set label (RS_Gossips migration 075), returned by
// list-brands as `accountType` and by list-campaigns as `brandType`.
// Mirrors web src/components/FilterModal.jsx (matchesBrandType).

export type BrandAccountType = 'brand' | 'agency';

export const BRAND_ACCOUNT_TYPES: BrandAccountType[] = ['brand', 'agency'];

/** Missing / unknown values read as "brand" — the column default. */
export const toBrandAccountType = (v: unknown): BrandAccountType =>
  v === 'agency' ? 'agency' : 'brand';

/** Filter only when exactly one box is ticked; none or both = everyone. */
export const matchesBrandType = (
  brandTypes: BrandAccountType[],
  value: unknown,
): boolean =>
  brandTypes.length !== 1 || brandTypes[0] === toBrandAccountType(value);
