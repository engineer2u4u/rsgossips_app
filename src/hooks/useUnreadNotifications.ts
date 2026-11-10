// Unread notification count for a header badge.
//
// Extracted from InfluencerLayout's TopBar so the brand header can show the
// same thing. The brand bell used to render a hard-coded purple dot that was
// always on: it said "something is waiting" to a brand with an empty inbox,
// and said exactly the same thing to one with nine unread.
//
// Mirrors the web header — list via the `notifications` edge function and
// count the unread ones. Refreshed on a 30s tick and again on focus, so the
// badge clears as soon as the user comes back from the Notifications screen.

import {useCallback, useEffect, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {invokeFn} from '../lib/api';

const REFRESH_MS = 30000;

export function useUnreadNotifications(userId: string | undefined): number {
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await invokeFn<{notifications?: any[]}>('notifications', {
        action: 'list',
        userId,
      });
      setUnread((data?.notifications || []).filter((n: any) => !n.is_read).length);
    } catch {
      // Best-effort — leave the existing count rather than zeroing a badge
      // on one failed poll.
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    const tick = () => {
      if (!cancelled) fetchUnread();
    };
    tick();
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId, fetchUnread]);

  useFocusEffect(
    useCallback(() => {
      fetchUnread();
    }, [fetchUnread]),
  );

  return unread;
}
