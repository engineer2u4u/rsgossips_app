import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
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
import {useAuth} from '../context/AuthContext';
import {NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY} from '@env';
import InfluencerLayout from '../layouts/InfluencerLayout';

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
  const {profile, user} = useAuth();
  const navigation = useNavigation();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);

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

  const handleUpgrade = async (plan: Plan) => {
    if (upgrading) return;
    setUpgrading(plan.id);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          table: 'influencer_profiles',
          subscriptionPlan: plan.id,
          billingCycle: billing,
        }),
      });
      setSuccessPlan(plan.id);
    } catch {}
    setUpgrading(null);
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
      <ScrollView className="flex-1 bg-[#F8F7FF]">
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

        <View className="px-4 py-6" style={{gap: 20}}>
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

          {/* Billing Toggle */}
          <View className="items-center">
            <View className="flex-row bg-white rounded-full border border-slate-200 p-1">
              <TouchableOpacity
                onPress={() => setBilling('monthly')}
                className="overflow-hidden rounded-full">
                {billing === 'monthly' ? (
                  <LinearGradient
                    colors={['#9810FA', '#E60076']}
                    className="px-6 py-2.5 rounded-full">
                    <Text className="text-sm font-bold text-white">
                      Monthly
                    </Text>
                  </LinearGradient>
                ) : (
                  <View className="px-6 py-2.5">
                    <Text className="text-sm font-bold text-slate-500">
                      Monthly
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBilling('annual')}
                className="overflow-hidden rounded-full relative">
                {billing === 'annual' ? (
                  <LinearGradient
                    colors={['#9810FA', '#E60076']}
                    className="px-6 py-2.5 rounded-full">
                    <Text className="text-sm font-bold text-white">
                      Annual
                    </Text>
                  </LinearGradient>
                ) : (
                  <View className="px-6 py-2.5">
                    <Text className="text-sm font-bold text-slate-500">
                      Annual
                    </Text>
                  </View>
                )}
                <View className="absolute -top-2 -right-4 bg-red-500 px-2 py-0.5 rounded-full">
                  <Text className="text-[8px] text-white font-black">
                    SAVE 20%
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

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
                  <LinearGradient
                    colors={['#6C4DFF', '#3F2B96']}
                    className="rounded-3xl p-6"
                    style={{borderRadius: 24}}>
                    <PlanCardContent
                      plan={plan}
                      isActive={isActive}
                      isSuccess={isSuccess}
                      isLoading={isLoading}
                      isUpgrade={isUpgrade(plan.id)}
                      onUpgrade={() => handleUpgrade(plan)}
                      popular
                    />
                  </LinearGradient>
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
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            style={{borderRadius: 16, height: 48}}
            className="items-center justify-center">
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-sm">
                {isUpgrade ? 'Upgrade Now' : 'Switch Plan'}
              </Text>
            )}
          </LinearGradient>
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
