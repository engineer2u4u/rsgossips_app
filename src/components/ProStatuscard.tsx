import React, {useEffect, useState} from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {Sparkles, ChevronRight, Crown} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {invokeFn} from '../lib/api';
import {BRAND, BRAND_GRADIENT_WARM, BRAND_GRADIENT_SOFT, CARD_SHADOW} from '../theme/brand';

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
  const {profile} = useAuth();
  const navigation = useNavigation();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [matchingBrandsCount, setMatchingBrandsCount] = useState<number | null>(null);
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

  const displayName = profile?.full_name || 'Creator';
  const avatarUrl = profile?.profile_photo_url;
  const currentPlan = (profile?.subscription_plan || '').toLowerCase();
  // Mirrors web: any explicit non-empty plan other than the "free"/"trial"
  // placeholders counts as paid (including the ₹99/mo Starter tier).
  const hasPaidPlan =
    !!currentPlan && currentPlan !== 'free' && currentPlan !== 'trial';
  // Elite is the top tier — once a creator is on it there's nothing to
  // upgrade to, so the CTA hides itself.
  const isTopTierPlan = currentPlan === 'elite';
  const billingCycle = profile?.billing_cycle === 'annual' ? 'Annual' : 'Monthly';

  // Resolved plan name shown on the trial/upgrade strip — same logic as the
  // small "PLAN: …" pill in the header.
  const planLabel = hasPaidPlan
    ? currentPlan
        .replace('_', ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
    : trialDaysLeft === 0
      ? 'Free'
      : 'Starter Trial';

  // Approximation: assume the active sub renews `cycleDays` after the last
  // profile update (bumped on plan change). Stand-in until Stripe's
  // current_period_end is surfaced. Mirrors web getPlanRenewalInfo().
  const renewalDaysLeft = (() => {
    if (!profile?.updated_at) return null;
    const cycleDays = profile?.billing_cycle === 'annual' ? 365 : 30;
    const start = new Date(profile.updated_at).getTime();
    const elapsed = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, cycleDays - elapsed);
  })();

  useEffect(() => {
    opacity.value = withTiming(1, {duration: 600});
    progress.value = withDelay(
      500,
      withTiming(trialProgress, {duration: 1000}),
    );
  }, [trialProgress]);

  // Count brands with active campaigns matching the creator's categories.
  // Mirrors the web Recommended Campaigns filter so this number lines up
  // with what the "Campaigns for you" section below actually shows.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{campaigns?: any[]}>('list-campaigns', {});
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
  }, [userCategories.join('|')]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // Render-time helpers
  const renewalCopy = hasPaidPlan
    ? `${billingCycle} · renews in `
    : expired
      ? 'Trial ended — '
      : 'Trial · ';
  const renewalDays = hasPaidPlan
    ? renewalDaysLeft != null
      ? `${renewalDaysLeft} days`
      : '—'
    : `${trialDaysLeft} days left`;

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
      ]}>
      {/* 1. Header: rounded-square avatar tile + greeting + plan pill */}
      <View className="flex-row items-center" style={{gap: 12}}>
        {avatarUrl ? (
          <Image
            source={{uri: avatarUrl}}
            style={{width: 46, height: 46, borderRadius: 14}}
          />
        ) : (
          <LinearGradient
            colors={['#8b6df0', '#6a64c0']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text className="text-white text-[19px] font-bold">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}

        <View className="flex-1">
          <Text className="text-[18px] font-bold text-slate-900 leading-tight">
            Hi, {displayName.split(' ')[0]}
          </Text>
          <View
            className="flex-row items-center self-start mt-1.5 px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(106,100,192,0.13)',
              gap: 4,
            }}>
            <Crown size={11} color={BRAND.violet} />
            <Text
              className="text-[11px] font-bold tracking-wide"
              style={{color: BRAND.violet}}>
              {planLabel} plan
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Niche row — pink-tinted gradient pill that opens recommended campaigns */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('RecommendedCampaigns' as never)}
        style={{marginTop: 14, borderRadius: 16, overflow: 'hidden'}}>
        <LinearGradient
          colors={[...BRAND_GRADIENT_SOFT]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 12,
            gap: 11,
            borderWidth: 1,
            borderColor: 'rgba(25,22,43,0.06)',
            borderRadius: 16,
          }}>
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
              shadowOffset: {width: 0, height: 2},
              elevation: 2,
            }}>
            <Sparkles size={18} color={BRAND.accent} />
          </View>

          <Text
            className="flex-1 text-[13.5px] font-semibold text-slate-700"
            style={{lineHeight: 18}}>
            <Text style={{color: BRAND.accent, fontWeight: '700'}}>
              {matchingBrandsCount == null
                ? '…'
                : matchingBrandsCount === 0
                  ? '0 brands'
                  : `${matchingBrandsCount} brand${matchingBrandsCount === 1 ? '' : 's'}`}
            </Text>
            {userCategories.length > 0
              ? ' are looking for creators in your niche'
              : ' have active campaigns right now'}
          </Text>

          <ChevronRight size={16} color={BRAND.violet} style={{opacity: 0.7}} />
        </LinearGradient>
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
        }}>
        <View className="flex-1">
          <Text
            className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            Active Plan
          </Text>
          <Text
            className="text-[12.5px] font-semibold text-slate-700 mt-1"
            numberOfLines={1}>
            {renewalCopy}
            <Text className="font-bold text-slate-900">{renewalDays}</Text>
          </Text>

          {/* Trial progress bar — only when on trial */}
          {!hasPaidPlan && (
            <View
              className="h-1.5 w-full rounded-full overflow-hidden mt-2"
              style={{backgroundColor: 'rgba(25,22,43,0.08)'}}>
              <Animated.View style={[progressStyle]} className="h-full">
                <LinearGradient
                  colors={expired ? ['#F87171', '#F87171'] : [...BRAND_GRADIENT_WARM]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{flex: 1, borderRadius: 100}}
                />
              </Animated.View>
            </View>
          )}
        </View>

        {!isTopTierPlan && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('InfluencerPricing' as never)}>
            <LinearGradient
              colors={[...BRAND_GRADIENT_WARM]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 9,
                shadowColor: BRAND.accent,
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.28,
                shadowRadius: 8,
                elevation: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}>
              <Crown size={14} color="white" />
              <Text className="text-white text-[13px] font-bold">Upgrade</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
