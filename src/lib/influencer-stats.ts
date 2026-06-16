// Stat helpers for the influencer dashboard + analytics surfaces.
//
// Web parity: src/components/DashboardView.jsx (ACTIVE_APP_STATUSES,
// parseBudgetINR, formatINRCompact, campaignStats useMemo) and
// src/components/AnalyticsPage.jsx (parseBudget, formatINR/Count,
// aggregates useMemo).
//
// Keep these helpers pure — the hook in `src/hooks/useInfluencerCampaigns.ts`
// is the only thing that talks to the network. Tests / previews can call
// computeInfluencerStats() with any list.

// Statuses that mean "this application is in flight, not finished, not
// rejected". Used for the Active Campaigns count + Expected Earnings.
export const ACTIVE_APP_STATUSES = new Set([
  'pending',
  'approved',
  'accepted',
  'submitted',
  'live_submitted',
  'revision_needed',
  'payment',
]);

// Parse a budget value coming back from list-campaigns. The edge function
// usually returns it pre-formatted as "₹25,000" but sometimes leaves a raw
// number — handle both.
export function parseBudgetINR(s: unknown): number {
  if (typeof s === 'number') return s;
  if (!s) return 0;
  const digits = String(s).replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

// 1,23,456 → "₹1.23L" (Indian-style large-number formatting).
export function formatINRCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '₹0';
  if (n >= 1_00_000) {
    return `₹${(n / 1_00_000).toFixed(n >= 10_00_000 ? 1 : 2)}L`;
  }
  return `₹${n.toLocaleString('en-IN')}`;
}

// Compact count formatter — for follower counts, reach etc.
export function formatCountCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 10_00_000) return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(2)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export type CampaignRow = {
  id?: string;
  title?: string;
  applicationStatus?: string;
  budget?: string | number;
  brandName?: string;
  brandLogo?: string;
  tags?: string[];
  endDate?: string;
  applicationDeadline?: string;
  deadline?: string;
  applicationMetrics?: {
    reach?: number;
    engagement?: number;
    views?: number;
    impressions?: number;
  };
};

export type InfluencerStats = {
  // Headline KPIs
  totalEarnings: number;
  expectedEarnings: number;
  earningsThisMonth: number;
  activeCount: number;
  completedCount: number;
  approvedCount: number;
  myCount: number;
  acceptRate: number;
  // Monthly buckets (last 6 months, oldest → newest)
  months: {key: string; label: string; value: number}[];
  // Percent change between the last two months — null when undefined.
  earningsTrend: number | null;
  // Top categories
  earningsByCategory: {name: string; count: number; total: number}[];
  // Unique completed brands sorted desc by count
  brands: {name: string; count: number; logo?: string}[];
  repeatBrandCount: number;
  // Last 4 of the user's own applications, sorted by end date desc
  recent: CampaignRow[];
};

const monthLabel = (d: Date) => d.toLocaleDateString('en-IN', {month: 'short'});

const sortableDate = (c: CampaignRow): number => {
  if (c.endDate) {
    const t = new Date(c.endDate).getTime();
    if (isFinite(t)) return t;
  }
  if (c.applicationDeadline) {
    const t = new Date(c.applicationDeadline).getTime();
    if (isFinite(t)) return t;
  }
  return 0;
};

export function computeInfluencerStats(campaigns: CampaignRow[]): InfluencerStats {
  // Only consider campaigns the user actually applied to.
  const my = campaigns.filter(c => !!c.applicationStatus);
  const completed = my.filter(c => c.applicationStatus === 'completed');
  const active = my.filter(c => ACTIVE_APP_STATUSES.has(c.applicationStatus!));
  // "Approved" superset — used to compute accept rate.
  const approved = my.filter(c =>
    ['approved', 'accepted', 'completed', 'submitted', 'payment'].includes(
      c.applicationStatus!,
    ),
  );

  const totalEarnings = completed.reduce(
    (s, c) => s + parseBudgetINR(c.budget),
    0,
  );
  const expectedEarnings = active.reduce(
    (s, c) => s + parseBudgetINR(c.budget),
    0,
  );

  // Earnings this calendar month (uses endDate, falls back to deadline).
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const earningsThisMonth = completed
    .filter(c => {
      const ref = c.endDate || c.applicationDeadline;
      if (!ref) return false;
      const d = new Date(ref);
      return isFinite(d.getTime()) && d >= thisMonthStart;
    })
    .reduce((s, c) => s + parseBudgetINR(c.budget), 0);

  // Last 6 months earnings buckets, oldest → newest.
  const months: {key: string; label: string; value: number}[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: monthLabel(d),
      value: 0,
    });
  }
  completed.forEach(c => {
    const ref = c.endDate || c.applicationDeadline;
    if (!ref) return;
    const d = new Date(ref);
    if (!isFinite(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find(x => x.key === key);
    if (m) m.value += parseBudgetINR(c.budget);
  });

  // Trend = last two months % change.
  const earningsTrend: number | null = (() => {
    if (months.length < 2) return null;
    const a = months[months.length - 2].value;
    const b = months[months.length - 1].value;
    if (a === 0) return b > 0 ? 100 : null;
    const pct = ((b - a) / a) * 100;
    return Number.isFinite(pct) ? Math.round(pct) : null;
  })();

  // Earnings by category — top 5.
  const catMap = new Map<string, {name: string; count: number; total: number}>();
  completed.forEach(c => {
    const cat = (c.tags && c.tags[0]) || 'Other';
    const cur = catMap.get(cat) || {name: cat, count: 0, total: 0};
    cur.count += 1;
    cur.total += parseBudgetINR(c.budget);
    catMap.set(cat, cur);
  });
  const earningsByCategory = [...catMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Brands worked with — unique by name, only from completed.
  const brandMap = new Map<
    string,
    {name: string; count: number; logo?: string}
  >();
  completed.forEach(c => {
    const name = c.brandName || 'Brand';
    const cur = brandMap.get(name) || {name, count: 0, logo: c.brandLogo};
    cur.count += 1;
    brandMap.set(name, cur);
  });
  const brands = [...brandMap.values()].sort((a, b) => b.count - a.count);
  const repeatBrandCount = brands.filter(b => b.count > 1).length;

  // Recent — last 4 of the user's own applications.
  const recent = [...my].sort((a, b) => sortableDate(b) - sortableDate(a)).slice(0, 4);

  const acceptRate = my.length > 0 ? Math.round((approved.length / my.length) * 100) : 0;

  return {
    totalEarnings,
    expectedEarnings,
    earningsThisMonth,
    activeCount: active.length,
    completedCount: completed.length,
    approvedCount: approved.length,
    myCount: my.length,
    acceptRate,
    months,
    earningsTrend,
    earningsByCategory,
    brands,
    repeatBrandCount,
    recent,
  };
}
