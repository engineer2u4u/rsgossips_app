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
  Image,
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
import {useTranslation} from 'react-i18next';
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
  const {t} = useTranslation();
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
  // Referrer identity while the 50%-off first-subscription is still available —
  // drives the visible "gifted by <name>" banner. null once they've subscribed.
  const [referralDiscount, setReferralDiscount] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) {
      setAvailableRc(0);
      setReferralDiscount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [{data}, {data: refData}] = await Promise.all([
          supabase
            .from('v_reward_credits_available_balance')
            .select('available_balance')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase.rpc('get_my_referrer'),
        ]);
        if (cancelled) return;
        setAvailableRc(data?.available_balance || 0);
        const ref = Array.isArray(refData) ? refData[0] : refData;
        setReferralDiscount(ref && (ref.referrer_name || ref.referrer_username) ? ref : null);
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

  // Renewal approximation for paid plans (mirrors ProStatuscard + web
  // getPlanRenewalInfo): assume the sub renews cycleDays after the last
  // profile update. Stand-in until current_period_end is surfaced.
  const isPaidPlan =
    !!currentPlan && currentPlan !== 'free' && currentPlan !== 'trial';
  const renewalDaysLeft = (() => {
    if (!isPaidPlan || !profile?.updated_at) return null;
    const cycleDays = profile?.billing_cycle === 'annual' ? 365 : 30;
    const start = new Date(profile.updated_at).getTime();
    const elapsed = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, cycleDays - elapsed);
  })();

  const currentPlans = PLANS[billing];

  // Step 1 — user taps Upgrade on a plan card. Open the gateway picker.
  const handleUpgrade = (plan: Plan) => {
    if (upgrading || verifying) return;
    if (!user?.id) {
      Alert.alert(
        t('ScreensInfluencerPricing.alerts.signInRequiredTitle'),
        t('ScreensInfluencerPricing.alerts.signInRequiredBody'),
      );
      return;
    }
    // Razorpay is the only enabled gateway — skip the picker and start
    // checkout directly. Restore `setPickerPlan(plan)` to bring it back.
    handleGatewayPick('razorpay', plan);
  };

  // Step 2 — user picked a gateway in the modal. Kick off the actual
  // checkout for that gateway. setUpgrading shows the spinner on the
  // plan card; the picker modal closes.
  const handleGatewayPick = async (
    gateway: 'stripe' | 'razorpay',
    planOverride?: Plan,
  ) => {
    const plan = planOverride || pickerPlan;
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
        t('ScreensInfluencerPricing.alerts.checkoutFailedTitle'),
        err?.message || t('ScreensInfluencerPricing.alerts.genericError'),
      );
    } finally {
      setUpgrading(null);
    }
  };


  // Post-payment: reconcile + show success with an Open Invoice action.
  //
  // The webhook is the normal source of truth for flipping subscription_plan,
  // but if it's disabled/dropped the plan never updates and prior subs never
  // cancel. reconcile-subscription is the cross-gateway safety net — it asks
  // both Stripe + Razorpay what the user actually has, sets the profile to
  // match, and cancels every other live sub. Idempotent, so it's a no-op when
  // the webhook already did its job. Mirrors the web pricing page.
  const finishSuccess = async (
    planId: string,
    hint?: {preferSubscriptionId?: string; preferGateway?: 'stripe' | 'razorpay'},
  ) => {
    // reconcile is authoritative and fast: when we pass the just-paid sub id
    // it verifies that sub directly against the gateway, so we don't need the
    // old fixed 12s poll (that was the slow loader). Retry only if the new
    // sub isn't visible yet — Razorpay activates asynchronously. Attempt 0
    // runs immediately, so the happy path is ~1s.
    setVerifying(true);
    let keptSubId: string | null = null;
    let reconciled = false;
    for (let attempt = 0; attempt < 4 && !reconciled; attempt++) {
      if (attempt > 0)
        await new Promise<void>(r => {
          setTimeout(() => r(), 1200);
        });
      try {
        const r = await invokeFn<{subscription_id?: string; reconciled?: boolean}>(
          'reconcile-subscription',
          {
            preferSubscriptionId: hint?.preferSubscriptionId || undefined,
            preferGateway: hint?.preferGateway || undefined,
            preferPlan: planId,
          },
        );
        if (r?.reconciled) reconciled = true;
        keptSubId = r?.subscription_id || keptSubId;
      } catch (e) {
        console.warn('reconcile attempt failed:', e);
      }
    }
    try {
      await refreshProfileRef.current?.();
    } catch (e) {
      console.warn('refreshProfile after reconcile failed:', e);
    }
    setVerifying(false);
    setSuccessPlan(planId);

    // Fetch the invoice link (works for both gateways) and offer to open it.
    let invoiceUrl: string | null = null;
    try {
      const hist = await invokeFn<{invoices?: any[]}>('subscription-history', {
        userId: user?.id,
      });
      const invoices = Array.isArray(hist?.invoices) ? hist!.invoices! : [];
      const forSub = keptSubId
        ? invoices.filter(i => i.subscription_id === keptSubId)
        : [];
      const pool = (forSub.length ? forSub : invoices)
        .slice()
        .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      const inv = pool.find(i => i.status === 'paid') || pool[0];
      invoiceUrl = inv ? inv.hosted_url || inv.pdf_url || null : null;
    } catch (e) {
      console.warn('invoice link fetch failed:', e);
    }

    const label = planId
      .replace('_', ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    const buttons: any[] = [];
    if (invoiceUrl) {
      buttons.push({
        text: t('ScreensInfluencerPricing.alerts.openInvoice'),
        onPress: () => Linking.openURL(invoiceUrl as string).catch(() => {}),
      });
    }
    buttons.push({text: t('ScreensInfluencerPricing.alerts.done'), style: 'cancel'});
    Alert.alert(
      t('ScreensInfluencerPricing.alerts.successTitle', {plan: label}),
      t('ScreensInfluencerPricing.alerts.successBody'),
      buttons,
    );
  };

  const startRazorpay = async (plan: Plan) => {
    // Send the actual razorpay plan id — the edge function no longer
    // resolves it from env, unlike the earlier assumption in this file.
    // Annual cards carry ids like `pro_annual`; the config maps and the
    // backend are keyed by the base tier (`pro`) with the cycle passed
    // separately. Strip the suffix before every lookup.
    const baseId = plan.id.replace(/_annual$/, '') as PlanId;
    const razorpayPlanId = PLAN_RAZORPAY_IDS[baseId]?.[billing];
    if (!razorpayPlanId) {
      throw new Error(
        t('ScreensInfluencerPricing.errors.razorpayNotConfigured', {
          plan: baseId,
          cycle: billing,
          planUpper: baseId.toUpperCase(),
          cycleUpper: billing.toUpperCase(),
        }),
      );
    }
    // Source the price from the card the user actually sees so the RC /
    // discount cap can never drift from the displayed amount.
    const planPriceRupees =
      Number(String(plan.price).replace(/[^0-9]/g, '')) ||
      (billing === 'annual'
        ? PLAN_PRICING[baseId]?.annual
        : PLAN_PRICING[baseId]?.monthly);
    // Prefill sources: the influencer_profiles row often has no email/phone
    // (Supabase keeps the canonical email on the auth user), so fall back to
    // user.* — matching the web pricing page. Without this the Razorpay sheet
    // opens with empty email + phone fields.
    const email = profile?.email || user?.email || '';
    const contact = formatPhoneForRazorpay(profile?.phone || user?.phone);
    const name = profile?.full_name || user?.user_metadata?.full_name || '';
    const created = await invokeFn<{
      subscription_id?: string;
      key_id?: string;
      error?: string;
      already_active?: boolean;
    }>('razorpay-checkout', {
      userId: user?.id,
      planId: razorpayPlanId,
      plan: baseId,
      cycle: billing,
      email,
      name,
      contact,
      applyRc: applyRc && availableRc > 0,
      planPriceRupees,
    });
    if (created?.error) throw new Error(created.error);
    if (!created?.subscription_id || !created?.key_id) {
      throw new Error(t('ScreensInfluencerPricing.errors.razorpayNoSub'));
    }

    // Idempotency: the server found this plan is ALREADY active for the user
    // (a prior successful checkout). Don't reopen the sheet — that would
    // collect a second charge. Just verify + reconcile.
    if (created.already_active) {
      await finishSuccess(baseId, {
        preferSubscriptionId: created.subscription_id,
        preferGateway: 'razorpay',
      });
      return;
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
        description: t('ScreensInfluencerPricing.razorpayDescription', {
          plan: t(`ScreensInfluencerPricing.plans.${plan.id}.name`),
          cycle: billing,
        }),
        prefill: {
          email,
          contact,
          name,
        },
        notes: {
          user_id: String(user?.id || ''),
          plan: baseId,
          cycle: billing,
        },
        theme: {color: '#5851DB'},
      });
      // Promise resolved → payment succeeded → reconcile (owns the overlay).
      await finishSuccess(baseId, {
        preferSubscriptionId: created.subscription_id,
        preferGateway: 'razorpay',
      });
    } catch (err: any) {
      // Razorpay error codes — 0 / undefined typically means the user
      // dismissed the sheet without paying; treat that as a silent
      // cancel rather than a hard error.
      if (err?.code !== 0 && err?.code !== undefined) {
        throw new Error(
          err?.description || t('ScreensInfluencerPricing.errors.paymentFailed'),
        );
      }
    }
  };

  const startStripe = async (plan: Plan) => {
    const baseId = plan.id.replace(/_annual$/, '') as PlanId;
    const priceId = PLAN_STRIPE_PRICES[baseId]?.[billing];
    if (!priceId) {
      throw new Error(
        t('ScreensInfluencerPricing.errors.stripeNotConfigured', {
          plan: baseId,
          cycle: billing,
          planUpper: baseId.toUpperCase(),
          cycleUpper: billing.toUpperCase(),
        }),
      );
    }
    const planPriceRupees =
      Number(String(plan.price).replace(/[^0-9]/g, '')) ||
      (billing === 'annual'
        ? PLAN_PRICING[baseId]?.annual
        : PLAN_PRICING[baseId]?.monthly);
    const created = await invokeFn<{url?: string; error?: string}>(
      'stripe-checkout',
      {
        userId: user?.id,
        priceId,
        plan: baseId,
        cycle: billing,
        email: profile?.email || '',
        origin: STRIPE_RETURN_ORIGIN,
        applyRc: applyRc && availableRc > 0,
        planPriceRupees,
      },
    );
    if (created?.error) throw new Error(created.error);
    if (!created?.url) {
      throw new Error(t('ScreensInfluencerPricing.errors.stripeNoUrl'));
    }

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
      throw new Error(t('ScreensInfluencerPricing.errors.noBrowser'));
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
          // Stripe: the client doesn't have the sub id at success time (only
          // the checkout session), so pass the gateway only — reconcile falls
          // back to newest active+paid, which is fine as Stripe activates fast.
          await finishSuccess(baseId, {preferGateway: 'stripe'});
        }
        // canceled=1 or anything else: user backed out; no-op.
      } catch {
        // URL parse failed — be safe and still reconcile in case the redirect
        // did happen; worst case it's a no-op and the banner stays put.
        await finishSuccess(baseId, {preferGateway: 'stripe'});
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
              {t('ScreensInfluencerPricing.header.title')}
            </Text>
            <Text className="text-xs text-slate-500">
              {t('ScreensInfluencerPricing.header.subtitle')}
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
                      ? t('ScreensInfluencerPricing.currentPlan.freeTrial')
                      : currentPlan
                          .replace('_', ' ')
                          .replace(/\b\w/g, c => c.toUpperCase())}
                  </Text>
                  <View className="bg-purple-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-purple-700">
                      {t('ScreensInfluencerPricing.currentPlan.badge')}
                    </Text>
                  </View>
                  {renewalDaysLeft != null && (
                    <View className="bg-blue-50 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-blue-700">
                        {t('ScreensInfluencerPricing.currentPlan.renewsIn', {
                          count: renewalDaysLeft,
                        })}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-slate-500 mt-0.5">
                  {currentPlan === 'free'
                    ? expired
                      ? t('ScreensInfluencerPricing.currentPlan.trialExpired')
                      : t('ScreensInfluencerPricing.currentPlan.daysRemaining', {
                          count: daysLeft,
                        })
                    : t('ScreensInfluencerPricing.currentPlan.activeSubscription', {
                        cycle: billing,
                      })}
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
                  {t('ScreensInfluencerPricing.billing.monthly')}
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
                    {t('ScreensInfluencerPricing.billing.annual')}
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
                    {t('ScreensInfluencerPricing.billing.save')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Referral 50%-off — visible while this referred creator still has
              the first-subscription discount. Applies automatically at checkout
              (takes precedence over RC on that first invoice). */}
          {referralDiscount && (
            <View
              className="flex-row items-center rounded-2xl px-4 py-3 mt-4 self-center"
              style={{
                gap: 12,
                borderWidth: 1,
                borderColor: '#FBCFE8',
                backgroundColor: '#FDF4FF',
                maxWidth: 360,
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#22C55E',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text className="text-white text-base font-black">%</Text>
              </View>
              <View style={{flex: 1}}>
                <Text className="text-[13px] font-black text-slate-900">
                  {t('ScreensInfluencerPricing.referral.title')}
                </Text>
                <View
                  className="flex-row items-center flex-wrap"
                  style={{gap: 5, marginTop: 2}}>
                  <Text className="text-[11px] font-medium text-slate-500">
                    {t('ScreensInfluencerPricing.referral.giftedBy')}
                  </Text>
                  {referralDiscount.referrer_photo ? (
                    <Image
                      source={{uri: referralDiscount.referrer_photo}}
                      style={{width: 16, height: 16, borderRadius: 8}}
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
                      }}>
                      <Text style={{color: 'white', fontSize: 8, fontWeight: '900'}}>
                        {(
                          referralDiscount.referrer_name ||
                          referralDiscount.referrer_username ||
                          '?'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text
                    className="text-[11px] font-black text-slate-800"
                    numberOfLines={1}>
                    {referralDiscount.referrer_name ||
                      `@${referralDiscount.referrer_username}`}
                  </Text>
                  <Text className="text-[10px] font-normal text-slate-400">
                    {t('ScreensInfluencerPricing.referral.autoApplied')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* RC redemption toggle — same server-side cap (50% of plan price
              + capped at available balance) as the web pricing page. Hidden
              while the referral 50%-off is active (it wins on the first
              invoice; the RC stays in the wallet for later). */}
          {availableRc > 0 && !referralDiscount && (
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
                {t('ScreensInfluencerPricing.rc.applyMy')}{' '}
                <Text className="text-[#5851DB] font-black">
                  {t('ScreensInfluencerPricing.rc.amount', {amount: availableRc})}
                </Text>{' '}
                {t('ScreensInfluencerPricing.rc.atCheckout')}{'  '}
                <Text className="text-[10px] text-slate-400 font-normal">
                  {t('ScreensInfluencerPricing.rc.note')}
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
                      {t('ScreensInfluencerPricing.badges.mostPopular')}
                    </Text>
                  </View>
                )}
                {isActive && (
                  <View className="absolute -top-3 self-center z-10 bg-purple-600 px-4 py-1.5 rounded-full shadow-lg">
                    <Text className="text-[10px] text-white font-black uppercase tracking-wider">
                      {t('ScreensInfluencerPricing.badges.currentPlan')}
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
              {t('ScreensInfluencerPricing.faq.title')}
            </Text>
            {[{id: 'switch'}, {id: 'trialEnds'}, {id: 'cancel'}].map(faq => (
              <View key={faq.id}>
                <Text className="text-sm font-semibold text-slate-800">
                  {t(`ScreensInfluencerPricing.faq.${faq.id}.q`)}
                </Text>
                <Text className="text-xs text-slate-500 mt-1">
                  {t(`ScreensInfluencerPricing.faq.${faq.id}.a`)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      <GatewayPickerModal
        visible={!!pickerPlan}
        planLabel={
          pickerPlan
            ? t(`ScreensInfluencerPricing.plans.${pickerPlan.id}.name`)
            : ''
        }
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
  const {t} = useTranslation();
  const features = t(`ScreensInfluencerPricing.plans.${plan.id}.features`, {
    returnObjects: true,
  }) as string[];
  const notIncluded = t(
    `ScreensInfluencerPricing.plans.${plan.id}.notIncluded`,
    {returnObjects: true},
  ) as string[];
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
          {t(`ScreensInfluencerPricing.plans.${plan.id}.name`)}
        </Text>
      </View>
      <Text
        className={`text-xs ${popular ? 'text-indigo-200' : 'text-slate-500'}`}>
        {t(`ScreensInfluencerPricing.plans.${plan.id}.tagline`)}
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
            {t(`ScreensInfluencerPricing.plans.${plan.id}.savings`)}
          </Text>
        </View>
      )}

      <Text
        className={`text-[10px] font-bold uppercase tracking-wide ${popular ? 'text-indigo-200' : 'text-slate-400'}`}>
        {t(`ScreensInfluencerPricing.plans.${plan.id}.description`)}
      </Text>

      {/* CTA */}
      <TouchableOpacity
        onPress={isActive ? undefined : onUpgrade}
        disabled={isActive || isLoading}
        activeOpacity={0.9}>
        {isSuccess ? (
          <View className="h-12 rounded-2xl bg-green-500 items-center justify-center">
            <Text className="text-white font-bold text-sm">
              {t('ScreensInfluencerPricing.cta.planActivated')}
            </Text>
          </View>
        ) : isActive ? (
          <View
            className={`h-12 rounded-2xl items-center justify-center ${popular ? 'bg-white/20' : 'bg-slate-100'}`}>
            <Text
              className={`font-bold text-sm ${popular ? 'text-white/60' : 'text-slate-400'}`}>
              {t('ScreensInfluencerPricing.cta.currentPlan')}
            </Text>
          </View>
        ) : popular ? (
          <View className="h-12 rounded-2xl bg-white items-center justify-center shadow-lg">
            {isLoading ? (
              <ActivityIndicator color="#6C4DFF" />
            ) : (
              <Text className="text-purple-700 font-bold text-sm">
                {isUpgrade
                  ? t('ScreensInfluencerPricing.cta.upgradeNow')
                  : t('ScreensInfluencerPricing.cta.switchPlan')}
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
                {isUpgrade
                  ? t('ScreensInfluencerPricing.cta.upgradeNow')
                  : t('ScreensInfluencerPricing.cta.switchPlan')}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Features */}
      <View
        className={`border-t border-dashed pt-4 ${popular ? 'border-white/20' : 'border-slate-100'}`}
        style={{gap: 10}}>
        {features.map((f, i) => (
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
        {notIncluded.map((f, i) => (
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
