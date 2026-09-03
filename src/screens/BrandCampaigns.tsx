// Brand campaigns list.
//
// Real `brand-campaigns` (action="list") data, tabbed by status. Cards open
// BrandCampaignDetail. The Post Request floating button stays as a stub for
// now — the full create-campaign form (~25 fields, web commit df31bb1) is
// its own batch.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ArrowRight, ArrowUpRight, Plus, Search, SlidersHorizontal} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import BrandsLayout from '../layouts/BrandLayout';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';

const TABS = ['Active', 'Draft', 'Paused', 'Completed'] as const;
type Tab = (typeof TABS)[number];

type BrandCampaign = {
  id: string;
  title: string;
  description?: string;
  bannerImage?: string;
  status: 'active' | 'draft' | 'paused' | 'completed' | 'under_review';
  campaignType?: string;
  maxInfluencers?: number;
  budgetTotal?: number;
  budgetPerInfluencer?: number;
  categories?: string[];
  applicationDeadline?: string;
  applicationsTotal?: number;
  applicationsPending?: number;
  createdAt?: string;
};

const TAB_STATUS: Record<Tab, BrandCampaign['status']> = {
  Active: 'active',
  Draft: 'draft',
  Paused: 'paused',
  Completed: 'completed',
};

export default function BrandCampaigns() {
  const {t} = useTranslation();
  const {user, profile} = useAuth();
  // Unverified brands can browse but not create campaigns (server enforces
  // the same rule; this keeps the UI honest).
  const brandVerified = (profile as any)?.verification_status === 'verified';
  const navigation = useNavigation<any>();
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Active');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setError(null);
    try {
      const data = await invokeFn<{campaigns?: BrandCampaign[]}>(
        'brand-campaigns',
        {action: 'list', brandId: user.id},
      );
      setCampaigns(data?.campaigns || []);
    } catch (err: any) {
      console.warn('brand-campaigns list failed:', err);
      setError(err?.message || t('ScreensBrandCampaigns.loadError'));
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh when returning from the create-campaign flow so the new draft /
  // published row appears without a manual pull.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {Active: 0, Draft: 0, Paused: 0, Completed: 0};
    for (const k of campaigns) {
      const t = (Object.keys(TAB_STATUS) as Tab[]).find(x => TAB_STATUS[x] === k.status);
      if (t) c[t] += 1;
    }
    return c;
  }, [campaigns]);

  const filtered = useMemo(() => {
    const status = TAB_STATUS[activeTab];
    const q = query.trim().toLowerCase();
    return campaigns
      .filter(c => c.status === status)
      .filter(c => !q || c.title.toLowerCase().includes(q));
  }, [campaigns, activeTab, query]);

  return (
    <View className="flex-1">
      <BrandsLayout>
      {/* Header */}
      <View className="relative mb-16">
        <View className="px-6 pt-12 pb-16 rounded-b-[40px] overflow-hidden">
          <LinearGradient
            colors={['#4C75BE', '#4A3996']}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-2xl font-bold text-white">
                {t('ScreensBrandCampaigns.headerTitle')}
              </Text>
              <Text className="text-purple-100 text-xs">
                {t('ScreensBrandCampaigns.headerSubtitle')}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity className="p-2 bg-white/10 rounded-full" onPress={load}>
                <Search size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity className="p-2 bg-white/10 rounded-full">
                <SlidersHorizontal size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="absolute left-6 right-6 -bottom-12">
          <View className="flex-row items-center bg-white rounded-3xl p-2 shadow-md shadow-gray-200 mb-4">
            <TextInput
              placeholder={t('ScreensBrandCampaigns.searchPlaceholder')}
              placeholderTextColor="#D1D5DB"
              value={query}
              onChangeText={setQuery}
              className="flex-1 pl-4 text-sm text-gray-800"
            />
            <TouchableOpacity className="p-2.5 rounded-full overflow-hidden items-center justify-center">
              <LinearGradient
                colors={['#5851DB', '#4338CA']}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{gap: 8}}>
              {TABS.map(tab =>
                activeTab === tab ? (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className="px-5 py-2 flex-row items-center gap-2 rounded-full overflow-hidden shadow-lg shadow-purple-100">
                    <LinearGradient
                      colors={['#5851DB', '#4338CA']}
                      style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                    />
                    {tab === 'Active' && (
                      <View className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    <Text className="text-xs font-semibold text-white">
                      {t(`ScreensBrandCampaigns.tabs.${tab}`)} ({counts[tab]})
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className="px-5 py-2 rounded-full bg-white flex-row items-center gap-2">
                    <Text className="text-xs font-semibold text-gray-400">
                      {t(`ScreensBrandCampaigns.tabs.${tab}`)} ({counts[tab]})
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      <View className="px-6 mt-2 pb-24" style={{gap: 12}}>
        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#5851DB" />
          </View>
        ) : error ? (
          <View className="p-4 bg-red-50 border border-red-200 rounded-2xl">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="py-16 items-center" style={{gap: 8}}>
            <Image
              source={{uri: 'https://via.placeholder.com/120x120?text=Empty'}}
              className="w-24 h-24 opacity-50 mb-2"
            />
            <Text className="text-base font-bold text-gray-800">
              {t('ScreensBrandCampaigns.emptyTitle', {
                status: t(`ScreensBrandCampaigns.tabs.${activeTab}`).toLowerCase(),
              })}
            </Text>
            <Text className="text-xs text-gray-400 text-center px-12">
              {activeTab === 'Active'
                ? t('ScreensBrandCampaigns.emptyActiveSubtitle')
                : t('ScreensBrandCampaigns.emptyOtherSubtitle', {
                    status: t(`ScreensBrandCampaigns.tabs.${activeTab}`).toLowerCase(),
                  })}
            </Text>
          </View>
        ) : (
          filtered.map(c => (
            <RealCampaignCard
              key={c.id}
              campaign={c}
              onPress={() =>
                navigation.navigate('BrandCampaignDetail', {id: c.id})
              }
            />
          ))
        )}
      </View>
      </BrandsLayout>

      {/* Verification gate — unverified brands can't create campaigns.
          These sit OUTSIDE BrandsLayout's ScrollView so `absolute` anchors to
          the screen, not the (short, in the empty state) scroll content. */}
      {profile && !brandVerified ? (
        <View className="absolute bottom-24 left-4 right-4 z-50 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <Text className="text-[13px] font-bold text-amber-900">
            {t('ScreensBrandCampaigns.verifyGateTitle')}
          </Text>
          <Text className="text-[11px] text-amber-700 mt-0.5">
            {t('ScreensBrandCampaigns.verifyGateBody')}
          </Text>
        </View>
      ) : null}

      {/* Floating FAB — full create flow is its own batch */}
      <View className="absolute bottom-24 right-6 z-50" style={!brandVerified ? {display: 'none'} : undefined}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateCampaign')}
          className="px-6 py-3 flex-row items-center gap-2 rounded-2xl overflow-hidden shadow-lg shadow-purple-200"
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#5851DB', '#4338CA']}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <Plus size={20} color="#FFFFFF" />
          <Text className="text-white font-bold text-sm">
            {t('ScreensBrandCampaigns.postRequest')}
          </Text>
          <ArrowUpRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RealCampaignCard({
  campaign,
  onPress,
}: {
  campaign: BrandCampaign;
  onPress: () => void;
}) {
  const {t} = useTranslation();
  const total = campaign.applicationsTotal || 0;
  const pending = campaign.applicationsPending || 0;
  const slots = campaign.maxInfluencers || 0;
  const budget = campaign.budgetTotal
    ? `₹${campaign.budgetTotal.toLocaleString('en-IN')}`
    : '—';
  const deadline = campaign.applicationDeadline
    ? new Date(campaign.applicationDeadline).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      })
    : null;

  const statusBg: Record<BrandCampaign['status'], string> = {
    active: 'bg-emerald-100',
    draft: 'bg-slate-100',
    paused: 'bg-amber-100',
    completed: 'bg-indigo-100',
    under_review: 'bg-purple-100',
  };
  const statusText: Record<BrandCampaign['status'], string> = {
    active: 'text-emerald-700',
    draft: 'text-slate-600',
    under_review: 'text-purple-700',
    paused: 'text-amber-700',
    completed: 'text-indigo-700',
  };

  // A campaign can be DB-status "active" with its application deadline
  // already past — creators can't apply anymore, so it gets its own amber
  // display chip instead of a misleading Active (mirrors web CampaignCard).
  const appsClosed =
    campaign.status === 'active' &&
    !!campaign.applicationDeadline &&
    new Date(campaign.applicationDeadline).getTime() < Date.now();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {campaign.bannerImage ? (
        <Image
          source={{uri: campaign.bannerImage}}
          className="w-full h-32"
          resizeMode="cover"
        />
      ) : null}
      <View className="p-4" style={{gap: 8}}>
        <View className="flex-row items-center" style={{gap: 6}}>
          {campaign.campaignType ? (
            <View className="bg-purple-50 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-semibold text-[#5851DB] capitalize">
                {campaign.campaignType}
              </Text>
            </View>
          ) : null}
          {appsClosed ? (
            <View className="bg-amber-100 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold uppercase text-amber-700">
                {t('ScreensBrandCampaigns.applicationsClosed')}
              </Text>
            </View>
          ) : (
            <View className={`${statusBg[campaign.status]} px-2 py-0.5 rounded-full`}>
              <Text
                className={`text-[10px] font-bold uppercase ${statusText[campaign.status]}`}>
                {campaign.status === 'under_review' ? t('ScreensBrandCampaigns.underReview') : campaign.status}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
          {campaign.title}
        </Text>
        {campaign.description ? (
          <Text className="text-xs text-gray-500" numberOfLines={2}>
            {campaign.description}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap" style={{gap: 6, marginTop: 4}}>
          <Pill label={t('ScreensBrandCampaigns.pillBudget')} value={budget} />
          <Pill label={t('ScreensBrandCampaigns.pillSlots')} value={`${total}/${slots || '∞'}`} />
          {pending > 0 ? (
            <Pill label={t('ScreensBrandCampaigns.pillPending')} value={String(pending)} highlight />
          ) : null}
          {deadline ? <Pill label={t('ScreensBrandCampaigns.pillDeadline')} value={deadline} /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Pill({label, value, highlight}: {label: string; value: string; highlight?: boolean}) {
  return (
    <View
      className={`flex-row items-center px-2 py-1 rounded-lg border ${
        highlight ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'
      }`}
      style={{gap: 4}}>
      <Text className="text-[9px] font-bold uppercase text-slate-400">{label}</Text>
      <Text
        className={`text-[11px] font-bold ${
          highlight ? 'text-amber-700' : 'text-slate-700'
        }`}>
        {value}
      </Text>
    </View>
  );
}
