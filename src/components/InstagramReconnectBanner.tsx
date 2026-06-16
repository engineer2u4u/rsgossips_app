import React, {useState} from 'react';
import {View, Text, Pressable, ActivityIndicator} from 'react-native';
import {Instagram, AlertTriangle, X} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import {supabase} from '../utils/supabase';
import {invokeFn} from '../lib/api';
import {
  NEXT_PUBLIC_INSTAGRAM_APP_ID as INSTAGRAM_APP_ID,
  INSTAGRAM_REDIRECT_URI,
} from '@env';

interface Props {
  userId?: string;
  instagramTokenMissing?: boolean;
  onReconnected?: () => void;
}

export default function InstagramReconnectBanner({
  userId,
  instagramTokenMissing = false,
  onReconnected,
}: Props) {
  const [connecting, setConnecting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState('');

  const exchangeCode = async (code: string) => {
    setConnecting(true);
    setError('');
    try {
      const redirectUri = INSTAGRAM_REDIRECT_URI;
      const {data, error: funcError} = await supabase.functions.invoke(
        'instagram-connect',
        {body: {code, redirectUri}},
      );

      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      // Save the token to the profile
      await invokeFn('update-profile', {
        userId,
        table: 'influencer_profiles',
        instagramAccessToken: data.accessToken,
        instagramTokenExpiresAt: data.tokenExpiresAt,
      });

      onReconnected?.();
    } catch (err: any) {
      setError(err.message || 'Failed to reconnect Instagram');
    } finally {
      setConnecting(false);
    }
  };

  const handleReconnect = async () => {
    setError('');
    const appId = INSTAGRAM_APP_ID;
    const redirectUri = INSTAGRAM_REDIRECT_URI;
    const scope =
      'instagram_business_basic,instagram_business_manage_insights';

    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;

    try {
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(authUrl, redirectUri, {
          ephemeralWebSession: true,
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        });

        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          if (code) {
            await exchangeCode(code.replace('#_', ''));
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open Instagram');
    }
  };

  if (!instagramTokenMissing || dismissed) return null;

  return (
    <View className="mx-5 mb-4">
      <View
        className="relative flex-row items-center p-4 rounded-2xl border border-amber-200"
        style={{backgroundColor: '#FFFBEB', gap: 12}}>
        {/* Instagram Icon */}
        <LinearGradient
          colors={['#FCAF45', '#E1306C', '#833AB4']}
          start={{x: 0, y: 1}}
          end={{x: 1, y: 0}}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Instagram size={20} color="white" />
        </LinearGradient>

        {/* Text */}
        <View className="flex-1">
          <View className="flex-row items-center mb-0.5" style={{gap: 6}}>
            <AlertTriangle size={14} color="#F59E0B" />
            <Text className="text-sm font-bold text-slate-900">
              Instagram Reconnection Required
            </Text>
          </View>
          <Text className="text-xs text-slate-500">
            Reconnect your Instagram to keep your analytics up to date.
          </Text>
          {error ? (
            <Text className="text-xs text-red-500 mt-1">{error}</Text>
          ) : null}
        </View>

        {/* Reconnect Button */}
        <Pressable onPress={handleReconnect} disabled={connecting}>
          <LinearGradient
            colors={['#FCAF45', '#E1306C', '#833AB4']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              opacity: connecting ? 0.5 : 1,
            }}>
            {connecting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-xs font-bold">Reconnect</Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Dismiss */}
        <Pressable
          onPress={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full"
          hitSlop={8}>
          <X size={14} color="#94A3B8" />
        </Pressable>
      </View>
    </View>
  );
}
