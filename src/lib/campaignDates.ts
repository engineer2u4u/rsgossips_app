// Mirror of the web repo's src/lib/campaignDates.js and of
// supabase/functions/_shared/campaign-dates.ts. React Native cannot import
// across repos, so keep the three in step.
//
// An application deadline is a DAY, not an instant. The column stores
// midnight ("2026-10-14T00:00:00"), so a raw
//
//     new Date(deadline).getTime() < Date.now()
//
// marks a campaign closed from 00:00:01 on the morning of its own deadline.
// That shipped in four places — the brand campaign card and detail page on
// web, and BrandCampaigns / BrandCampaignDetail here — so a brand who
// created a campaign today, published it and had it approved saw
// "Applications Closed" on it minutes later.
//
// The calendar date is read out of the STRING rather than via `new Date()`
// plus a setter: these values carry no timezone, so `new Date()` resolves
// them in the device's zone and a phone east of Greenwich lands a day out.
//
// "End of day" is 23:59:59.999 UTC (05:29 IST the next morning) —
// deliberately the generous direction, matching the server.

export function endOfDayMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (ymd) {
    return Date.UTC(
      Number(ymd[1]),
      Number(ymd[2]) - 1,
      Number(ymd[3]),
      23,
      59,
      59,
      999,
    );
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    23,
    59,
    59,
    999,
  );
}

/** True once the application window has shut. No deadline never shuts. */
export function applicationDeadlinePassed(
  applicationDeadline: string | null | undefined,
  now: number = Date.now(),
): boolean {
  const end = endOfDayMs(applicationDeadline);
  return end !== null && end < now;
}

/** True once the campaign is over — end date, falling back to the deadline. */
export function campaignEnded(
  campaignEndDate: string | null | undefined,
  applicationDeadline: string | null | undefined,
  now: number = Date.now(),
): boolean {
  const end = endOfDayMs(campaignEndDate || applicationDeadline);
  return end !== null && end < now;
}
