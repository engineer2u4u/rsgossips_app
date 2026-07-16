import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { Gift, Heart, Sparkles, Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { BRAND_GRADIENT_WARM } from '../theme/brand';

// First-time welcome-reward celebration for new influencer signups. On
// signup, create-profile grants 50 RC (locked 30 days) + 50% off the first
// subscription. Instead of a quiet "+50 locked" wallet strip, we pop a
// celebratory modal ONCE — tracked in AsyncStorage per user.
//
// Trigger: user has the still-locked 50 RC welcome bonus (locked ≥ 50,
// nothing available yet — the fresh-signup fingerprint) AND hasn't seen it.
const SEEN_KEY = (uid: string) => `rg_welcome_reward_seen_v1_${uid}`;

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const CONFETTI_COLORS = [
  '#9810FA',
  '#E60076',
  '#F59E0B',
  '#22C55E',
  '#3B82F6',
  '#EC4899',
];

export default function WelcomeRewardModal() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [referrer, setReferrer] = useState<any>(null);

  // Entrance + float animation drivers.
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const giftFloat = useRef(new Animated.Value(0)).current;
  // One Animated.Value per confetti piece (drives its fall).
  const confetti = useRef(
    Array.from({ length: 26 }).map((_, i) => ({
      v: new Animated.Value(0),
      left: Math.round((((i * 9301 + 49297) % 233280) / 233280) * SCREEN_W),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + ((i * 7) % 8),
      delay: (i % 10) * 90,
      dur: 2400 + ((i * 613) % 1800),
      round: i % 3 === 0,
    })),
  ).current;

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(SEEN_KEY(user.id));
        if (seen || cancelled) return;
        const [{ data }, { data: refData }] = await Promise.all([
          supabase
            .from('v_reward_credits_available_balance')
            .select('available_balance, locked_balance')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase.rpc('get_my_referrer'),
        ]);
        if (cancelled) return;
        const avail = data?.available_balance || 0;
        const locked = data?.locked_balance || 0;
        const ref = Array.isArray(refData) ? refData[0] : refData;
        if (ref && (ref.referrer_name || ref.referrer_username))
          setReferrer(ref);
        if (locked >= 50 && avail <= 0) {
          setOpen(true);
          // Persist "seen" the moment we SHOW it, not just on dismiss. The
          // trigger condition stays true for the whole 30-day lock window, so
          // if the user force-quits (or dismisses any way that skips the
          // buttons) without the flag being written, it would re-pop on every
          // launch. Writing here guarantees strictly-once.
          try {
            await AsyncStorage.setItem(SEEN_KEY(user.id), '1');
          } catch {
            /* ignore — dismiss() still writes it as a backstop */
          }
        }
      } catch {
        /* silent — home shouldn't fail on a wallet lookup */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Kick off animations when the modal opens.
  useEffect(() => {
    if (!open) return;
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(giftFloat, {
          toValue: -8,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(giftFloat, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    confetti.forEach(c => {
      c.v.setValue(0);
      Animated.timing(c.v, {
        toValue: 1,
        duration: c.dur,
        delay: c.delay,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }, [open, cardScale, cardOpacity, giftFloat, confetti]);

  const dismiss = async (goToRefer: boolean) => {
    try {
      if (user?.id) await AsyncStorage.setItem(SEEN_KEY(user.id), '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
    if (goToRefer) navigation.navigate('InfluencerRefer');
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <Pressable
        onPress={() => {}}
        style={{
          flex: 1,
          backgroundColor: 'rgba(20, 6, 40, 0.62)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        {/* Confetti */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
          }}
        >
          {confetti.map((c, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: c.left,
                width: c.size,
                height: c.size * 0.42,
                backgroundColor: c.color,
                borderRadius: c.round ? 999 : 2,
                opacity: c.v.interpolate({
                  inputRange: [0, 0.1, 0.9, 1],
                  outputRange: [0, 1, 1, 0.6],
                }),
                transform: [
                  {
                    translateY: c.v.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-30, SCREEN_H + 30],
                    }),
                  },
                  {
                    rotate: c.v.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '720deg'],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>

        {/* Card */}
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 380 }}>
          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
              borderRadius: 32,
              overflow: 'hidden',
              backgroundColor: '#FBF7FF',
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 20 },
              elevation: 16,
            }}
          >
            {/* Gradient header with the gift */}
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingTop: 28,
                paddingBottom: 22,
                paddingHorizontal: 24,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  marginBottom: 8,
                }}
              >
                <Text className="text-[11px] font-black uppercase tracking-widest text-white">
                  {t('WelcomeRewardModal.badge')}
                </Text>
              </View>
              <Animated.View style={{ transform: [{ translateY: giftFloat }] }}>
                <Gift size={76} color="#FFFFFF" strokeWidth={1.75} />
              </Animated.View>
              <View style={{ position: 'absolute', left: 40, top: 44 }}>
                <Sparkles size={18} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <View style={{ position: 'absolute', right: 44, top: 56 }}>
                <Star size={16} color="#FDE68A" fill="#FDE68A" />
              </View>
              <View style={{ position: 'absolute', left: 54, bottom: 26 }}>
                <Heart size={16} color="#F9A8D4" fill="#F9A8D4" />
              </View>
            </LinearGradient>

            {/* Body */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingTop: 18,
                paddingBottom: Platform.OS === 'ios' ? 30 : 22,
              }}
            >
              <Text className="text-[22px] font-black text-slate-900 text-center">
                {t('WelcomeRewardModal.congrats')}
              </Text>
              <Text
                className="text-[13px] font-medium text-slate-500 text-center"
                style={{ marginTop: 6, lineHeight: 19 }}
              >
                {t('WelcomeRewardModal.subtitle')}
              </Text>

              {/* Reward rows */}
              <View style={{ marginTop: 16, gap: 8 }}>
                <View
                  className="flex-row items-center rounded-2xl"
                  style={{
                    gap: 12,
                    padding: 12,
                    backgroundColor: 'rgba(152,16,250,0.06)',
                    borderWidth: 1,
                    borderColor: 'rgba(152,16,250,0.15)',
                  }}
                >
                  <LinearGradient
                    colors={['#9810FA', '#E60076']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text className="text-white text-xs font-black">
                      {t('WelcomeRewardModal.rcBadge')}
                    </Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text className="text-[13px] font-black text-slate-900">
                      {t('WelcomeRewardModal.creditsTitle')}
                    </Text>
                    <Text
                      className="text-[11px] font-medium text-slate-500"
                      style={{ lineHeight: 15 }}
                    >
                      {t('WelcomeRewardModal.creditsDesc')}
                    </Text>
                  </View>
                </View>

                {/* Referral gift — only when this signup came via a referral. */}
                {referrer ? (
                  <View
                    className="flex-row items-center rounded-2xl"
                    style={{
                      gap: 12,
                      padding: 12,
                      backgroundColor: 'rgba(236,72,153,0.06)',
                      borderWidth: 1,
                      borderColor: 'rgba(236,72,153,0.15)',
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#22C55E',
                      }}
                    >
                      <Text className="text-white text-base font-black">%</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="text-[13px] font-black text-slate-900">
                        {t('WelcomeRewardModal.discountTitle')}
                      </Text>
                      <View
                        className="flex-row items-center"
                        style={{ gap: 5, marginTop: 2 }}
                      >
                        <Text className="text-[11px] font-medium text-slate-500">
                          {t('WelcomeRewardModal.giftedBy')}
                        </Text>
                        {referrer.referrer_photo ? (
                          <Image
                            source={{ uri: referrer.referrer_photo }}
                            style={{ width: 16, height: 16, borderRadius: 8 }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: '#E60076',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: 'white',
                                fontSize: 8,
                                fontWeight: '900',
                              }}
                            >
                              {(
                                referrer.referrer_name ||
                                referrer.referrer_username ||
                                '?'
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text
                          className="text-[11px] font-black text-slate-800"
                          numberOfLines={1}
                        >
                          {referrer.referrer_name ||
                            `@${referrer.referrer_username}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* CTA */}
              <Pressable
                onPress={() => dismiss(true)}
                style={{ marginTop: Platform.OS === 'ios' ? 26 : 20 }}
              >
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: Platform.OS === 'ios' ? 54 : 50,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-white text-sm font-black">
                    {t('WelcomeRewardModal.claim')}
                  </Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => dismiss(false)}
                style={{ marginTop: 8, paddingVertical: 6 }}
              >
                <Text className="text-[12px] font-bold text-slate-400 text-center">
                  {t('WelcomeRewardModal.maybeLater')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
