import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Youtube,
  Smartphone,
  CheckCircle,
  CheckCircle2,
  Clock,
  Star,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  Wallet,
  Gift,
  ShieldCheck,
  Heart,
  Eye,
  BarChart3,
  Bookmark,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import ApplyCampaignForm from '../components/ApplyCampaignForm';
import RatingModal, {type RatingValues} from '../components/RatingModal';
import ApplicationStatusBar from '../components/ApplicationStatusBar';
import BottomNav from '../components/BottomNav';
import {invokeFn} from '../lib/api';
import {supabase} from '../utils/supabase';

// Web audit-field enums → human-label translation-key suffixes. Mirrors the
// maps in the web detail page; resolved via t() at render (see resolveLabel).
const USAGE_KEYS: Record<string, string> = {
  creator_only: 'creator_only',
  brand_repost: 'brand_repost',
  paid_ads: 'paid_ads',
  full_rights: 'full_rights',
};
const KEEPUP_KEYS: Record<string, string> = {
  '24h': '24h',
  '7d': '7d',
  '30d': '30d',
  permanent: 'permanent',
};
const PAYMENT_KEYS: Record<string, string> = {
  advance: 'advance',
  on_approval: 'on_approval',
  '7_days': '7_days',
  '30_days': '30_days',
};
const SHIPPING_KEYS: Record<string, string> = {
  yes: 'yes',
  no: 'no',
  pickup: 'pickup',
};

function PlatformIcon({platform, size = 20}: {platform: string; size?: number}) {
  switch (platform) {
    case 'instagram': return <Instagram size={size} color="#EC4899" />;
    case 'youtube': return <Youtube size={size} color="#EF4444" />;
    case 'tiktok': return <Smartphone size={size} color="#1E293B" />;
    default: return null;
  }
}

function ReqIcon({type}: {type: string}) {
  switch (type) {
    case 'users': return <Users size={16} color="#10B981" />;
    case 'trending': return <TrendingUp size={16} color="#10B981" />;
    case 'star': return <Star size={16} color="#10B981" />;
    default: return <CheckCircle size={16} color="#10B981" />;
  }
}

export default function InfluencerOfferDetail() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {user} = useAuth();
  const {t} = useTranslation();
  const campaignId = route.params?.id;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [myRating, setMyRating] = useState<RatingValues | null>(null);
  const [refetchFlag, setRefetchFlag] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchCampaign = async () => {
      if (!campaignId || !user?.id) return setLoading(false);
      try {
        const data = await invokeFn<{campaigns?: any[]}>('list-campaigns', {
          influencerId: user.id,
        });
        if (cancelled) return;
        const found = data?.campaigns?.find((c: any) => c.id === campaignId);
        if (found) {
          const brandCampaigns =
            data?.campaigns?.filter((c: any) => c.brandName === found.brandName) || [];
          const activeBrand = brandCampaigns.filter(
            (c: any) => c.status === 'Active',
          ).length;

          // Re-derive requirements from the real audit fields the web's
          // list-campaigns now returns (commit c6ef50e).
          const requirements: {icon: string; label: string; sub: string}[] = [];
          if (found.targetFollowerMin > 0 || found.targetFollowerMax > 0) {
            const lo = found.targetFollowerMin
              ? Number(found.targetFollowerMin).toLocaleString('en-IN')
              : '0';
            const hi = found.targetFollowerMax
              ? Number(found.targetFollowerMax).toLocaleString('en-IN')
              : '∞';
            requirements.push({
              icon: 'users',
              label: t('ScreensInfluencerOfferDetail.req.followers', {lo, hi}),
              sub: t('ScreensInfluencerOfferDetail.req.audienceSize'),
            });
          }
          if (found.targetInfluencerTier && found.targetInfluencerTier !== 'all') {
            requirements.push({
              icon: 'trending',
              label: t('ScreensInfluencerOfferDetail.req.tier', {
                tier: found.targetInfluencerTier,
              }),
              sub: t('ScreensInfluencerOfferDetail.req.influencerTier'),
            });
          }
          if (found.minEngagementRate > 0) {
            requirements.push({
              icon: 'trending',
              label: t('ScreensInfluencerOfferDetail.req.minEngagement', {
                rate: found.minEngagementRate,
              }),
              sub: t('ScreensInfluencerOfferDetail.req.audienceInteraction'),
            });
          }
          if (found.location && found.location !== 'Pan India') {
            requirements.push({
              icon: 'star',
              label: t('ScreensInfluencerOfferDetail.req.location', {
                location: found.location,
              }),
              sub: t('ScreensInfluencerOfferDetail.req.targetRegion'),
            });
          }
          if (Array.isArray(found.targetGender) && found.targetGender.length) {
            requirements.push({
              icon: 'users',
              label: t('ScreensInfluencerOfferDetail.req.gender', {
                gender: found.targetGender.join(', '),
              }),
              sub: t('ScreensInfluencerOfferDetail.req.targetGender'),
            });
          }
          if (Array.isArray(found.targetLanguages) && found.targetLanguages.length) {
            requirements.push({
              icon: 'star',
              label: t('ScreensInfluencerOfferDetail.req.language', {
                language: found.targetLanguages.join(', '),
              }),
              sub: t('ScreensInfluencerOfferDetail.req.contentLanguage'),
            });
          }
          if (Array.isArray(found.tags) && found.tags.length) {
            requirements.push({
              icon: 'trending',
              label: t('ScreensInfluencerOfferDetail.req.category', {
                category: found.tags.join(', '),
              }),
              sub: t('ScreensInfluencerOfferDetail.req.targetNiche'),
            });
          }

          setCampaign({
            ...found,
            heroImg:
              found.bannerImage ||
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80',
            about:
              found.description ||
              t('ScreensInfluencerOfferDetail.noDescription'),
            slots: found.maxInfluencers || 0,
            requirements,
            payments: [
              {
                type: 'base',
                label: t('ScreensInfluencerOfferDetail.basePayment'),
                val: found.budget,
                sub: 'Per influencer',
              },
            ],
            brandStats: {
              campaigns: brandCampaigns.length,
              success: t('ScreensInfluencerOfferDetail.activeCount', {
                count: activeBrand,
              }),
              response: t('ScreensInfluencerOfferDetail.responseTime'),
            },
            deliverableIcons: found.deliverables
              ? String(found.deliverables)
                  .split(' + ')
                  .map((d: string) => {
                    const parts = d.split(':');
                    return {
                      platform: 'instagram',
                      count: parts[1] || '1',
                      label: parts[0] || d,
                    };
                  })
              : [],
          });

          // Fetch this user's previously-submitted rating, if any. Only meaningful
          // on Completed campaigns but we always check so the rating CTA / display
          // can update without a second round-trip.
          if (found.applicationId && found.brandId) {
            const {data: ratingRow} = await supabase
              .from('campaign_ratings')
              .select('target_rating, brief_clarity, fairness')
              .eq('application_id', found.applicationId)
              .eq('rater_role', 'influencer')
              .maybeSingle();
            if (!cancelled && ratingRow) {
              setMyRating(ratingRow as RatingValues);
            } else if (!cancelled) {
              setMyRating(null);
            }
          }
        }
      } catch (err) {
        console.warn('list-campaigns (detail) failed:', err);
      }
      if (!cancelled) setLoading(false);
    };
    fetchCampaign();
    return () => {
      cancelled = true;
    };
  }, [campaignId, user?.id, refetchFlag]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center" style={{gap: 12}}>
        <ActivityIndicator size="large" color="#9810FA" />
        <Text className="text-sm font-bold text-slate-400">{t('ScreensInfluencerOfferDetail.loading')}</Text>
      </View>
    );
  }

  if (!campaign) {
    return (
      <View className="flex-1 bg-white items-center justify-center" style={{gap: 12}}>
        <Text className="text-lg font-bold text-slate-600">{t('ScreensInfluencerOfferDetail.notFound')}</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text className="text-sm text-purple-500 font-bold">{t('ScreensInfluencerOfferDetail.goBack')}</Text>
        </Pressable>
      </View>
    );
  }

  const isActive = campaign.status === 'Active';
  const isApplied = campaign.status === 'Applied';
  const isCompleted = campaign.status === 'Completed';
  // A withdrawn/rejected application sends the campaign back to Active and is
  // re-appliable, so it must NOT count as "already applied" — otherwise the
  // apply button stays hidden and the dead status timeline shows. Only
  // non-terminal statuses count as a live application.
  const hasApplied =
    !!campaign.applicationStatus &&
    campaign.applicationStatus !== 'withdrawn' &&
    campaign.applicationStatus !== 'rejected';

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{backgroundColor: '#F5F4F8'}}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View className="relative h-56">
          <Image source={{uri: campaign.heroImg}} className="w-full h-full" resizeMode="cover" />
          <View className="absolute inset-0" style={{backgroundColor: 'rgba(0,0,0,0.3)'}} />

          {/* Top buttons */}
          <View className="absolute top-4 left-4 right-4 flex-row justify-between">
            <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <ChevronLeft size={20} color="white" />
            </Pressable>
            <View className="flex-row" style={{gap: 8}}>
              {isCompleted && (
                <View className="bg-emerald-500 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-[10px] font-bold">{t('ScreensInfluencerOfferDetail.completed')}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Brand badge — shows the brand's logo (rounded tile) when one is
              uploaded, otherwise falls back to a gradient + initials. */}
          {campaign.brandLogo ? (
            <View
              className="absolute bottom-4 left-4 w-14 h-14 rounded-2xl overflow-hidden bg-white items-center justify-center"
              style={{borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)'}}>
              <Image
                source={{uri: campaign.brandLogo}}
                style={{width: '100%', height: '100%'}}
                resizeMode="contain"
              />
            </View>
          ) : (
            <LinearGradient
              colors={['#3B82F6', '#6366F1']}
              className="absolute bottom-4 left-4 w-14 h-14 rounded-2xl items-center justify-center"
              style={{borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)'}}>
              <Text className="text-white text-xl font-bold">
                {campaign.initials || campaign.title?.substring(0, 2)?.toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        </View>

        <View className="px-5 py-5" style={{gap: 20}}>
          {/* Title */}
          <View>
            <Text className="text-xl font-black text-slate-900 mb-1">{campaign.title}</Text>
            <View className="flex-row items-center" style={{gap: 4}}>
              <Text className="text-sm text-slate-400 font-medium">{campaign.brandName}</Text>
              <CheckCircle2 size={14} color="#3B82F6" />
            </View>
          </View>

          {/* Application status tracker — surfaced as the first card so the
              influencer immediately sees where their application stands. */}
          {hasApplied && campaign.applicationStatus ? (
            <ApplicationStatusBar
              status={campaign.applicationStatus}
              campaign={campaign}
              refetch={() => setRefetchFlag(f => f + 1)}
            />
          ) : null}

          {/* Budget / Deadline / Slots pills */}
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            <View className="flex-row items-center bg-emerald-50 px-4 py-2.5 rounded-2xl" style={{gap: 8}}>
              <View className="w-8 h-8 bg-emerald-500 rounded-xl items-center justify-center">
                <Text className="text-white text-xs font-bold">₹</Text>
              </View>
              <View>
                <Text className="text-xs font-black text-slate-800">{campaign.budget}</Text>
                <Text className="text-[9px] text-slate-400">{t('ScreensInfluencerOfferDetail.budget')}</Text>
              </View>
            </View>
            {campaign.deadline && (
              <View className="flex-row items-center bg-red-50 px-4 py-2.5 rounded-2xl" style={{gap: 8}}>
                <View className="w-8 h-8 bg-red-100 rounded-xl items-center justify-center">
                  <Calendar size={14} color="#EF4444" />
                </View>
                <View>
                  <Text className="text-xs font-black text-slate-800">{campaign.deadline}</Text>
                  <Text className="text-[9px] text-red-400">{t('ScreensInfluencerOfferDetail.daysLeft', {value: campaign.daysLeft})}</Text>
                </View>
              </View>
            )}
            {campaign.slots > 0 && (
              <View className="flex-row items-center bg-purple-50 px-4 py-2.5 rounded-2xl" style={{gap: 8}}>
                <View className="w-8 h-8 bg-purple-100 rounded-xl items-center justify-center">
                  <Users size={14} color="#9810FA" />
                </View>
                <View>
                  <Text className="text-xs font-black text-slate-800">{t('ScreensInfluencerOfferDetail.slots', {count: campaign.slots})}</Text>
                  <Text className="text-[9px] text-slate-400">{t('ScreensInfluencerOfferDetail.available')}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Content Deliverables */}
          {campaign.deliverableIcons?.length > 0 && (
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <Text className="text-base font-bold text-slate-800 mb-4">{t('ScreensInfluencerOfferDetail.contentDeliverables')}</Text>
              <View className="flex-row" style={{gap: 10}}>
                {campaign.deliverableIcons.map((d: any, i: number) => (
                  <View key={i} className="flex-1 items-center bg-slate-50 rounded-2xl p-4" style={{gap: 6}}>
                    <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                      <PlatformIcon platform={d.platform} />
                    </View>
                    <Text className="text-2xl font-black text-slate-800">{d.count}</Text>
                    <Text className="text-[10px] font-bold text-slate-400">{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* About Campaign */}
          <View style={{gap: 8}}>
            <Text className="text-base font-bold text-slate-800">{t('ScreensInfluencerOfferDetail.aboutCampaign')}</Text>
            <Text className="text-sm text-slate-500 leading-relaxed">{campaign.about}</Text>
          </View>

          {/* Product / Service info (web c6ef50e) */}
          {(campaign.offeringType === 'service' ||
            campaign.productName ||
            campaign.productValue > 0 ||
            campaign.shippingRequired) && (
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" style={{gap: 10}}>
              <Text className="text-base font-bold text-slate-800">
                {campaign.offeringType === 'service'
                  ? t('ScreensInfluencerOfferDetail.serviceDetails')
                  : t('ScreensInfluencerOfferDetail.productDetails')}
              </Text>
              {campaign.productName ? (
                <Text className="text-sm font-semibold text-slate-700">
                  {campaign.productName}
                </Text>
              ) : null}
              <View className="flex-row flex-wrap" style={{gap: 8}}>
                {campaign.offeringType === 'service' && campaign.serviceLocation ? (
                  <View className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Text className="text-[11px] text-slate-600 font-semibold">
                      📍 {campaign.serviceLocation}
                    </Text>
                  </View>
                ) : null}
                {campaign.offeringType !== 'service' && campaign.shippingRequired ? (
                  <View className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Text className="text-[11px] text-slate-600 font-semibold">
                      {SHIPPING_KEYS[campaign.shippingRequired]
                        ? t(`ScreensInfluencerOfferDetail.shipping.${SHIPPING_KEYS[campaign.shippingRequired]}`)
                        : campaign.shippingRequired}
                      {campaign.shippingTimelineDays > 0
                        ? t('ScreensInfluencerOfferDetail.shippingDays', {days: campaign.shippingTimelineDays})
                        : ''}
                    </Text>
                  </View>
                ) : null}
                {campaign.productValue > 0 ? (
                  <View className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <Text className="text-[11px] text-emerald-700 font-bold">
                      {t('ScreensInfluencerOfferDetail.productValue', {value: Number(campaign.productValue).toLocaleString('en-IN')})}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* What you get (Compensation) */}
          {campaign.barterCompensation ? (
            <View className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100" style={{gap: 8}}>
              <Text className="text-base font-bold text-emerald-800">{t('ScreensInfluencerOfferDetail.whatYouGet')}</Text>
              <Text className="text-sm text-emerald-900 leading-relaxed">
                {campaign.barterCompensation}
              </Text>
              {campaign.productValue > 0 ? (
                <Text className="text-[11px] text-emerald-700 font-bold">
                  {t('ScreensInfluencerOfferDetail.approxValue', {value: Number(campaign.productValue).toLocaleString('en-IN')})}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Content Guidelines */}
          {(campaign.contentDos ||
            campaign.contentDonts ||
            campaign.requiredHashtags ||
            campaign.brandHandlesToTag) && (
            <View style={{gap: 10}}>
              <Text className="text-base font-bold text-slate-800">{t('ScreensInfluencerOfferDetail.contentGuidelines')}</Text>
              {campaign.contentDos ? (
                <View className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <Text className="text-xs font-bold text-green-700 uppercase mb-1">
                    {t('ScreensInfluencerOfferDetail.mustInclude')}
                  </Text>
                  <Text className="text-sm text-green-900 leading-relaxed">
                    {campaign.contentDos}
                  </Text>
                </View>
              ) : null}
              {campaign.contentDonts ? (
                <View className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <Text className="text-xs font-bold text-red-700 uppercase mb-1">
                    {t('ScreensInfluencerOfferDetail.mustAvoid')}
                  </Text>
                  <Text className="text-sm text-red-900 leading-relaxed">
                    {campaign.contentDonts}
                  </Text>
                </View>
              ) : null}
              {campaign.requiredHashtags ? (
                <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {t('ScreensInfluencerOfferDetail.requiredHashtags')}
                  </Text>
                  <Text className="text-sm font-mono text-slate-800">
                    {campaign.requiredHashtags}
                  </Text>
                </View>
              ) : null}
              {campaign.brandHandlesToTag ? (
                <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {t('ScreensInfluencerOfferDetail.tagTheseHandles')}
                  </Text>
                  <Text className="text-sm font-mono text-slate-800">
                    {campaign.brandHandlesToTag}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Terms & Rights */}
          {(campaign.usageRights ||
            campaign.keepupDuration ||
            campaign.exclusivityDays ||
            campaign.paymentTimeline) && (
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" style={{gap: 8}}>
              <Text className="text-base font-bold text-slate-800">{t('ScreensInfluencerOfferDetail.termsRights')}</Text>
              {campaign.usageRights ? (
                <Row
                  k={t('ScreensInfluencerOfferDetail.usage')}
                  v={
                    USAGE_KEYS[campaign.usageRights]
                      ? t(`ScreensInfluencerOfferDetail.usageLabels.${USAGE_KEYS[campaign.usageRights]}`)
                      : campaign.usageRights
                  }
                />
              ) : null}
              {campaign.keepupDuration ? (
                <Row
                  k={t('ScreensInfluencerOfferDetail.keepUp')}
                  v={
                    KEEPUP_KEYS[campaign.keepupDuration]
                      ? t(`ScreensInfluencerOfferDetail.keepupLabels.${KEEPUP_KEYS[campaign.keepupDuration]}`)
                      : campaign.keepupDuration
                  }
                />
              ) : null}
              {campaign.exclusivityDays && String(campaign.exclusivityDays) !== '0' ? (
                <Row
                  k={t('ScreensInfluencerOfferDetail.exclusivity')}
                  v={t('ScreensInfluencerOfferDetail.exclusivityDays', {days: campaign.exclusivityDays})}
                />
              ) : null}
              {campaign.paymentTimeline ? (
                <Row
                  k={t('ScreensInfluencerOfferDetail.payment')}
                  v={
                    PAYMENT_KEYS[campaign.paymentTimeline]
                      ? t(`ScreensInfluencerOfferDetail.paymentLabels.${PAYMENT_KEYS[campaign.paymentTimeline]}`)
                      : campaign.paymentTimeline
                  }
                />
              ) : null}
            </View>
          )}

          {/* Rating CTA / submitted rating display (web 12ad173) */}
          {isCompleted && campaign.brandId ? (
            myRating ? (
              <View className="bg-amber-50 rounded-2xl p-5 border border-amber-100" style={{gap: 8}}>
                <Text className="text-base font-bold text-amber-900">
                  {t('ScreensInfluencerOfferDetail.yourRatingFor', {brand: campaign.brandName})}
                </Text>
                <View style={{gap: 4}}>
                  <RatingRow label={t('ScreensInfluencerOfferDetail.overall')} stars={myRating.target_rating || 0} />
                  <RatingRow label={t('ScreensInfluencerOfferDetail.briefClarity')} stars={myRating.brief_clarity || 0} />
                  <RatingRow label={t('ScreensInfluencerOfferDetail.fairness')} stars={myRating.fairness || 0} />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setShowRating(true)}
                className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex-row items-center"
                style={{gap: 12}}>
                <View className="w-10 h-10 bg-amber-500 rounded-xl items-center justify-center">
                  <Star size={20} color="white" fill="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-amber-900">
                    {t('ScreensInfluencerOfferDetail.rateThisCampaign')}
                  </Text>
                  <Text className="text-[11px] text-amber-700">
                    {t('ScreensInfluencerOfferDetail.shareHowItWent', {brand: campaign.brandName})}
                  </Text>
                </View>
                <ChevronRight size={16} color="#92400E" />
              </TouchableOpacity>
            )
          ) : null}

          {/* Requirements */}
          {campaign.requirements && (
            <View style={{gap: 8}}>
              <Text className="text-base font-bold text-slate-800">{t('ScreensInfluencerOfferDetail.requirements')}</Text>
              <View style={{gap: 8}}>
                {campaign.requirements.map((req: any, i: number) => (
                  <View key={i} className="flex-row items-center bg-white p-3.5 rounded-2xl border border-slate-50 shadow-sm" style={{gap: 12}}>
                    <View className="w-9 h-9 bg-emerald-50 rounded-xl items-center justify-center shrink-0">
                      <ReqIcon type={req.icon} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-bold text-slate-800" numberOfLines={2}>{req.label}</Text>
                      <Text className="text-[11px] text-slate-400" numberOfLines={1}>{req.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Payment & Benefits */}
          {campaign.payments && (
            <View style={{gap: 8}}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-slate-800">{t('ScreensInfluencerOfferDetail.paymentBenefits')}</Text>
                <View className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100" style={{gap: 4}}>
                  <ShieldCheck size={12} color="#10B981" />
                  <Text className="text-[10px] font-bold text-emerald-500 uppercase">{t('ScreensInfluencerOfferDetail.verified')}</Text>
                </View>
              </View>
              <View style={{gap: 8}}>
                {campaign.payments.map((p: any, i: number) => (
                  <View key={i} className={`flex-row items-center p-4 rounded-2xl border shadow-sm ${p.type === 'product' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-50'}`} style={{gap: 12}}>
                    <View className={`w-10 h-10 rounded-xl items-center justify-center ${p.type === 'base' ? 'bg-emerald-50' : p.type === 'bonus' ? 'bg-pink-50' : 'bg-purple-50'}`}>
                      {p.type === 'base' ? <Wallet size={18} color="#10B981" /> : p.type === 'bonus' ? <TrendingUp size={18} color="#EC4899" /> : <Gift size={18} color="#9810FA" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold text-slate-400 uppercase">{p.label}</Text>
                      <Text className="text-sm font-black text-slate-800">{p.val}</Text>
                    </View>
                  </View>
                ))}
                {/* Exclusive banner */}
                <View
                  className="flex-row items-center"
                  style={{gap: 12, borderRadius: 16, padding: 16, overflow: 'hidden'}}>
                  <LinearGradient
                    colors={['#34D399', '#10B981']}
                    style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                  />
                  <Gift size={20} color="white" />
                  <View>
                    <Text className="text-sm font-bold text-white">{t('ScreensInfluencerOfferDetail.exclusiveEventRights')}</Text>
                    <Text className="text-[10px] text-emerald-100">{t('ScreensInfluencerOfferDetail.exclusiveEventRightsSub')}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* About Brand */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" style={{gap: 12}}>
            <Text className="text-sm font-bold text-slate-800">{t('ScreensInfluencerOfferDetail.aboutBrand')}</Text>
            <View className="flex-row items-center" style={{gap: 12}}>
              <LinearGradient
                colors={['#3B82F6', '#6366F1']}
                style={{width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center'}}>
                <Text className="text-white text-sm font-bold">{campaign.initials || 'B'}</Text>
              </LinearGradient>
              <View>
                <View className="flex-row items-center" style={{gap: 4}}>
                  <Text className="text-sm font-bold text-slate-800">{campaign.brandName}</Text>
                  <CheckCircle2 size={12} color="#3B82F6" />
                </View>
                <Text className="text-[10px] text-slate-400 mt-0.5">{campaign.tags?.join(', ') || t('ScreensInfluencerOfferDetail.brandFallback')}</Text>
              </View>
            </View>
            {campaign.brandStats && (
              <View className="flex-row" style={{gap: 8}}>
                {[
                  {val: campaign.brandStats.campaigns, label: t('ScreensInfluencerOfferDetail.stats.campaigns')},
                  {val: campaign.brandStats.success, label: t('ScreensInfluencerOfferDetail.stats.success')},
                  {val: campaign.brandStats.response, label: t('ScreensInfluencerOfferDetail.stats.response')},
                ].map((s, i) => (
                  <View key={i} className="flex-1 bg-slate-50 rounded-xl p-2 items-center">
                    <Text className="text-xs font-black text-slate-800">{s.val}</Text>
                    <Text className="text-[8px] font-bold text-slate-400 uppercase">{s.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Completed: Performance + Payment */}
          {isCompleted && campaign.performance && (
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" style={{gap: 12}}>
              <View className="flex-row items-center" style={{gap: 8}}>
                <View className="w-7 h-7 bg-purple-500 rounded-lg items-center justify-center">
                  <BarChart3 size={14} color="white" />
                </View>
                <Text className="font-bold text-slate-900">{t('ScreensInfluencerOfferDetail.performanceHighlights')}</Text>
              </View>
              <View className="flex-row flex-wrap" style={{gap: 8}}>
                {[
                  {icon: Eye, label: t('ScreensInfluencerOfferDetail.metrics.totalViews'), val: campaign.performance.totalViews, bg: 'bg-orange-50', color: '#F97316'},
                  {icon: Heart, label: t('ScreensInfluencerOfferDetail.metrics.engagement'), val: campaign.performance.engagement, bg: 'bg-emerald-50', color: '#10B981'},
                  {icon: Users, label: t('ScreensInfluencerOfferDetail.metrics.reach'), val: campaign.performance.reach, bg: 'bg-blue-50', color: '#3B82F6'},
                  {icon: Bookmark, label: t('ScreensInfluencerOfferDetail.metrics.saves'), val: campaign.performance.saves, bg: 'bg-amber-50', color: '#F59E0B'},
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <View key={i} className={`flex-1 min-w-[45%] ${m.bg} rounded-xl p-3`}>
                      <View className="flex-row items-center mb-1" style={{gap: 4}}>
                        <Icon size={12} color={m.color} />
                        <Text className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</Text>
                      </View>
                      <Text className="text-lg font-black text-slate-900">{m.val}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {isCompleted && campaign.paymentAmount && (
            <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex-row items-center justify-between">
              <View className="flex-row items-center" style={{gap: 12}}>
                <View className="w-9 h-9 bg-emerald-500 rounded-full items-center justify-center">
                  <CheckCircle size={18} color="white" />
                </View>
                <View>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">{t('ScreensInfluencerOfferDetail.paymentStatus')}</Text>
                  <Text className="text-sm font-black text-emerald-600">{campaign.paymentStatus}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">{t('ScreensInfluencerOfferDetail.earnings')}</Text>
                <Text className="text-xl font-black text-slate-900">{campaign.paymentAmount}</Text>
              </View>
            </View>
          )}

          {/* Brand Feedback (completed) */}
          {isCompleted && campaign.brandFeedback && (
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" style={{gap: 12}}>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-800">{t('ScreensInfluencerOfferDetail.brandFeedback')}</Text>
                <View className="flex-row" style={{gap: 2}}>
                  {[...Array(campaign.brandFeedback.rating || 5)].map((_: any, i: number) => (
                    <Star key={i} size={12} color="#FBBF24" fill="#FBBF24" />
                  ))}
                </View>
              </View>
              <Text className="text-xs text-slate-500 italic leading-relaxed">{campaign.brandFeedback.text}</Text>
            </View>
          )}
        </View>

        {/* Bottom spacer — clears the floating nav pill, plus extra padding
            when the Apply CTA is also stacked above it. */}
        <View style={{height: isActive && !hasApplied ? 220 : 110}} />
      </ScrollView>

      {/* Mobile floating action bar — stacks just above the glass nav pill.
          BottomNav: pill height 68 + bottom offset (14 Android / 24 iOS).
          We add an 8px gap so the CTA visually sits on top of the pill. */}
      {isActive && !hasApplied && (
        <View
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: (Platform.OS === 'ios' ? 24 : 14) + 68 + 8,
            zIndex: 60,
          }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowApplyForm(true)}
            className="flex-row items-center justify-center"
            style={{borderRadius: 16, height: 48, overflow: 'hidden'}}>
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Text className="text-white font-bold text-sm">{t('ScreensInfluencerOfferDetail.applyForCampaign')}</Text>
            <ChevronRight size={16} color="white" style={{marginLeft: 4}} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </View>

      {/* Apply Form Modal */}
      <ApplyCampaignForm
        visible={showApplyForm}
        onClose={() => setShowApplyForm(false)}
        campaignData={campaign}
        onSubmitSuccess={() => {
          setShowApplyForm(false);
          setRefetchFlag(f => f + 1);
        }}
      />

      {/* Rating Modal — completed campaigns only */}
      {campaign?.applicationId && campaign?.brandId ? (
        <RatingModal
          visible={showRating}
          onClose={() => setShowRating(false)}
          applicationId={campaign.applicationId}
          campaignId={campaign.id}
          brandId={campaign.brandId}
          influencerId={user?.id || ''}
          title={t('ScreensInfluencerOfferDetail.rateThisCampaign')}
          subtitle={t('ScreensInfluencerOfferDetail.howWasWorkingWith', {brand: campaign.brandName})}
          sections={[
            {key: 'target_rating', label: t('ScreensInfluencerOfferDetail.howWouldYouRate', {brand: campaign.brandName})},
            {
              key: 'brief_clarity',
              label: t('ScreensInfluencerOfferDetail.briefClarity'),
              helper: t('ScreensInfluencerOfferDetail.briefClarityHelper'),
            },
            {
              key: 'fairness',
              label: t('ScreensInfluencerOfferDetail.fairness'),
              helper: t('ScreensInfluencerOfferDetail.fairnessHelper'),
            },
          ]}
          onSaved={values => {
            setMyRating(values);
            setShowRating(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Row({k, v}: {k: string; v: string}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-xs font-bold text-slate-400 uppercase">{k}</Text>
      <Text className="text-sm font-semibold text-slate-800 flex-1 text-right ml-3">
        {v}
      </Text>
    </View>
  );
}

function RatingRow({label, stars}: {label: string; stars: number}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs text-amber-900">{label}</Text>
      <View className="flex-row" style={{gap: 2}}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={12}
            color="#F59E0B"
            fill={i <= stars ? '#F59E0B' : 'transparent'}
          />
        ))}
      </View>
    </View>
  );
}
