import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronRight, Crown } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { invokeFn } from '../lib/api';
import { useProfilePhoto } from '../utils/photoUrl';
import {
  BRAND,
  BRAND_GRADIENT_WARM,
  BRAND_GRADIENT_SOFT,
  CARD_SHADOW,
} from '../theme/brand';

// Sloppy substring match between campaign tags and the creator's chosen
// categories — same pattern as web's TopPicksCarousel. "Beauty" matches
// "Beauty & Skincare" in either direction.
function tagsMatchCategories(
  tags: string[] | undefined,
  categories: string[] | undefined,
): boolean {
  if (!categories?.length || !tags?.length) return false;
  return categories.some(cat =>
    tags.some(
      t =>
        String(t).toLowerCase().includes(String(cat).toLowerCase()) ||
        String(cat).toLowerCase().includes(String(t).toLowerCase()),
    ),
  );
}

export default function ProStatusCard() {
  const { profile, user } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [matchingBrandsCount, setMatchingBrandsCount] = useState<number | null>(
    null,
  );
  const userCategories = profile?.categories || [];

  const createdAt = profile?.created_at
    ? new Date(profile.created_at)
    : new Date();
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  const trialDaysLeft = Math.max(0, 30 - daysSinceCreation);
  const trialProgress = Math.min(1, daysSinceCreation / 30);
  const expired = trialDaysLeft === 0;

  const displayName = profile?.full_name || t('ProStatuscard.creatorFallback');
  const avatarUrl = useProfilePhoto();
  const currentPlan = (profile?.subscription_plan || '').toLowerCase();
  // Mirrors web: any explicit non-empty plan other than the "free"/"trial"
  // placeholders counts as paid (including the ₹99/mo Starter tier).
  const hasPaidPlan =
    !!currentPlan && currentPlan !== 'free' && currentPlan !== 'trial';
  // Elite is the top tier — once a creator is on it there's nothing to
  // upgrade to, so the CTA hides itself.
  const isTopTierPlan = currentPlan === 'elite';
  const billingCycle =
    profile?.billing_cycle === 'annual'
      ? t('ProStatuscard.billingAnnual')
      : t('ProStatuscard.billingMonthly');

  // Resolved plan name shown on the trial/upgrade strip — same logic as the
  // small "PLAN: …" pill in the header.
  const planLabel = hasPaidPlan
    ? currentPlan
        .replace('_', ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
    : trialDaysLeft === 0
      ? t('ProStatuscard.planFree')
      : t('ProStatuscard.planStarterTrial');

  // Exact next-billing date from the gateway (subscription-history's
  // next_charge_at, unix seconds). While it's in flight we show a
  // placeholder — the updated_at approximation flashed a wrong "30" for a
  // few seconds before correcting. Approximation is only the fallback
  // after the fetch settles without a date. Mirrors web ProStatusCard.
  const [realRenewalTs, setRealRenewalTs] = useState<number | null>(null);
  const [renewalFetching, setRenewalFetching] = useState(true);
  useEffect(() => {
    if (!user?.id || !hasPaidPlan) {
      setRenewalFetching(false);
      return;
    }
    let cancelled = false;
    setRenewalFetching(true);
    (async () => {
      try {
        const hist = await invokeFn<{ invoices?: { next_charge_at?: number }[] }>(
          'subscription-history',
          { userId: user.id },
        );
        const invoices = Array.isArray(hist?.invoices) ? hist.invoices : [];
        const ts = invoices.reduce(
          (max, i) => (i?.next_charge_at ? Math.max(max, i.next_charge_at) : max),
          0,
        );
        if (!cancelled && ts > 0) setRealRenewalTs(ts);
      } catch {
        // keep the approximation
      } finally {
        if (!cancelled) setRenewalFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.subscription_plan]);

  const renewalDaysLeft = (() => {
    if (realRenewalTs) {
      return Math.max(
        0,
        Math.ceil((realRenewalTs * 1000 - Date.now()) / (1000 * 60 * 60 * 24)),
      );
    }
    if (!profile?.updated_at) return null;
    const cycleDays = profile?.billing_cycle === 'annual' ? 365 : 30;
    const start = new Date(profile.updated_at).getTime();
    const elapsed = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, cycleDays - elapsed);
  })();

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    progress.value = withDelay(
      500,
      withTiming(trialProgress, { duration: 1000 }),
    );
  }, [trialProgress]);

  // Count UNIQUE BRANDS with an active campaign matching the creator's
  // categories — mirrors the web ProStatusCard exactly (source of truth):
  // list-campaigns with NO influencerId (so ALL active campaigns are
  // considered, not just ones the user hasn't applied to), then de-dupe by
  // brand. Passing influencerId here made the count exclude already-applied
  // campaigns, so the home pitch read 0 while web read 1 for the same user.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{ campaigns?: any[] }>('list-campaigns', {});
        if (cancelled || !Array.isArray(data?.campaigns)) return;
        const matching = data.campaigns.filter((c: any) => {
          if (c.status !== 'Active') return false;
          if (userCategories.length === 0) return true;
          return tagsMatchCategories(c.tags, userCategories);
        });
        const brandIds = new Set(
          matching.map((c: any) => c.brandId || c.brandName).filter(Boolean),
        );
        if (!cancelled) setMatchingBrandsCount(brandIds.size);
      } catch {
        if (!cancelled) setMatchingBrandsCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, userCategories.join('|')]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // Render-time helpers
  const renewalCopy = hasPaidPlan
    ? t('ProStatuscard.renewsIn', { cycle: billingCycle })
    : expired
      ? t('ProStatuscard.trialEnded')
      : t('ProStatuscard.trialPrefix');
  const renewalDays = hasPaidPlan
    ? renewalFetching && !realRenewalTs
      ? '…' // placeholder while the exact gateway date loads
      : renewalDaysLeft != null
        ? t('ProStatuscard.daysValue', { count: renewalDaysLeft })
        : '—'
    : t('ProStatuscard.daysLeft', { count: trialDaysLeft });

  return (
    <Animated.View
      style={[
        {
          opacity,
          backgroundColor: '#fff',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(25,22,43,0.06)',
          padding: 16,
          width: '100%',
        },
        CARD_SHADOW,
      ]}
    >
      {/* 1. Header: rounded-square avatar tile + greeting + plan pill.
          Tapping the avatar opens the user's profile — this is the primary
          path now that the header avatar was removed. */}
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('InfluencerProfile' as never)}
          style={{ width: 46, height: 46, borderRadius: 14, overflow: 'hidden' }}>
          {avatarUrl ? (
            // key={avatarUrl} forces RN to drop the previous Image
            // instance the moment the cache-busted URL changes — without
            // it the image component holds onto the prior decoded bitmap
            // and never repaints even when the source prop changes on iOS.
            <Image
              key={avatarUrl}
              source={{ uri: avatarUrl }}
              style={{ width: 46, height: 46 }}
            />
          ) : (
            <LinearGradient
              colors={['#8b6df0', '#6a64c0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 46,
                height: 46,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-white text-[19px] font-bold">
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-[18px] font-bold text-slate-900 leading-tight">
            {t('ProStatuscard.greeting', { name: displayName.split(' ')[0] })}
          </Text>
          <View
            className="flex-row items-center self-start mt-1.5 px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(106,100,192,0.13)',
              gap: 4,
            }}
          >
            <Crown size={11} color={BRAND.violet} />
            <Text
              className="text-[11px] font-bold tracking-wide"
              style={{ color: BRAND.violet }}
            >
              {t('ProStatuscard.planPill', { plan: planLabel })}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Niche row — opens the Campaigns list with the user's categories
          pre-applied as filters (falls back to the unfiltered list if they
          haven't picked any categories yet). */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          (navigation as any).navigate('InfluencerCampaigns', {
            categories: userCategories,
          })
        }
        style={{
          marginTop: 14,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 12,
          gap: 11,
          borderWidth: 1,
          borderColor: 'rgba(25,22,43,0.06)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={[...BRAND_GRADIENT_SOFT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#19162b',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <Sparkles size={18} color={BRAND.accent} />
        </View>

        <Text
          className="flex-1 text-[13.5px] font-semibold text-slate-700"
          style={{ lineHeight: 18 }}
        >
          <Text style={{ color: BRAND.accent, fontWeight: '700' }}>
            {matchingBrandsCount == null
              ? '…'
              : t('ProStatuscard.brandsCount', {
                  count: matchingBrandsCount,
                })}
          </Text>
          {userCategories.length > 0
            ? t('ProStatuscard.nicheTail')
            : t('ProStatuscard.activeTail')}
        </Text>

        <ChevronRight
          size={16}
          color={BRAND.violet}
          style={{ opacity: 0.7 }}
        />
      </TouchableOpacity>

      {/* 3. Plan strip — small ACTIVE PLAN label + inline renewal + Upgrade */}
      <View
        className="flex-row items-center"
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: 'rgba(25,22,43,0.06)',
          gap: 12,
        }}
      >
        <View className="flex-1">
          <Text className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            {t('ProStatuscard.activePlanLabel')}
          </Text>
          <Text
            className="text-[12.5px] font-semibold text-slate-700 mt-1"
            numberOfLines={1}
          >
            {renewalCopy}
            <Text className="font-bold text-slate-900">{renewalDays}</Text>
          </Text>

          {/* Trial progress bar — only when on trial */}
          {!hasPaidPlan && (
            <View
              className="h-1.5 w-full rounded-full overflow-hidden mt-2"
              style={{ backgroundColor: 'rgba(25,22,43,0.08)' }}
            >
              <Animated.View style={[progressStyle]} className="h-full">
                <LinearGradient
                  colors={
                    expired ? ['#F87171', '#F87171'] : [...BRAND_GRADIENT_WARM]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1, borderRadius: 100 }}
                />
              </Animated.View>
            </View>
          )}
        </View>

        {!isTopTierPlan && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('InfluencerPricing' as never)}
            style={{
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 9,
              shadowColor: BRAND.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.28,
              shadowRadius: 8,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={[...BRAND_GRADIENT_WARM]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Crown size={14} color="white" />
            <Text className="text-white text-[13px] font-bold">{t('ProStatuscard.upgrade')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
