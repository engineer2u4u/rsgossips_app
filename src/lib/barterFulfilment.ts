// Where a barter application is in getting the product to the creator.
//
// Derived from the application row every time it is read — never stored,
// never polled, nothing scheduled. That is the whole design: "your parcel is
// overdue and you haven't told us" is a function of three timestamps, so the
// app works it out when the creator opens the screen and it can never be
// stale.
//
// Mirrors rsgossips_admin/src/lib/barter-fulfilment.ts and
// rgossips_web/src/lib/barterFulfilment.js. All three must agree — an admin
// seeing "shipped, 3 days overdue" while the creator's phone says "delivered"
// for the same row would be worse than showing nothing at all.
//
// Columns come from migration 076 on campaign_applications.

export const DEFAULT_SHIPPING_DAYS = 5;

export type ShippingMode = 'no' | 'yes' | 'pickup';

export type FulfilmentStage =
  | 'not_applicable'
  | 'awaiting_address'
  | 'ready_to_ship'
  | 'shipped'
  | 'received'
  | 'not_received';

export type FulfilmentRow = {
  status?: string | null;
  shipping_address?: string | null;
  shipping_tracking_url?: string | null;
  shipping_carrier?: string | null;
  shipping_tracking_added_at?: string | null;
  shipping_expected_at?: string | null;
  product_received?: boolean | null;
  product_received_at?: string | null;
  product_feedback?: string | null;
};

// Statuses where a product could be in flight. Dispatch happens from approval
// onward, not at completion: for most barter deals the creator physically
// needs the product in order to make the content.
const DISPATCHABLE = new Set([
  'approved',
  'submitted',
  'revision_needed',
  'accepted',
  'live_submitted',
  'payment',
  'completed',
]);

export function normalizeShippingMode(value: unknown): ShippingMode {
  return value === 'yes' || value === 'pickup' ? value : 'no';
}

export function fulfilmentState(
  row: FulfilmentRow | null | undefined,
  mode: ShippingMode,
  now: number = Date.now(),
) {
  const r = row || {};
  const dispatchable = DISPATCHABLE.has(r.status || '');
  const hasTracking = !!r.shipping_tracking_url;
  const hasAddress = !!(r.shipping_address && String(r.shipping_address).trim());

  let stage: FulfilmentStage;
  if (mode === 'no') {
    stage = 'not_applicable';
  } else if (r.product_received === true) {
    stage = 'received';
  } else if (r.product_received === false) {
    stage = 'not_received';
  } else if (hasTracking) {
    stage = 'shipped';
  } else if (mode === 'pickup' || hasAddress) {
    // Pickup never needs an address from the creator — the brand's pickup
    // address is on the campaign.
    stage = 'ready_to_ship';
  } else {
    stage = 'awaiting_address';
  }

  const expectedMs = r.shipping_expected_at ? new Date(r.shipping_expected_at).getTime() : null;
  const receiptOverdue = stage === 'shipped' && expectedMs !== null && expectedMs < now;
  const daysOverdue = receiptOverdue && expectedMs ? Math.floor((now - expectedMs) / 86400000) : 0;

  return {
    stage,
    mode,
    // Ask the creator for an address: we post it, they're in, we don't know where.
    needsAddress: mode === 'yes' && dispatchable && !hasAddress,
    // Matches the migration-076 trigger. Offering an edit the database will
    // reject is worse than not offering it.
    canEditAddress: mode === 'yes' && !hasTracking,
    // The creator can answer "did it arrive?" only once something is on its way.
    canConfirmReceipt: hasTracking && (r.product_received === null || r.product_received === undefined),
    // What the derived reminder keys off — no cron, no push, just this.
    receiptOverdue,
    daysOverdue,
    expectedAt: r.shipping_expected_at || null,
  };
}

// Labels for the creator's own view, written for the person waiting on the
// parcel rather than for an admin.
export const CREATOR_STAGE_LABEL: Record<FulfilmentStage, string> = {
  not_applicable: '',
  awaiting_address: 'Delivery address needed',
  ready_to_ship: 'Waiting to be dispatched',
  shipped: 'On its way',
  received: 'Delivered',
  not_received: 'Reported as not received',
};
