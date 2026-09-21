import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Instagram, AlertTriangle, X } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { isInstagramInsightsNotGranted, isInstagramTokenExpired } from '../lib/instagramToken';
import { useInstagramReconnect } from '../hooks/useInstagramReconnect';

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
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const {profile} = useAuth();
  // Same flow as the reconnect popup — see useInstagramReconnect.
  const { connecting, error, reconnect: handleReconnect } = useInstagramReconnect({
    userId,
    errorReconnect: t('InstagramReconnectBanner.errorReconnect'),
    errorOpen: t('InstagramReconnectBanner.errorOpen'),
    onReconnected,
  });
  const expired = instagramTokenMissing || isInstagramTokenExpired(profile);
  // A working connection without the insights permission needs the same fix —
  // reconnect — but a different explanation: leave "insights" switched on.
  const insightsMissing = !expired && isInstagramInsightsNotGranted(profile);

  if ((!expired && !insightsMissing) || dismissed) return null;

  return (
    <View className="mx-5 mb-4">
      <View
        className="relative flex-row items-center p-4 rounded-2xl border border-amber-200"
        style={{ backgroundColor: '#FFFBEB', gap: 12 }}
      >
        {/* Instagram Icon */}
        <LinearGradient
          colors={['#FCAF45', '#E1306C', '#833AB4']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Instagram size={20} color="white" />
        </LinearGradient>

        {/* Text */}
        <View className="flex-1">
          <View className="flex-row items-center mb-0.5" style={{ gap: 6 }}>
            {/* <AlertTriangle size={14} color="#F59E0B" /> */}
            <Text className="text-sm font-bold text-slate-900">
              {insightsMissing
                ? t('InstagramReconnectBanner.insightsTitle')
                : t('InstagramReconnectBanner.title')}
            </Text>
          </View>
          <Text className="text-xs text-slate-500">
            {insightsMissing
              ? t('InstagramReconnectBanner.insightsDescription')
              : t('InstagramReconnectBanner.description')}
          </Text>
          {error ? (
            <Text className="text-xs text-red-500 mt-1">{error}</Text>
          ) : null}
        </View>

        {/* Reconnect Button */}
        <Pressable
          onPress={handleReconnect}
          disabled={connecting}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 12,
            overflow: 'hidden',
            opacity: connecting ? 0.5 : 1,
          }}
        >
          <LinearGradient
            colors={['#FCAF45', '#E1306C', '#833AB4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {connecting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white text-xs font-bold">
              {t('InstagramReconnectBanner.reconnect')}
            </Text>
          )}
        </Pressable>

        {/* Dismiss */}
        <Pressable
          onPress={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full"
          hitSlop={8}
        >
          <X size={14} color="#94A3B8" />
        </Pressable>
      </View>
    </View>
  );
}
