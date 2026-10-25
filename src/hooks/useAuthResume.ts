// Replays what a guest was doing, once sign-in has put the authed stack up.
//
// Mounted in RootStack, next to the push-registration and role-retry effects.
// It fires only when `user && role` — i.e. when the authed navigator is the
// branch actually being rendered — because navigating before it mounts would
// go nowhere.

import {useEffect, useRef} from 'react';

import {navigationRef} from '../lib/navigation';
import {takeAuthIntent, peekAuthIntent} from '../lib/authIntent';

/** navigationRef.isReady() is false for a tick or two after a stack swap.
 *  Same retry idiom the role check in App.tsx already uses. */
const RETRY_MS = 150;
const MAX_TRIES = 4;

export function useAuthResume(
  user: {id?: string} | null | undefined,
  role: string | null | undefined,
): void {
  // Guards against a second replay if this effect re-runs while the same
  // intent is still being delivered.
  const replaying = useRef(false);

  useEffect(() => {
    if (!user || !role) return;
    if (replaying.current) return;
    if (!peekAuthIntent()) return;

    replaying.current = true;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const attempt = () => {
      // Read it only once we can actually act on it, so a failed attempt
      // does not consume the intent.
      if (!navigationRef.isReady()) {
        if (++tries >= MAX_TRIES) {
          replaying.current = false;
          return;
        }
        timer = setTimeout(attempt, RETRY_MS);
        return;
      }

      const intent = takeAuthIntent();
      replaying.current = false;
      if (!intent) return;

      // Signed in as the wrong role for what they were doing. Drop it —
      // they are on their own home and nothing should reopen.
      if (intent.requiredRole && intent.requiredRole !== role) return;

      // Pushes on top of the authed stack's initial home, so a back swipe
      // from the resumed screen lands on that home rather than nowhere.
      (navigationRef.navigate as any)(intent.screen, {
        ...(intent.params || {}),
        resume: intent.action,
      });
    };

    attempt();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, role]);
}
