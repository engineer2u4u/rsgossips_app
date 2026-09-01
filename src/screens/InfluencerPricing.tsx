import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {Check, ChevronLeft, Crown, Info} from 'lucide-react-native';
import {useAuth} from '../context/AuthContext';
import {useSubscriptionPurchase} from '../hooks/useSubscriptionPurchase';
import {IAP_SKUS, MANAGE_SUBSCRIPTION_URL} from '../lib/iap';
import {
  FEATURE_GROUPS,
  PLAN_IDS,
  formatFeatureValue,
  getEffectivePlan,
  getFeatureValue,
  type BillingCycle,
  type PlanId,
} from '../lib/plans';
import {CARD_SHADOW} from '../theme/brand';
import {Linking} from 'react-native';

// In-app plans, purchased through the store.
//
// This screen exists because store billing requires it: creator plans are
// digital goods, so Apple 3.1.1 and Google's payments policy mandate their own
// rail on mobile, and sending users to the website to subscribe is the
// steering both prohibit. The previous InfluencerPricing screen was deleted
// when plans moved to the web; this replaces it.
//
// Prices come from the STORE's product list, never PLAN_PRICING. The store
// decides what a user is actually charged — currency, tax, regional
// adjustments — and displaying anything else is both wrong and a review risk.
// PLAN_PRICING stays the web's concern.

const PLAN_ORDER: PlanId[] = [PLAN_IDS.STARTER, PLAN_IDS.PRO, PLAN_IDS.ELITE];

// A short highlight per tier rather than the full FEATURE_MATRIX — the
// comparison table is a web-sized layout, and a phone needs the three or four
// lines that actually differentiate the tiers.
const HIGHLIGHT_KEYS = [
  'campaign_applications_limit',
  'discovery_priority',
  'analytics_advanced',
  'ai_tools_access',
];

export default function InfluencerPricing() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {profile} = useAuth();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  const {
    connected,
    subscriptions,
    status,
    busy,
    error,
    subscribedPlan,
    clearSubscribed,
    buy,
    restore,
  } = useSubscriptionPurchase();

  // Store-specific wording for the info tooltips — the flow is identical, only
  // the store name differs between platforms.
  const storeName = Platform.OS === 'ios' ? 'the App Store' : 'Google Play';
  const storeAccount = Platform.OS === 'ios' ? 'Apple ID' : 'Google account';

  // Confirm a completed subscription. subscribedPlan is set by the hook only
  // after the server verified the receipt and granted the tier.
  useEffect(() => {
    if (!subscribedPlan) return;
    const planName = t(`Pricing.plans.${subscribedPlan}`, {
      defaultValue: subscribedPlan,
    });
    Alert.alert(
      t('Pricing.successTitle', {plan: planName}),
      t('Pricing.successBody'),
    );
    clearSubscribed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribedPlan]);

  const currentPlan = getEffectivePlan(profile);
  const isSubscribed =
    !!profile?.subscription_plan &&
    !['trial', 'free', ''].includes(String(profile.subscription_plan).toLowerCase());
  // The current plan is a tier + a cycle. Pro Monthly and Pro Annual are
  // different products, so "Current" must match BOTH — otherwise switching a
  // Pro Monthly user to the Annual tab wrongly marks Pro Annual as their plan.
  const currentCycle: BillingCycle =
    profile?.billing_cycle === 'annual' ? 'annual' : 'monthly';

  // Store product by SKU, so each card can show the real localised price.
  const bySku = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of subscriptions || []) {
      const id = (p as any)?.id || (p as any)?.productId;
      if (id) map.set(String(id), p);
    }
    return map;
  }, [subscriptions]);

  const priceFor = (plan: PlanId): string | null => {
    const sku = IAP_SKUS[plan][cycle];
    const product = bySku.get(sku);
    if (!product) return null;
    // Field name varies by platform/library version; prefer whatever the store
    // gave us pre-formatted with its own currency symbol.
    return (
      product.displayPrice ||
      product.localizedPrice ||
      product.price ||
      null
    );
  };

  const highlightsFor = (plan: PlanId) =>
    HIGHLIGHT_KEYS.map(key => {
      const label = FEATURE_GROUPS.flatMap(g => g.features).find(
        f => f.key === key,
      )?.label;
      const value = getFeatureValue(plan, key);
      if (!label || value === null || value === false) return null;
      return `${label}: ${formatFeatureValue(value)}`;
    }).filter(Boolean) as string[];

  return (
    <View className="flex-1 bg-slate-50">
      <View
        className="flex-row items-center px-5 py-4 bg-white border-b border-slate-100"
        style={{paddingTop: insets.top + 12}}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}>
          <ChevronLeft size={22} color="#0f172a" />
        </Pressable>
        <Text className="text-[17px] font-black text-slate-900 ml-2">
          {t('Pricing.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 48}}>
        {/* Monthly / annual */}
        <View className="flex-row bg-slate-100 rounded-2xl p-1 mb-5">
          {(['monthly', 'annual'] as BillingCycle[]).map(c => {
            const active = cycle === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCycle(c)}
                className={`flex-1 h-10 rounded-xl items-center justify-center ${
                  active ? 'bg-white' : ''
                }`}
                style={active ? CARD_SHADOW : undefined}
                accessibilityRole="radio"
                accessibilityState={{selected: active}}>
                <Text
                  className={`text-[13px] ${
                    active ? 'font-black text-slate-900' : 'font-bold text-slate-500'
                  }`}>
                  {t(`Pricing.cycle.${c}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!!error && (
          <View className="rounded-xl bg-red-50 px-4 py-3 mb-4">
            <Text className="text-[13px] text-red-600">{error}</Text>
          </View>
        )}

        {!connected && (
          <View className="rounded-xl bg-amber-50 px-4 py-3 mb-4">
            <Text className="text-[13px] text-amber-700">
              {t('Pricing.connecting')}
            </Text>
          </View>
        )}

        {PLAN_ORDER.map(plan => {
          const price = priceFor(plan);
          const isCurrent =
            currentPlan === plan && isSubscribed && currentCycle === cycle;
          const highlights = highlightsFor(plan);
          return (
            <View
              key={plan}
              style={[CARD_SHADOW, {backgroundColor: '#fff'}]}
              className="rounded-3xl p-5 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center" style={{gap: 8}}>
                  {plan === PLAN_IDS.ELITE && <Crown size={16} color="#d2418f" />}
                  <Text className="text-[17px] font-black text-slate-900">
                    {t(`Pricing.plans.${plan}`)}
                  </Text>
                </View>
                {isCurrent && (
                  <View className="rounded-full bg-emerald-50 px-2.5 py-1">
                    <Text className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                      {t('Pricing.current')}
                    </Text>
                  </View>
                )}
              </View>

              {/* Price straight from the store. While products are loading we
                  show a placeholder rather than PLAN_PRICING — a figure that
                  disagrees with what the store charges is worse than a pause. */}
              <Text className="text-[26px] font-black text-slate-900 mt-2">
                {price || '—'}
                {price ? (
                  <Text className="text-[13px] font-bold text-slate-400">
                    {' '}
                    /{t(`Pricing.per.${cycle}`)}
                  </Text>
                ) : null}
              </Text>

              <View className="mt-3" style={{gap: 6}}>
                {highlights.map(line => (
                  <View key={line} className="flex-row items-start" style={{gap: 8}}>
                    <Check size={14} color="#26695A" style={{marginTop: 2}} />
                    <Text className="flex-1 text-[12.5px] text-slate-600 leading-5">
                      {line}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => buy(plan, cycle)}
                disabled={busy || !connected || isCurrent || !price}
                className="mt-4"
                accessibilityRole="button">
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{
                    height: 48,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: busy || !connected || isCurrent || !price ? 0.45 : 1,
                  }}>
                  {busy && status !== 'restoring' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-[15px] font-black">
                      {isCurrent ? t('Pricing.yourPlan') : t('Pricing.choose')}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          );
        })}

        {/* Restore is REQUIRED by Apple for any app selling subscriptions —
            review fails without it — and it is the recovery path after a
            reinstall or on a new device. */}
        <View
          className="flex-row items-center justify-center mt-1"
          style={{gap: 6}}>
          <Pressable
            onPress={restore}
            disabled={busy}
            className="h-12 items-center justify-center"
            accessibilityRole="button">
            {status === 'restoring' ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-[14px] font-bold text-slate-600">
                {t('Pricing.restore')}
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert(
                t('Pricing.restoreInfoTitle'),
                t('Pricing.restoreInfo', {account: storeAccount}),
              )
            }
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('Pricing.restoreInfoTitle')}>
            <Info size={15} color="#94a3b8" />
          </Pressable>
        </View>

        {/* Cancellation and payment method belong to the store once billing
            runs through it, and both stores forbid sending users elsewhere to
            manage that. */}
        {isSubscribed && (
          <View
            className="flex-row items-center justify-center"
            style={{gap: 6}}>
            <Pressable
              onPress={() =>
                Linking.openURL(MANAGE_SUBSCRIPTION_URL).catch(() => {})
              }
              className="h-11 items-center justify-center"
              accessibilityRole="button">
              <Text className="text-[13px] font-bold text-slate-400">
                {t('Pricing.manage')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  t('Pricing.manageInfoTitle'),
                  t('Pricing.manageInfo', {store: storeName}),
                )
              }
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('Pricing.manageInfoTitle')}>
              <Info size={15} color="#94a3b8" />
            </Pressable>
          </View>
        )}

        <Text className="text-[11px] text-slate-400 text-center mt-3 leading-4">
          {t('Pricing.legal')}
        </Text>

        {/* Terms of Use + Privacy Policy links are REQUIRED on the paywall for
            auto-renewable subscriptions (App Store guideline 3.1.2). */}
        <View
          className="flex-row items-center justify-center mt-2"
          style={{gap: 8}}>
          <Pressable
            onPress={() =>
              Linking.openURL('https://rgossips.com/terms').catch(() => {})
            }
            accessibilityRole="link">
            <Text className="text-[11px] font-bold text-slate-500 underline">
              {t('Pricing.terms')}
            </Text>
          </Pressable>
          <Text className="text-[11px] text-slate-400">·</Text>
          <Pressable
            onPress={() =>
              Linking.openURL('https://rgossips.com/privacy').catch(() => {})
            }
            accessibilityRole="link">
            <Text className="text-[11px] font-bold text-slate-500 underline">
              {t('Pricing.privacy')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Whole-screen blocking overlay while a purchase / verification / restore
          is in flight — the store sheet dismisses first, and verification can
          take a beat, so the whole screen shows progress rather than three
          separate button spinners. */}
      <Modal visible={busy} transparent animationType="fade" onRequestClose={() => {}}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15,23,42,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              paddingVertical: 26,
              paddingHorizontal: 34,
              alignItems: 'center',
              gap: 14,
              minWidth: 200,
            }}>
            <ActivityIndicator size="large" color="#9810FA" />
            <Text className="text-[14px] font-bold text-slate-700 text-center">
              {status === 'verifying'
                ? t('Pricing.overlayVerifying')
                : status === 'restoring'
                  ? t('Pricing.overlayRestoring')
                  : t('Pricing.overlayPurchasing')}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
