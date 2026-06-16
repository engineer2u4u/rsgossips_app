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
  status: 'active' | 'draft' | 'paused' | 'completed';
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
  const {user} = useAuth();
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
      setError(err?.message || 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
    <BrandsLayout>
      {/* Header */}
      <View className="relative mb-16">
        <LinearGradient
          colors={['#4C75BE', '#4A3996']}
          className="px-6 pt-12 pb-16 rounded-b-[40px]">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-2xl font-bold text-white">Campaigns</Text>
              <Text className="text-purple-100 text-xs">
                Manage and review your collaborations
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
        </LinearGradient>

        <View className="absolute left-6 right-6 -bottom-12">
          <View className="flex-row items-center bg-white rounded-3xl p-2 shadow-md shadow-gray-200 mb-4">
            <TextInput
              placeholder="Search your campaigns…"
              placeholderTextColor="#D1D5DB"
              value={query}
              onChangeText={setQuery}
              className="flex-1 pl-4 text-sm text-gray-800"
            />
            <LinearGradient colors={['#5851DB', '#4338CA']} className="rounded-full">
              <TouchableOpacity className="p-2.5">
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{gap: 8}}>
              {TABS.map(tab =>
                activeTab === tab ? (
                  <LinearGradient
                    key={tab}
                    colors={['#5851DB', '#4338CA']}
                    className="rounded-full shadow-lg shadow-purple-100">
                    <TouchableOpacity
                      onPress={() => setActiveTab(tab)}
                      className="px-5 py-2 flex-row items-center gap-2">
                      {tab === 'Active' && (
                        <View className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                      <Text className="text-xs font-semibold text-white">
                        {tab} ({counts[tab]})
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                ) : (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className="px-5 py-2 rounded-full bg-white flex-row items-center gap-2">
                    <Text className="text-xs font-semibold text-gray-400">
                      {tab} ({counts[tab]})
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
              No {activeTab.toLowerCase()} campaigns
            </Text>
            <Text className="text-xs text-gray-400 text-center px-12">
              {activeTab === 'Active'
                ? 'Post a campaign request to start receiving creator applications.'
                : `You have no campaigns in ${activeTab.toLowerCase()} status.`}
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

      {/* Floating FAB — full create flow is its own batch */}
      <View className="absolute bottom-24 right-6 z-50">
        <LinearGradient
          colors={['#5851DB', '#4338CA']}
          className="rounded-2xl shadow-lg shadow-purple-200">
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateCampaign')}
            className="px-6 py-3 flex-row items-center gap-2"
            activeOpacity={0.8}>
            <Plus size={20} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm">Post Request</Text>
            <ArrowUpRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </BrandsLayout>
  );
}

function RealCampaignCard({
  campaign,
  onPress,
}: {
  campaign: BrandCampaign;
  onPress: () => void;
}) {
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
  };
  const statusText: Record<BrandCampaign['status'], string> = {
    active: 'text-emerald-700',
    draft: 'text-slate-600',
    paused: 'text-amber-700',
    completed: 'text-indigo-700',
  };

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
          <View className={`${statusBg[campaign.status]} px-2 py-0.5 rounded-full`}>
            <Text
              className={`text-[10px] font-bold uppercase ${statusText[campaign.status]}`}>
              {campaign.status}
            </Text>
          </View>
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
          <Pill label="Budget" value={budget} />
          <Pill label="Slots" value={`${total}/${slots || '∞'}`} />
          {pending > 0 ? <Pill label="Pending" value={String(pending)} highlight /> : null}
          {deadline ? <Pill label="Deadline" value={deadline} /> : null}
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
