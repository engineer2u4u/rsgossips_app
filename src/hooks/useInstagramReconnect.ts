import {useCallback, useState} from 'react';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import {supabase} from '../utils/supabase';
import {invokeFn} from '../lib/api';
import {useAuth} from '../context/AuthContext';
import {
  NEXT_PUBLIC_INSTAGRAM_APP_ID as INSTAGRAM_APP_ID,
  INSTAGRAM_REDIRECT_URI,
} from '@env';

// Codes already exchanged in this app session — the reconnect banner and the
// reconnect popup can both be mounted; a replayed code fails at Instagram.
const exchangedCodes = new Set<string>();

/**
 * Instagram re-authorisation shared by InstagramReconnectBanner and
 * InstagramReconnectModal: in-app OAuth, exchange the code, save the new
 * token, refresh analytics and the profile.
 */
export function useInstagramReconnect(opts: {
  userId?: string;
  errorReconnect: string;
  errorOpen: string;
  onReconnected?: () => void;
}) {
  const {setInstagramTokenMissing, refreshInstagram, refreshProfile} = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const {userId, errorReconnect, errorOpen, onReconnected} = opts;

  const exchangeCode = useCallback(
    async (code: string) => {
      if (exchangedCodes.has(code) || !userId) return;
      exchangedCodes.add(code);
      setConnecting(true);
      setError('');
      try {
        const {data, error: funcError} = await supabase.functions.invoke(
          'instagram-connect',
          {body: {code, redirectUri: INSTAGRAM_REDIRECT_URI}},
        );
        if (funcError) throw new Error(funcError.message);
        if (data?.error) throw new Error(data.error);

        await invokeFn('update-profile', {
          userId,
          table: 'influencer_profiles',
          instagramAccessToken: data.accessToken,
          instagramTokenExpiresAt: data.tokenExpiresAt,
        });

        setInstagramTokenMissing(false);
        // A successful refresh clears instagram_token_invalid_at and
        // instagram_insights_denied_at; reloading the profile makes every
        // "expired" check see the new expiry. Forced: refresh-instagram
        // otherwise skips anything refreshed in the last hour, leaving the
        // banner up after a reconnect that worked.
        await refreshInstagram(userId, {force: true});
        await refreshProfile();
        onReconnected?.();
      } catch (err: any) {
        setError(err?.message || errorReconnect);
      } finally {
        setConnecting(false);
      }
    },
    [userId, errorReconnect, onReconnected, setInstagramTokenMissing, refreshInstagram, refreshProfile],
  );

  const reconnect = useCallback(async () => {
    setError('');
    const scope = 'instagram_business_basic,instagram_business_manage_insights';
    // state=app tells the web callback page this came from the mobile app, so
    // it bounces the code on to the rgossips:// scheme instead of trying to
    // talk to a window.opener that does not exist here.
    const authUrl =
      `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scope)}&response_type=code&state=app`;

    // The browser is told to watch for the custom scheme, not the https
    // redirect Instagram is registered against. Neither platform can finish
    // on the https URL:
    //
    //  - iOS uses ASWebAuthenticationSession, which matches its callback by
    //    URL SCHEME alone. Handed an https:// URL it has nothing to match,
    //    so the session never completes — Instagram authorises, the page
    //    loads, and the user is stranded in a browser with no way back.
    //  - Android is the same story for a different reason: Chrome Custom
    //    Tabs will not intercept an https redirect without App Links, and
    //    this app has none (no android:host, no autoVerify, no
    //    assetlinks.json). The AndroidManifest already says exactly this,
    //    next to the Stripe deep link, which solves it the same way.
    //
    // So the registered redirect stays https, its page bounces the code to
    // rgossips://instagram-callback (state=app), and both platforms match on
    // the scheme they can actually see.
    const callbackUrl = 'rgossips://instagram-callback';

    try {
      if (!(await InAppBrowser.isAvailable())) {
        // Used to fall through in silence, so the button simply did nothing.
        setError(errorOpen);
        return;
      }
      const result = await InAppBrowser.openAuth(authUrl, callbackUrl, {
        ephemeralWebSession: true,
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
      });
      if (result.type === 'success' && result.url) {
        // Read the code with a regex rather than new URL(): RN's URL does not
        // expose searchParams reliably for a non-http scheme, and the iOS
        // callback now arrives as rgossips://…
        const match = /[?&]code=([^&#]+)/.exec(result.url);
        const code = match ? decodeURIComponent(match[1]) : null;
        if (code) {
          await exchangeCode(code.replace('#_', ''));
        } else {
          const errMatch = /[?&]error(?:_description)?=([^&#]+)/.exec(result.url);
          if (errMatch) {
            setError(decodeURIComponent(errMatch[1]).replace(/\+/g, ' '));
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || errorOpen);
    }
  }, [exchangeCode, errorOpen]);

  return {connecting, error, reconnect};
}
