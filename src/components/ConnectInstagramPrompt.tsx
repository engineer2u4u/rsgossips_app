// "Connect Instagram" sheet for creators who signed up with a typed handle
// and never OAuth'd (profile.instagram_verified === false). Sells what the
// connection adds — badge, ranking, reach/views/demographics — and runs the
// same in-app OAuth the reconnect flows use.
//
// Root-level, like InstagramReconnectModal, so stacked screens don't each
// mount a copy. The two never show together: reconnect needs a token to
// have existed, this needs one never to have.
//
// "Maybe later" snoozes it for 24h in AsyncStorage. The reconnect modal's
// in-memory dismissal would bring this back on every cold start, which for
// an optional upgrade is nagging rather than reminding.

import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BadgeCheck, BarChart3, Instagram, TrendingUp} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../context/AuthContext';
import {useInstagramReconnect} from '../hooks/useInstagramReconnect';

const SNOOZE_KEY = 'connect_ig_prompt_snoozed_until';
const SNOOZE_MS = 24 * 60 * 60 * 1000;

export default function ConnectInstagramPrompt() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {user, role, profile} = useAuth();
  // null = not read yet; never flash the sheet before the snooze is known.
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const {connecting, error, reconnect} = useInstagramReconnect({
    userId: user?.id,
    errorReconnect: t('InstagramReconnectModal.failed'),
    errorOpen: t('InstagramReconnectModal.failedOpen'),
    onReconnected: () => setDone(true),
  });

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SNOOZE_KEY)
      .then(v => {
        if (!cancelled) setSnoozedUntil(Number(v) || 0);
      })
      .catch(() => {
        if (!cancelled) setSnoozedUntil(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unverified =
    role === 'influencer' &&
    !!profile &&
    profile.instagram_verified === false &&
    !profile.instagram_connected;
  const visible =
    unverified && !done && snoozedUntil !== null && Date.now() >= snoozedUntil;

  const later = () => {
    const until = Date.now() + SNOOZE_MS;
    setSnoozedUntil(until);
    AsyncStorage.setItem(SNOOZE_KEY, String(until)).catch(() => {});
  };

  const points: Array<[React.ComponentType<any>, string]> = [
    [BadgeCheck, t('ConnectInstagramPrompt.pointVerified')],
    [TrendingUp, t('ConnectInstagramPrompt.pointRanking')],
    [BarChart3, t('ConnectInstagramPrompt.pointInsights')],
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={later} statusBarTranslucent>
      <View style={{flex: 1, backgroundColor: 'rgba(15, 15, 26, 0.55)', justifyContent: 'flex-end'}}>
        <View
          className="bg-white rounded-t-3xl px-5 pt-5"
          style={{paddingBottom: 16 + insets.bottom}}>
          <View className="items-center mb-4">
            <View
              className="items-center justify-center rounded-2xl"
              style={{width: 56, height: 56, backgroundColor: '#FDF2F8'}}>
              <Instagram size={28} color="#E60076" />
            </View>
          </View>
          <Text className="text-xl font-black text-[#1A1A1A] text-center">
            {t('ConnectInstagramPrompt.title')}
          </Text>
          <Text className="text-[13px] text-slate-500 text-center mt-2 px-2">
            {t('ConnectInstagramPrompt.body')}
          </Text>

          <View className="mt-5" style={{gap: 10}}>
            {points.map(([Icon, label]) => (
              <View key={label} className="flex-row items-center" style={{gap: 10}}>
                <View
                  className="items-center justify-center rounded-xl"
                  style={{width: 32, height: 32, backgroundColor: '#F5F3FF'}}>
                  <Icon size={16} color="#9810FA" />
                </View>
                <Text className="flex-1 text-[13px] font-semibold text-slate-700">{label}</Text>
              </View>
            ))}
          </View>

          {!!error && (
            <View className="rounded-xl bg-red-50 px-4 py-3 mt-4">
              <Text className="text-[13px] text-red-600">{error}</Text>
            </View>
          )}

          <Pressable
            onPress={reconnect}
            disabled={connecting}
            className={`w-full rounded-2xl items-center justify-center flex-row mt-5 ${
              connecting ? 'bg-slate-100' : 'bg-[#9810FA]'
            }`}
            style={{height: 52, gap: 8}}>
            {connecting ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white text-base font-semibold">
                  {t('ConnectInstagramPrompt.connecting')}
                </Text>
              </>
            ) : (
              <Text className="text-white text-base font-semibold">
                {t('ConnectInstagramPrompt.connect')}
              </Text>
            )}
          </Pressable>
          <Pressable onPress={later} disabled={connecting} className="items-center justify-center mt-2" style={{height: 44}}>
            <Text className="text-[14px] font-semibold text-slate-500">
              {t('ConnectInstagramPrompt.later')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
