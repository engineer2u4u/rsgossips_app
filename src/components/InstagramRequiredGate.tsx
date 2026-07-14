import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Instagram } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useTranslation } from 'react-i18next';

import { supabase } from '../utils/supabase';
import { invokeFn } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  NEXT_PUBLIC_INSTAGRAM_APP_ID as INSTAGRAM_APP_ID,
  INSTAGRAM_REDIRECT_URI,
} from '@env';

// Full-screen, non-dismissable interstitial mounted by the layout when a
// logged-in user has no Instagram access token on their profile. Same
// OAuth flow as InstagramReconnectBanner but hard-gated — there is
// intentionally no skip / close button.
//
// `profile.instagram_connected` (from check-profile) is the truth signal.

export default function InstagramRequiredGate() {
  const { t } = useTranslation();
  const { user, profile, role, refreshProfile, refreshInstagram } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setError('');
    setConnecting(true);
    const appId = INSTAGRAM_APP_ID;
    const redirectUri = INSTAGRAM_REDIRECT_URI;
    const scope = 'instagram_business_basic,instagram_business_manage_insights';
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${encodeURIComponent(scope)}&response_type=code`;

    try {
      if (!(await InAppBrowser.isAvailable())) {
        throw new Error(t('InstagramRequiredGate.errorNoBrowser'));
      }
      const result = await InAppBrowser.openAuth(authUrl, redirectUri, {
        ephemeralWebSession: true,
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
      });

      if (result.type !== 'success' || !result.url) {
        setConnecting(false);
        return;
      }

      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      if (!code) {
        throw new Error(t('InstagramRequiredGate.errorNoCode'));
      }

      await exchangeCode(code.replace(/#_$/, ''));
    } catch (err: any) {
      setError(err?.message || t('InstagramRequiredGate.errorOpenFailed'));
      setConnecting(false);
    }
  };

  const exchangeCode = async (code: string) => {
    try {
      const { data, error: funcError } = await supabase.functions.invoke(
        'instagram-connect',
        { body: { code, redirectUri: INSTAGRAM_REDIRECT_URI } },
      );
      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      const table =
        role === 'brand' ? 'brand_profiles' : 'influencer_profiles';
      const updateBody: any = {
        userId: user.id,
        table,
        instagramAccessToken: data.accessToken,
        instagramTokenExpiresAt: data.tokenExpiresAt,
      };
      // Brands have no IG OAuth at sign-up today, so persist the
      // handle/logo from the OAuth result on first connect.
      if (role === 'brand' && data?.profile?.username) {
        updateBody.instagramUsername = data.profile.username;
        if (data.profile.profilePictureUrl) {
          updateBody.logoUrl = data.profile.profilePictureUrl;
        }
      }

      await invokeFn('update-profile', updateBody);

      // CRITICAL: refresh the cached profile so the gate's mount condition
      // (`profile.instagram_connected === false`) re-evaluates. We do this
      // BEFORE the optional IG-data backfill so the gate disappears even
      // if refresh-instagram has a transient failure.
      await refreshProfile();

      // Background IG-data backfill — best effort, swallow errors so
      // they don't leave the gate stuck if Meta rate-limits us right
      // after granting the token.
      if (role === 'influencer') {
        try {
          await refreshInstagram(user.id);
        } catch (_) {
          // non-fatal
        }
      }
    } catch (err: any) {
      setError(err?.message || t('InstagramRequiredGate.errorConnectFailed'));
    } finally {
      setConnecting(false);
    }
  };

  const headline =
    role === 'brand'
      ? t('InstagramRequiredGate.headlineBrand')
      : t('InstagramRequiredGate.headlineCreator');
  const subtitle =
    role === 'brand'
      ? t('InstagramRequiredGate.subtitleBrand')
      : t('InstagramRequiredGate.subtitleCreator');

  if (!profile) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      // onRequestClose for Android back-button — explicitly do nothing,
      // the gate is mandatory.
      onRequestClose={() => {}}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 15, 26, 0.92)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
        <View
          className="w-full bg-white"
          style={{
            maxWidth: 420,
            borderRadius: 28,
            padding: 28,
            gap: 16,
          }}>
          {/* Logo */}
          <View style={{ alignItems: 'center' }}>
            <LinearGradient
              colors={['#FCAF45', '#E1306C', '#833AB4']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Instagram size={32} color="white" />
            </LinearGradient>
          </View>

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text className="text-xl font-black text-slate-900 text-center">
              {headline}
            </Text>
            <Text className="text-sm text-slate-500 text-center leading-5">
              {subtitle}
            </Text>
          </View>

          <Pressable
            onPress={handleConnect}
            disabled={connecting}
            style={{ borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#FCAF45', '#E1306C', '#833AB4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: connecting ? 0.6 : 1,
              }}>
              {connecting ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white text-sm font-black">
                    {t('InstagramRequiredGate.connecting')}
                  </Text>
                </>
              ) : (
                <>
                  <Instagram size={18} color="white" />
                  <Text className="text-white text-sm font-black">
                    {t('InstagramRequiredGate.connectButton')}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {!!error && (
            <Text className="text-xs text-red-600 text-center">{error}</Text>
          )}

          <Text className="text-[11px] text-slate-400 text-center leading-4">
            {t('InstagramRequiredGate.disclaimer')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
