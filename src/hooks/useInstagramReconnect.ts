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
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    try {
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(authUrl, INSTAGRAM_REDIRECT_URI, {
          ephemeralWebSession: true,
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        });
        if (result.type === 'success' && result.url) {
          const code = new URL(result.url).searchParams.get('code');
          if (code) await exchangeCode(code.replace('#_', ''));
        }
      }
    } catch (err: any) {
      setError(err?.message || errorOpen);
    }
  }, [exchangeCode, errorOpen]);

  return {connecting, error, reconnect};
}
