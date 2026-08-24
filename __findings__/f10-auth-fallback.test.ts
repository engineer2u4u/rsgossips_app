/**
 * F-10 — The client invocation helper falls back to a publishable-key bearer (S2)
 * TR-07 / A-43
 *
 * Strategy A-43: "Attaches an explicit authorisation header; never relies on the
 * publishable-key fallback for privileged calls."
 *
 * WHAT THE CODE ACTUALLY DOES, because the blunt reading of A-43 produces a
 * wrong test. `getAuthToken()` (src/lib/api.ts:47-63) deliberately races the
 * session read against a 3s timer and returns the anon key if the timer wins:
 *
 *     const fallback = new Promise(resolve =>
 *       setTimeout(() => resolve(SUPABASE_ANON_KEY), 3000));
 *     return Promise.race([sessionPromise, fallback]);
 *
 * That is intentional — a hung AsyncStorage read was leaving the
 * "Checking your number…" loader stuck forever, and an anon key at least
 * produces a real error instead of an infinite spinner. There is also a
 * mitigation at api.ts:131-140: a 401 received while using the fallback triggers
 * ONE retry with a fully-awaited session.
 *
 * So "never sends the anon key" is not the property to assert — the code
 * contradicts it on purpose, with a stated reason. The property that matters is
 * that the helper can TELL which calls are privileged, and today it cannot:
 * every function is treated identically, so a privileged call proceeding on the
 * anon key is indistinguishable from a public one.
 *
 * STATIC BY NECESSITY. The runtime half of this finding — drive invokeFn with a
 * mocked fetch and assert the retry — needs an RN test harness with native
 * module mocks (@react-native-async-storage/async-storage in particular). That
 * harness does not exist in this repo yet; see qa/blocked/TR-07.md in the web
 * repo. Source analysis proves the structural claim without it.
 *
 * FIX: an explicit list of functions that require a user session, checked before
 * the fallback is used, so a privileged call fails closed instead of being sent
 * with the publishable key.
 *
 * EXPECTED TO FAIL until then.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const API = join(__dirname, '..', 'src', 'lib', 'api.ts');

describe('F-10 / A-43 — privileged calls under the publishable-key fallback', () => {
  const src = readFileSync(API, 'utf8');

  it('the fallback to the publishable key is present (documents the finding)', () => {
    // Not a failure on its own — it is the deliberate design. Asserted so that
    // if the fallback is ever removed, this test tells us the finding changed
    // shape rather than silently passing for a new reason.
    const hasFallback = /Promise\.race\(\[[\s\S]{0,200}fallback/.test(src);
    expect(hasFallback).toBe(true);
  });

  it('the 401 retry mitigation is still in place', () => {
    // The mitigation is what makes the fallback survivable. If someone removes
    // it while the fallback stays, the finding gets materially worse.
    const hasRetry =
      /res\.status === 401[\s\S]{0,200}safeGetSession/.test(src) ||
      /401[\s\S]{0,300}doFetch\(session\.access_token\)/.test(src);
    expect({ retryOn401: hasRetry }).toEqual({ retryOn401: true });
  });

  it('the helper distinguishes privileged functions from public ones', () => {
    // THE OPEN HALF. api.ts treats every function identically: there is no list
    // of functions that require a user token, so nothing stops a privileged call
    // from going out on the anon key. A-43 asks for that distinction to exist.
    const hasPrivilegedList =
      /PRIVILEGED|REQUIRES_AUTH|requiresSession|AUTH_REQUIRED|needsSession/.test(src);
    expect({ privilegedFunctionList: hasPrivilegedList }).toEqual({
      privilegedFunctionList: true,
    });
  });
});
