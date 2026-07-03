import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  Check,
  X,
  Target,
  Zap,
  Rocket,
  Crown,
  ChevronLeft,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import RazorpayCheckout from 'react-native-razorpay';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {supabase} from '../utils/supabase';
import InfluencerLayout from '../layouts/InfluencerLayout';
import GatewayPickerModal from '../components/GatewayPickerModal';
import VerifyingOverlay from '../components/VerifyingOverlay';
import {
  PLAN_PRICING,
  PLAN_RAZORPAY_IDS,
  PLAN_STRIPE_PRICES,
  type PlanId,
} from '../lib/plans';

// Stripe Checkout success redirect URL. We send a custom-scheme origin so
// the in-app browser (Chrome Custom Tabs on Android, ASWebAuthenticationSession
// on iOS) actually intercepts the redirect — both backends only auto-close
// on a redirect to a URL scheme the app has *registered* (see the intent-filter
// in AndroidManifest.xml and CFBundleURLTypes in Info.plist). Plain HTTPS
// would just load rgossips.com inside the browser tab instead of returning
// control to the app.
//
// IMPORTANT: this scheme must also be on the edge function's ALLOWED_ORIGINS
// allow-list in `supabase/functions/stripe-checkout/index.ts`; otherwise the
// function silently falls back to APP_URL and we'd ship the old bug.
const STRIPE_RETURN_ORIGIN = 'com.rgossips://stripe-return';
const STRIPE_RETURN_URL_PREFIX = `${STRIPE_RETURN_ORIGIN}/influencer/pricing`;

// `profile.phone` is stored as raw digits with the country code but no `+`
// (e.g. "919876543210"). Razorpay's customer API + SDK prefill accept either
// a bare 10-digit Indian number or E.164 — they silently drop anything else,
// which is why the Razorpay checkout sheet was opening with an empty phone
// field. Normalize before sending in both places.
function formatPhoneForRazorpay(raw: string | undefined | null): string {
  if (!raw) return '';
  // Keep the leading `+` if present, then strip everything that isn't a digit.
  const hasPlus = raw.trim().startsWith('+');
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (hasPlus) return `+${digits}`;
  // 10 digits → assume Indian → prepend +91.
  if (digits.length === 10) return `+91${digits}`;
  // 12 digits starting with 91 → already country-coded, just add the +.
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  // Other lengths (11 digits with leading 0, intl numbers, etc.) — leave
  // them as-is with a leading + so Razorpay still tries to parse them
  // rather than silently dropping.
  return `+${digits}`;
}

const TRIAL_DAYS = 30;

interface Plan {
  id: string;
  name: string;
  iconName: string;
  tagline: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  notIncluded: string[];
  popular?: boolean;
  savings?: string;
}

const PLANS: Record<string, Plan[]> = {
  monthly: [
    {
      id: 'starter',
      name: 'Starter',
      iconName: 'target',
      tagline: 'Your launchpad into brand collaborations',
      price: '99',
      period: '/mo',
      description: 'Best for: Nano & micro influencers (1K – 25K)',
      features: [
        'Listed in brand search',
        'Up to 3 campaign applications/month',
        'Brand DMs 10/month',
        '1 media kit template (PDF)',
        'Basic analytics dashboard',
        'Creator community & forums',
        'Standard payouts 7-10 days',
        'Verified badge eligibility',
        'AI caption generator 3/month',
        'Brief templates library',
      ],
      notIncluded: [
        'Priority brand search placement',
        'Unlimited applications',
        'AI content suite',
        'Audience insights & demographics',
        'Dedicated support manager',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      iconName: 'zap',
      tagline: 'Built for creators who earn seriously',
      price: '299',
      period: '/mo',
      popular: true,
      description: 'Best for: Micro to mid-tier (10K – 200K)',
      features: [
        'Priority brand search 3× visibility',
        'Unlimited campaign applications',
        'Unlimited brand DMs',
        'AI content suite 50/month',
        '3 media kit templates (PDF + link)',
        'Advanced analytics & reports',
        'Audience insights age, gender, location',
        'Fake follower & engagement audit',
        'Rate benchmarking tool',
        'Early access to brand deals',
        'Faster payouts 3-5 days',
        'Creator Academy - Full access',
      ],
      notIncluded: [
        'Dedicated account manager',
        'Homepage spotlight feature',
        'Custom media kit builder',
      ],
    },
    {
      id: 'elite',
      name: 'Elite',
      iconName: 'rocket',
      tagline: 'The professional-grade creator OS',
      price: '699',
      period: '/mo',
      description: 'Best for: Macro & mega (200K+)',
      features: [
        'Featured in brand search (top)',
        'Unlimited apps + AI shortlisting',
        'Dedicated account manager',
        'AI content suite - unlimited',
        'Custom media kit builder',
        'Deep audience analytics',
        'Monthly engagement audit',
        'Instant payouts within 48 hrs',
        'Priority deal matching',
        'Campaign ROI report',
        'Homepage spotlight monthly',
        'Analytics export (Excel, PDF)',
        'Elite Verified badge',
        'Beta access to new features',
      ],
      notIncluded: [],
    },
  ],
  annual: [
    {
      id: 'starter_annual',
      name: 'Starter Annual',
      iconName: 'target',
      tagline: '12 months for the price of 9',
      price: '899',
      period: '/yr',
      savings: 'Save ₹289',
      description: '₹75/month · 32% off',
      features: [
        'All Starter Monthly features, plus:',
        '3 months FREE (pay for 9)',
        '2× AI content generation',
        '2 media kit templates',
        'Annual performance report',
        'Priority access to events',
        'Price locked for 12 months',
      ],
      notIncluded: [
        'Priority brand search',
        'AI content suite (unlimited)',
        'Audience insights',
        'Dedicated support manager',
      ],
    },
    {
      id: 'pro_annual',
      name: 'Pro Annual',
      iconName: 'zap',
      tagline: 'Scale your brand deals all year',
      price: '2,899',
      period: '/yr',
      savings: 'Save ₹689',
      popular: true,
      description: '₹241/month · 24% off',
      features: [
        'All Pro Monthly features, plus:',
        '~2 months FREE (pay for 10)',
        '2× AI content suite 100/mo',
        'Quarterly audience audit',
        '2 brand newsletter features/yr',
        'Exclusive annual-only campaigns',
        'Annual income summary',
        'Priority support 12hr SLA',
        'Price locked for 12 months',
      ],
      notIncluded: [
        'Dedicated account manager',
        'Custom analytics export',
        'Homepage spotlight',
      ],
    },
    {
      id: 'elite_annual',
      name: 'Elite Annual',
      iconName: 'rocket',
      tagline: 'The all-in-one professional creator OS',
      price: '6,899',
      period: '/yr',
      savings: 'Save ₹1,489',
      description: '₹575/month · 22% off',
      features: [
        'All Elite Monthly features, plus:',
        '~2 months FREE on annual billing',
        'Dedicated account manager 8hr SLA',
        'Quarterly strategy call',
        '4 homepage spotlights/yr',
        'Annual stats & growth report',
        'RGossips Creator Summit invite',
        'First access to new features',
        'Price locked for 12 months',
      ],
      notIncluded: [],
    },
  ],
};

const PlanIcon = ({name, color}: {name: string; color: string}) => {
  switch (name) {
    case 'target':
      return <Target size={20} color={color} />;
    case 'zap':
      return <Zap size={20} color={color} />;
    case 'rocket':
      return <Rocket size={20} color={color} />;
    default:
      return <Target size={20} color={color} />;
  }
};

export default function InfluencerPricing() {
  const {profile, user, refreshProfile} = useAuth();
  const navigation = useNavigation();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  // Holds the plan the user tapped Upgrade on; opens the gateway picker.
  const [pickerPlan, setPickerPlan] = useState<Plan | null>(null);
  // True while we poll the profile after a successful payment, waiting
  // for the webhook to flip subscription_plan on the row.
  const [verifying, setVerifying] = useState(false);
  // Refer & Earn Phase 2 — spendable RC + apply-at-checkout toggle. Same
  // shape + behaviour as the web pricing page. Reads only the available
  // (unlocked + unexpired) balance, since that's the only figure that
  // can actually be spent.
  const [availableRc, setAvailableRc] = useState(0);
  const [applyRc, setApplyRc] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setAvailableRc(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const {data} = await supabase
          .from('v_reward_credits_available_balance')
          .select('available_balance')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled) setAvailableRc(data?.available_balance || 0);
      } catch {
        if (!cancelled) setAvailableRc(0);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-run after a successful upgrade so the toggle reflects the
    // newly-reduced balance.
  }, [user?.id, successPlan]);

  // refreshProfile gets a new reference every time AuthContext re-renders
  // (which happens *because* we call it during polling). Stashing it in
  // a ref lets the polling loop call the latest version without re-running
  // the effect that owns the loop.
  const refreshProfileRef = useRef(refreshProfile);
  refreshProfileRef.current = refreshProfile;

  const currentPlan = profile?.subscription_plan || 'free';
  const createdAt = profile?.created_at
    ? new Date(profile.created_at)
    : new Date();
  const daysLeft = Math.max(
    0,
    TRIAL_DAYS -
      Math.floor(
        (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
      ),
  );
  const expired = daysLeft === 0;

  const currentPlans = PLANS[billing];

  // Step 1 — user taps Upgrade on a plan card. Open the gateway picker.
  const handleUpgrade = (plan: Plan) => {
    if (upgrading || verifying) return;
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to upgrade your plan.');
      return;
    }
    setPickerPlan(plan);
  };

  // Step 2 — user picked a gateway in the modal. Kick off the actual
  // checkout for that gateway. setUpgrading shows the spinner on the
  // plan card; the picker modal closes.
  const handleGatewayPick = async (gateway: 'stripe' | 'razorpay') => {
    const plan = pickerPlan;
    if (!plan) return;
    setPickerPlan(null);
    setUpgrading(plan.id);
    try {
      if (gateway === 'razorpay') {
        await startRazorpay(plan);
      } else {
        await startStripe(plan);
      }
    } catch (err: any) {
      Alert.alert(
        "Couldn't start checkout",
        err?.message || 'Something went wrong. Please try again in a moment.',
      );
    } finally {
      setUpgrading(null);
    }
  };

  // After payment succeeds we poll the profile for up to 12s so the
  // banner / plan card updates the moment the webhook lands. Identical
  // pattern + ceiling to the web pricing page.
  const runVerify = async () => {
    setVerifying(true);
    const deadline = Date.now() + 12_000;
    while (Date.now() < deadline) {
      try {
        await refreshProfileRef.current?.();
      } catch (e) {
        console.warn('refreshProfile during verify failed:', e);
      }
      await new Promise(r => setTimeout(r, 1500));
    }
    setVerifying(false);
  };

  const startRazorpay = async (plan: Plan) => {
    // Send the actual razorpay plan id — the edge function no longer
    // resolves it from env, unlike the earlier assumption in this file.
    const razorpayPlanId =
      PLAN_RAZORPAY_IDS[plan.id as PlanId]?.[billing];
    if (!razorpayPlanId) {
      throw new Error(
        `Razorpay isn't configured for the ${plan.id} ${billing} plan. Set NEXT_PUBLIC_RAZORPAY_PLAN_${plan.id.toUpperCase()}_${billing.toUpperCase()} in .env and rebuild.`,
      );
    }
    const planPriceRupees =
      billing === 'annual'
        ? PLAN_PRICING[plan.id as PlanId]?.annual
        : PLAN_PRICING[plan.id as PlanId]?.monthly;
    const contact = formatPhoneForRazorpay(profile?.phone);
    const created = await invokeFn<{
      subscription_id?: string;
      key_id?: string;
      error?: string;
    }>('razorpay-checkout', {
      userId: user?.id,
      planId: razorpayPlanId,
      plan: plan.id,
      cycle: billing,
      email: profile?.email || '',
      name: profile?.full_name || '',
      contact,
      applyRc: applyRc && availableRc > 0,
      planPriceRupees,
    });
    if (created?.error) throw new Error(created.error);
    if (!created?.subscription_id || !created?.key_id) {
      throw new Error("Razorpay didn't return a subscription / key.");
    }

    // Razorpay's native checkout sheet. Success / failure come back as a
    // resolved / rejected promise; the webhook is still the source of
    // truth for the row update — handler() just routes us into the
    // verifying overlay.
    try {
      await RazorpayCheckout.open({
        key: created.key_id,
        subscription_id: created.subscription_id,
        name: 'RGossips',
        description: `Upgrade to ${plan.name} · ${billing}`,
        prefill: {
          email: profile?.email || '',
          contact,
          name: profile?.full_name || '',
        },
        notes: {
          user_id: String(user?.id || ''),
          plan: plan.id,
          cycle: billing,
        },
        theme: {color: '#5851DB'},
      });
      // Promise resolved → payment succeeded → start the post-payment
      // poll loop.
      await runVerify();
      setSuccessPlan(plan.id);
    } catch (err: any) {
      // Razorpay error codes — 0 / undefined typically means the user
      // dismissed the sheet without paying; treat that as a silent
      // cancel rather than a hard error.
      if (err?.code !== 0 && err?.code !== undefined) {
        throw new Error(err?.description || 'Payment failed.');
      }
    }
  };

  const startStripe = async (plan: Plan) => {
    const priceId = PLAN_STRIPE_PRICES[plan.id as PlanId]?.[billing];
    if (!priceId) {
      throw new Error(
        `Stripe isn't configured for the ${plan.id} ${billing} plan. Set NEXT_PUBLIC_STRIPE_PRICE_${plan.id.toUpperCase()}_${billing.toUpperCase()} in .env and rebuild.`,
      );
    }
    const planPriceRupees =
      billing === 'annual'
        ? PLAN_PRICING[plan.id as PlanId]?.annual
        : PLAN_PRICING[plan.id as PlanId]?.monthly;
    const created = await invokeFn<{url?: string; error?: string}>(
      'stripe-checkout',
      {
        userId: user?.id,
        priceId,
        plan: plan.id,
        cycle: billing,
        email: profile?.email || '',
        origin: STRIPE_RETURN_ORIGIN,
        applyRc: applyRc && availableRc > 0,
        planPriceRupees,
      },
    );
    if (created?.error) throw new Error(created.error);
    if (!created?.url) throw new Error("Stripe didn't return a checkout URL.");

    // Open Stripe's hosted Checkout in an in-app browser. openAuth is
    // *supposed* to intercept the navigation to STRIPE_RETURN_URL_PREFIX
    // and resolve with the URL — that works cleanly on iOS via
    // ASWebAuthenticationSession.
    //
    // On Android (Chrome Custom Tabs), Chrome's security model often
    // blocks the JS-initiated redirect away from a hosted Stripe page to
    // a custom-scheme URL — the user sees `com.rgossips://…` flash in the
    // address bar and the tab stays open. We work around it by *also*
    // listening for the URL via React Native's Linking module. Whenever
    // the OS does manage to fire the intent-filter (some Android versions
    // / browsers still hand it off cleanly even when Chrome misbehaves
    // visually), the listener catches it, we dismiss the tab, and we
    // process the success the same way. Whichever path fires first wins.
    if (!(await InAppBrowser.isAvailable())) {
      throw new Error(
        'No in-app browser is available on this device. Update Chrome / Safari and try again.',
      );
    }

    const linkPromise = new Promise<{url: string} | null>(resolve => {
      const sub = Linking.addEventListener('url', (event: {url: string}) => {
        if (event.url?.startsWith(STRIPE_RETURN_ORIGIN)) {
          sub.remove();
          // Close the tab if it's still open (best-effort — no-op on iOS
          // where ASWebAuthenticationSession owns its lifecycle).
          try { InAppBrowser.close(); } catch {}
          try { InAppBrowser.closeAuth(); } catch {}
          resolve({url: event.url});
        }
      });
      // Linking subscription needs an out — when openAuth resolves first,
      // we still want to release the listener cleanly.
      (linkPromise as any).__sub = sub;
    });

    const authPromise = InAppBrowser.openAuth(
      created.url,
      STRIPE_RETURN_URL_PREFIX,
      {
        ephemeralWebSession: true,
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
      },
    ).then(r => {
      // Drop the link listener since openAuth handled it.
      try { (linkPromise as any).__sub?.remove(); } catch {}
      return r;
    });

    const winner = await Promise.race([authPromise, linkPromise]);
    // Normalise both shapes to a single { type, url } for downstream code.
    const result: {type: string; url?: string} =
      winner && 'type' in winner
        ? (winner as any)
        : winner && (winner as any).url
          ? {type: 'success', url: (winner as any).url}
          : {type: 'cancel'};

    if (result.type === 'success' && result.url) {
      try {
        const u = new URL(result.url);
        if (u.searchParams.get('success') === '1') {
          await runVerify();
          setSuccessPlan(plan.id);
        }
        // canceled=1 or anything else: user backed out; no-op.
      } catch {
        // URL parse failed — be safe and still kick off a verify in case
        // the redirect did happen; worst case the row didn't change and
        // the banner stays where it was.
        await runVerify();
      }
    }
  };

  const planOrder = [
    'free',
    'starter',
    'pro',
    'elite',
    'starter_annual',
    'pro_annual',
    'elite_annual',
  ];
  const isUpgrade = (planId: string) =>
    planOrder.indexOf(planId) > planOrder.indexOf(currentPlan);

  return (
    <InfluencerLayout>
      <ScrollView className="flex-1" style={{backgroundColor: '#F5F4F8'}}>
        {/* Header */}
        <View className="bg-white px-5 py-4 flex-row items-center border-b border-slate-100" style={{gap: 12}}>
          <Pressable
            onPress={() => navigation.goBack()}
            className="p-2 rounded-xl">
            <ChevronLeft size={20} color="#475569" />
          </Pressable>
          <View>
            <Text className="text-lg font-bold text-slate-900">
              Choose Your Plan
            </Text>
            <Text className="text-xs text-slate-500">
              Upgrade anytime to unlock more features
            </Text>
          </View>
        </View>

        <View
          style={{
            // iOS renders the same numeric padding slightly tighter
            // because of how its safe-area + font metrics combine, so
            // give the packages section a touch more breathing room.
            paddingHorizontal: Platform.OS === 'ios' ? 20 : 16,
            paddingVertical: Platform.OS === 'ios' ? 28 : 24,
            gap: Platform.OS === 'ios' ? 28 : 20,
          }}>
          {/* Current Plan Card */}
          <View className="bg-white p-5 rounded-3xl border border-slate-100">
            <View className="flex-row items-center" style={{gap: 12}}>
              <View className="p-3 bg-purple-50 rounded-2xl">
                <Crown size={24} color="#9333EA" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center" style={{gap: 8}}>
                  <Text className="text-lg font-bold text-slate-900">
                    {currentPlan === 'free'
                      ? 'Free Trial'
                      : currentPlan
                          .replace('_', ' ')
                          .replace(/\b\w/g, c => c.toUpperCase())}
                  </Text>
                  <View className="bg-purple-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-purple-700">
                      CURRENT
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-slate-500 mt-0.5">
                  {currentPlan === 'free'
                    ? expired
                      ? 'Your free trial has expired'
                      : `${daysLeft} days remaining`
                    : `Active ${billing} subscription`}
                </Text>
              </View>
            </View>
          </View>

          {/* Billing Toggle — explicit paddingHorizontal/paddingVertical on
              the TouchableOpacity (instead of className-driven sizing on
              the inner gradient) so the active and inactive pills render
              at exactly the same height on iOS. Gradient is an absolute
              background fill behind the label, matching the gradient-
              button pattern used everywhere else in the app. */}
          <View className="items-center">
            <View className="flex-row bg-white rounded-full border border-slate-200 p-1">
              <TouchableOpacity
                onPress={() => setBilling('monthly')}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 999,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {billing === 'monthly' && (
                  <LinearGradient
                    colors={['#9810FA', '#E60076']}
                    style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                  />
                )}
                <Text
                  className={`text-sm font-bold ${
                    billing === 'monthly' ? 'text-white' : 'text-slate-500'
                  }`}>
                  Monthly
                </Text>
              </TouchableOpacity>
              {/* Wrap the button + the SAVE badge so the badge can sit
                  outside the button's clipped bounds. */}
              <View className="relative">
                <TouchableOpacity
                  onPress={() => setBilling('annual')}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    borderRadius: 999,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {billing === 'annual' && (
                    <LinearGradient
                      colors={['#9810FA', '#E60076']}
                      style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                    />
                  )}
                  <Text
                    className={`text-sm font-bold ${
                      billing === 'annual' ? 'text-white' : 'text-slate-500'
                    }`}>
                    Annual
                  </Text>
                </TouchableOpacity>
                <View
                  pointerEvents="none"
                  className="absolute bg-red-500 px-2 py-0.5 rounded-full"
                  style={{
                    top: -10,
                    right: -14,
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    shadowOffset: {width: 0, height: 2},
                    elevation: 3,
                  }}>
                  <Text className="text-[8px] text-white font-black">
                    SAVE 20%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* RC redemption toggle — same server-side cap (50% of plan price
              + capped at available balance) as the web pricing page. */}
          {availableRc > 0 && (
            <Pressable
              onPress={() => setApplyRc(v => !v)}
              className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 mt-4 self-center"
              style={{gap: 12}}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: applyRc ? '#5851DB' : '#CBD5E1',
                  backgroundColor: applyRc ? '#5851DB' : 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {applyRc && <Check size={12} color="white" />}
              </View>
              <Text className="text-[13px] font-semibold text-slate-700">
                Apply my{' '}
                <Text className="text-[#5851DB] font-black">
                  {availableRc} RC
                </Text>{' '}
                at checkout{'  '}
                <Text className="text-[10px] text-slate-400 font-normal">
                  (up to 50% off first invoice)
                </Text>
              </Text>
            </Pressable>
          )}

          {/* Plan Cards */}
          {currentPlans.map(plan => {
            const isActive = currentPlan === plan.id;
            const isSuccess = successPlan === plan.id;
            const isLoading = upgrading === plan.id;

            return (
              <View key={plan.id} className="relative">
                {plan.popular && (
                  <View className="absolute -top-3 self-center z-10 bg-pink-500 px-4 py-1.5 rounded-full shadow-lg">
                    <Text className="text-[10px] text-white font-black uppercase tracking-wider">
                      Most Popular
                    </Text>
                  </View>
                )}
                {isActive && (
                  <View className="absolute -top-3 self-center z-10 bg-purple-600 px-4 py-1.5 rounded-full shadow-lg">
                    <Text className="text-[10px] text-white font-black uppercase tracking-wider">
                      Current Plan
                    </Text>
                  </View>
                )}

                {plan.popular ? (
                  // Padding lives on the wrapper View so the Pro card
                  // sizes consistently on iOS. The LinearGradient is an
                  // absolute background fill behind the content — same
                  // pattern as the rest of the app's gradient surfaces.
                  <View
                    style={{
                      borderRadius: 24,
                      padding: 24,
                      overflow: 'hidden',
                    }}>
                    <LinearGradient
                      colors={['#6C4DFF', '#3F2B96']}
                      style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                    />
                    <PlanCardContent
                      plan={plan}
                      isActive={isActive}
                      isSuccess={isSuccess}
                      isLoading={isLoading}
                      isUpgrade={isUpgrade(plan.id)}
                      onUpgrade={() => handleUpgrade(plan)}
                      popular
                    />
                  </View>
                ) : (
                  <View
                    className={`rounded-3xl p-6 bg-white border ${
                      isActive
                        ? 'border-2 border-purple-300'
                        : 'border-slate-100'
                    }`}>
                    <PlanCardContent
                      plan={plan}
                      isActive={isActive}
                      isSuccess={isSuccess}
                      isLoading={isLoading}
                      isUpgrade={isUpgrade(plan.id)}
                      onUpgrade={() => handleUpgrade(plan)}
                    />
                  </View>
                )}
              </View>
            );
          })}

          {/* FAQ */}
          <View className="bg-white p-6 rounded-3xl border border-slate-100" style={{gap: 16}}>
            <Text className="text-lg font-bold text-slate-900">
              Frequently Asked Questions
            </Text>
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes! You can upgrade or change your plan at any time. Your new plan takes effect immediately.',
              },
              {
                q: 'What happens when my free trial ends?',
                a: "You'll be moved to limited access. Upgrade to any plan to continue using all features.",
              },
              {
                q: 'Can I cancel my subscription?',
                a: "Yes, you can cancel anytime. You'll continue to have access until the end of your billing period.",
              },
            ].map(faq => (
              <View key={faq.q}>
                <Text className="text-sm font-semibold text-slate-800">
                  {faq.q}
                </Text>
                <Text className="text-xs text-slate-500 mt-1">{faq.a}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      <GatewayPickerModal
        visible={!!pickerPlan}
        planLabel={pickerPlan?.name || ''}
        onCancel={() => setPickerPlan(null)}
        onPick={handleGatewayPick}
      />
      <VerifyingOverlay visible={verifying} />
    </InfluencerLayout>
  );
}

function PlanCardContent({
  plan,
  isActive,
  isSuccess,
  isLoading,
  isUpgrade,
  onUpgrade,
  popular = false,
}: {
  plan: Plan;
  isActive: boolean;
  isSuccess: boolean;
  isLoading: boolean;
  isUpgrade: boolean;
  onUpgrade: () => void;
  popular?: boolean;
}) {
  return (
    <View style={{gap: 16}}>
      {/* Header */}
      <View className="flex-row items-center" style={{gap: 12}}>
        <PlanIcon
          name={plan.iconName}
          color={popular ? 'white' : '#9333EA'}
        />
        <Text
          className={`text-2xl font-extrabold ${popular ? 'text-white' : 'text-slate-900'}`}>
          {plan.name}
        </Text>
      </View>
      <Text
        className={`text-xs ${popular ? 'text-indigo-200' : 'text-slate-500'}`}>
        {plan.tagline}
      </Text>

      {/* Price */}
      <View className="flex-row items-baseline" style={{gap: 4}}>
        <Text
          className={`text-5xl font-black ${popular ? 'text-white' : 'text-slate-900'}`}>
          ₹{plan.price}
        </Text>
        <Text
          className={`text-sm font-bold ${popular ? 'text-indigo-200' : 'text-slate-400'}`}>
          {plan.period}
        </Text>
      </View>

      {plan.savings && (
        <View className="self-start bg-green-100 px-2 py-0.5 rounded-full">
          <Text className="text-[10px] font-bold text-green-700">
            {plan.savings}
          </Text>
        </View>
      )}

      <Text
        className={`text-[10px] font-bold uppercase tracking-wide ${popular ? 'text-indigo-200' : 'text-slate-400'}`}>
        {plan.description}
      </Text>

      {/* CTA */}
      <TouchableOpacity
        onPress={isActive ? undefined : onUpgrade}
        disabled={isActive || isLoading}
        activeOpacity={0.9}>
        {isSuccess ? (
          <View className="h-12 rounded-2xl bg-green-500 items-center justify-center">
            <Text className="text-white font-bold text-sm">
              Plan Activated!
            </Text>
          </View>
        ) : isActive ? (
          <View
            className={`h-12 rounded-2xl items-center justify-center ${popular ? 'bg-white/20' : 'bg-slate-100'}`}>
            <Text
              className={`font-bold text-sm ${popular ? 'text-white/60' : 'text-slate-400'}`}>
              Current Plan
            </Text>
          </View>
        ) : popular ? (
          <View className="h-12 rounded-2xl bg-white items-center justify-center shadow-lg">
            {isLoading ? (
              <ActivityIndicator color="#6C4DFF" />
            ) : (
              <Text className="text-purple-700 font-bold text-sm">
                {isUpgrade ? 'Upgrade Now' : 'Switch Plan'}
              </Text>
            )}
          </View>
        ) : (
          // Upgrade / Switch Plan CTA — padding + layout on the wrapper
          // View so the height + horizontal/vertical centering render
          // identically on iOS. Gradient is an absolute background fill
          // behind the label / spinner (same pattern as every other
          // gradient button in the app).
          <View
            style={{
              borderRadius: 16,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-sm">
                {isUpgrade ? 'Upgrade Now' : 'Switch Plan'}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Features */}
      <View
        className={`border-t border-dashed pt-4 ${popular ? 'border-white/20' : 'border-slate-100'}`}
        style={{gap: 10}}>
        {plan.features.map((f, i) => (
          <View key={i} className="flex-row items-start" style={{gap: 8}}>
            <Check
              size={14}
              color={popular ? 'white' : '#9333EA'}
              style={{marginTop: 2}}
            />
            <Text
              className={`text-xs font-semibold flex-1 ${popular ? 'text-white' : 'text-slate-700'}`}>
              {f}
            </Text>
          </View>
        ))}
        {plan.notIncluded.map((f, i) => (
          <View
            key={`ni-${i}`}
            className="flex-row items-start opacity-30"
            style={{gap: 8}}>
            <X
              size={14}
              color={popular ? 'white' : '#475569'}
              style={{marginTop: 2}}
            />
            <Text
              className={`text-xs font-semibold flex-1 ${popular ? 'text-white' : 'text-slate-700'}`}>
              {f}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
