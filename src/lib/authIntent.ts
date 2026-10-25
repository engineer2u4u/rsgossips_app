// What a guest was trying to do when we asked them to sign in.
//
// Signing in REMOUNTS the navigator: RootStack goes guest stack → splash
// (`user && !role`) → authed stack. Every screen unmounts, component state
// dies and navigation state is discarded. So the thing we need on the other
// side cannot live in component state, in a context inside NavigationContainer,
// or in the guest stack's route params. It has to sit outside the React tree
// entirely — same reason src/lib/navigation.ts exists.
//
// Deliberately in memory and not AsyncStorage: an app the OS killed mid
// sign-in should not silently pop an apply form open two days later. If the
// Instagram OAuth round trip ever needs to survive a process restart, this is
// the one place to change.

export type AuthIntentAction = 'apply' | 'requestQuote' | 'myOrders';

export interface AuthIntent {
  /** Route name in the AUTHED stack to return to. */
  screen: string;
  params?: Record<string, any>;
  action: AuthIntentAction;
  /** Replay only for this role — a guest who gated "Apply" and then signed in
   *  as a brand must land on their own home with nothing reopened. */
  requiredRole?: 'influencer' | 'brand';
  ts: number;
}

/** Long enough to read a sign-up form, short enough that an abandoned prompt
 *  never replays onto an unrelated sign-in later in the session. */
const TTL_MS = 10 * 60 * 1000;

let intent: AuthIntent | null = null;

export function setAuthIntent(next: Omit<AuthIntent, 'ts'>): void {
  intent = {...next, ts: Date.now()};
}

/** Read without consuming — for deciding whether a replay is pending. */
export function peekAuthIntent(): AuthIntent | null {
  if (!intent) return null;
  if (Date.now() - intent.ts > TTL_MS) {
    intent = null;
    return null;
  }
  return intent;
}

/** Read and clear. Always clears, even when expired, so a stale intent cannot
 *  be read twice. */
export function takeAuthIntent(): AuthIntent | null {
  const current = peekAuthIntent();
  intent = null;
  return current;
}

export function clearAuthIntent(): void {
  intent = null;
}
