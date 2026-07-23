import React, {useCallback, useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Search, SlidersHorizontal} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {CampaignCard} from '../components/CampaignCard';
import FilterModal from '../components/FilterModal';
import BottomNav from '../components/BottomNav';
import {useAuth} from '../context/AuthContext';
import {calculateCampaignMatchScore} from '../utils/matchScore';
import {invokeFn} from '../lib/api';
import {useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

const TABS = ['Active', 'Applied', 'Completed'];
// Mirrors web's PAGE_SIZE (client-side pagination, 30 per page). Mobile
// reveals the next window via an explicit "Load more" button instead of
// numbered pages so scroll position stays natural.
const PAGE_SIZE = 30;

interface CampaignData {
  id: string;
  initials?: string;
  title: string;
  brandName: string;
  status: string;
  // The web (b5529e5) normalised influencer-side campaigns to Instagram-only.
  // We keep `platforms` for forward-compat but filtering UI is dropped.
  applicationStatus?: string;
  tags: string[];
  budget: string;
  deadline?: string;
  daysLeft?: string;
  deliverables: string;
  location: string;
  platforms: string[];
  /** Optional banner image — list-campaigns returns one per row when the
   *  brand uploaded a hero, used as the card cover. */
  bannerImage?: string;
  /** Short description shown under the title on the card. */
  description?: string;
}

const FALLBACK_CAMPAIGNS: CampaignData[] = [
  {
    id: '1',
    initials: 'SB',
    title: 'Summer Collection',
    brandName: 'StyleBrand Co.',
    status: 'Active',
    tags: ['Fashion', 'Lifestyle'],
    budget: '₹25,000 - ₹35,000',
    deadline: 'Jan 30, 2026',
    daysLeft: '10d',
    deliverables: '2 Reels + 2 Stories',
    location: 'Mumbai, India',
    platforms: ['instagram', 'tiktok'],
  },
  {
    id: '2',
    initials: 'MB',
    title: 'Music Fest Promo',
    brandName: 'MusicWave Events',
    status: 'Applied',
    tags: ['Music', 'Events'],
    budget: '₹30,000 - ₹40,000',
    deadline: 'Feb 10, 2026',
    daysLeft: '21d',
    deliverables: '4 Reels + 2 Videos',
    location: 'Pune',
    platforms: ['instagram', 'youtube'],
  },
  {
    id: '3',
    initials: 'GB',
    title: 'Eco-Friendly Campaign',
    brandName: 'GreenEarth Co.',
    status: 'Completed',
    tags: ['Sustainability', 'Lifestyle'],
    budget: '₹20,000 - ₹25,000',
    deadline: 'Jan 15, 2026',
    deliverables: '2 Videos + 1 Reel',
    location: 'Chennai',
    platforms: ['youtube'],
  },
];

export default function InfluencerCampaign() {
  const {t} = useTranslation();
  const {profile, user} = useAuth();
  const route = useRoute<any>();
  // Optional brand-name param — coming from "Brands you'll love" tiles or
  // any other deep link. Web's equivalent reads `?brand=` from the URL and
  // pre-fills `selectedBrands`. Mirror that here.
  const incomingBrandFilter: string =
    (route.params as any)?.brandName || (route.params as any)?.brand || '';
  // "View all" on the home carousel passes the user's niche so the campaigns
  // list opens already filtered to those categories. Defaults to none.
  const incomingCategories: string[] = Array.isArray(
    (route.params as any)?.categories,
  )
    ? (route.params as any).categories
    : [];

  const [campaigns, setCampaigns] = useState<CampaignData[]>(FALLBACK_CAMPAIGNS);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(incomingCategories);
  const [budgetRange, setBudgetRange] = useState({min: 0, max: 200000});
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    incomingBrandFilter ? [incomingBrandFilter] : [],
  );
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Pagination: render `visibleCount` cards; the "Load more" button under
  // the list reveals the next PAGE_SIZE window.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Re-seed the brand filter whenever the screen is reopened with a
  // different brand param (back-and-forth navigation between Brands tiles
  // + this screen would otherwise keep the first one's filter stuck).
  useEffect(() => {
    if (incomingBrandFilter) {
      setSelectedBrands([incomingBrandFilter]);
    }
  }, [incomingBrandFilter]);

  // Same pattern for `categories` (passed by "View all" on the home carousel
  // for the recommended-campaigns section). Re-seed when the param changes
  // so re-entering with a different niche doesn't keep the old filter.
  useEffect(() => {
    if (incomingCategories.length) {
      setSelectedCategories(incomingCategories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCategories.join(',')]);

  const loadCampaigns = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const data = await invokeFn<{campaigns?: any[]}>('list-campaigns', {
        influencerId: user.id,
      });
      if (data?.campaigns?.length) {
        setCampaigns(
          data.campaigns.map((c: any) => ({
            id: c.id,
            initials: c.initials || c.title?.substring(0, 2)?.toUpperCase(),
            title: c.title || 'Campaign',
            brandName: c.brandName || 'Brand',
            // Web's list-campaigns returns Active/Applied/Completed already
            // computed against the user's application row.
            status: c.status || 'Active',
            applicationStatus: c.applicationStatus,
            tags: c.tags || [],
            // Edge function returns budget already formatted (₹X,XXX).
            budget: c.budget
              ? typeof c.budget === 'number'
                ? `₹${c.budget.toLocaleString('en-IN')}`
                : c.budget
              : '—',
            deadline: c.deadline || '',
            daysLeft: c.daysLeft ? `${c.daysLeft}d` : '',
            deliverables: c.deliverables || '—',
            location: c.location || 'India',
            platforms: c.platforms || ['instagram'],
            bannerImage: c.bannerImage || c.brandLogo || '',
            description: c.description || '',
          })),
        );
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.warn('list-campaigns failed:', err);
      // Keep the fallback list so the screen isn't blank.
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCampaigns();
    } finally {
      setRefreshing(false);
    }
  }, [loadCampaigns]);

  // Brand picker list — unique brandNames sorted alphabetically, matches
  // web's `brandNames` memo.
  const brandNames = useMemo(() => {
    const set = new Set<string>();
    for (const c of campaigns) if (c.brandName) set.add(c.brandName);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [campaigns]);

  // Mirrors web's filter engine in src/app/influencer/campaigns/page.js:
  //  - tab: Completed pulls from `applicationStatus === "completed"`
  //    (campaigns the user actually completed) rather than the brand-side
  //    `status === "Completed"`; Active/Applied still use the campaign
  //    status field
  //  - search matches title OR brand name (case-insensitive substring)
  //  - category matches when any campaign tag includes any selected cat
  //    (loose substring, both lowercased)
  //  - brand filter is exact `brandName` match
  //  - budget parses digits out of the budget string; `max >= 200000` is
  //    the "no cap" sentinel
  const filteredCampaigns = useMemo(() => {
    const filtered = campaigns.filter(campaign => {
      const matchesTab =
        activeTab === 'Completed'
          ? campaign.applicationStatus === 'completed'
          : campaign.status === activeTab;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        campaign.title.toLowerCase().includes(q) ||
        campaign.brandName.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategories.length === 0 ||
        campaign.tags.some(t =>
          selectedCategories.some(c =>
            t.toLowerCase().includes(c.toLowerCase()),
          ),
        );
      const matchesBrand =
        selectedBrands.length === 0 ||
        selectedBrands.includes(campaign.brandName);
      const budgetNum =
        parseInt((campaign.budget || '').replace(/[^\d]/g, ''), 10) || 0;
      const matchesBudget =
        budgetNum >= budgetRange.min &&
        (budgetRange.max >= 200000 || budgetNum <= budgetRange.max);

      return (
        matchesTab &&
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesBudget
      );
    });
    // Sort by match score descending — best-fit campaigns surface first.
    // calculateCampaignMatchScore is pure / cheap so computing per render
    // is fine; we'd only memoise per-campaign if the list grows past a
    // few hundred rows.
    return filtered
      .map(c => ({c, score: calculateCampaignMatchScore(profile, c)}))
      .sort((a, b) => b.score - a.score)
      .map(({c}) => c);
  }, [
    campaigns,
    activeTab,
    searchQuery,
    selectedCategories,
    selectedBrands,
    budgetRange,
    profile,
  ]);

  // Per-tab counts shown alongside the tab label. Numbers reflect what
  // each tab would actually display under the current search + filter
  // settings (all filter dimensions applied *except* the tab itself),
  // so they always match the visible list once that tab is selected.
  const tabCounts = useMemo<Record<string, number>>(() => {
    const q = searchQuery.toLowerCase();
    const matchesNonTabFilters = (campaign: CampaignData) => {
      const matchesSearch =
        campaign.title.toLowerCase().includes(q) ||
        campaign.brandName.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategories.length === 0 ||
        campaign.tags.some(t =>
          selectedCategories.some(c =>
            t.toLowerCase().includes(c.toLowerCase()),
          ),
        );
      const matchesBrand =
        selectedBrands.length === 0 ||
        selectedBrands.includes(campaign.brandName);
      const budgetNum =
        parseInt((campaign.budget || '').replace(/[^\d]/g, ''), 10) || 0;
      const matchesBudget =
        budgetNum >= budgetRange.min &&
        (budgetRange.max >= 200000 || budgetNum <= budgetRange.max);
      return matchesSearch && matchesCategory && matchesBrand && matchesBudget;
    };
    const pool = campaigns.filter(matchesNonTabFilters);
    return {
      Active: pool.filter(c => c.status === 'Active').length,
      Applied: pool.filter(c => c.status === 'Applied').length,
      Completed: pool.filter(c => c.applicationStatus === 'completed').length,
    };
  }, [
    campaigns,
    searchQuery,
    selectedCategories,
    selectedBrands,
    budgetRange,
  ]);

  // Reset visible window whenever the active tab or filter inputs change
  // so the user doesn't land on an under-populated page after switching.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    activeTab,
    searchQuery,
    selectedCategories,
    selectedBrands,
    budgetRange,
    isVerifiedOnly,
  ]);

  const visibleCampaigns = useMemo(
    () => filteredCampaigns.slice(0, visibleCount),
    [filteredCampaigns, visibleCount],
  );
  const hasMore = visibleCount < filteredCampaigns.length;
  const remainingCount = filteredCampaigns.length - visibleCount;

  // Filtered-state strip: "N out of M campaigns" + a Show-all reset,
  // mirroring web's `tabTotalUnfiltered` / `hasActiveFilters` /
  // `clearAllFilters`. The total ignores the non-tab filters so the
  // ratio is honest. (isVerifiedOnly isn't part of the filter predicate,
  // so it doesn't count as an "active" filter — but Show all clears it
  // anyway for a clean slate.)
  const tabTotalUnfiltered = useMemo(
    () =>
      campaigns.filter(c =>
        activeTab === 'Completed'
          ? c.applicationStatus === 'completed'
          : c.status === activeTab,
      ).length,
    [campaigns, activeTab],
  );
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    budgetRange.min > 0 ||
    budgetRange.max < 200000;
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setBudgetRange({min: 0, max: 200000});
    setIsVerifiedOnly(false);
  };

  return (
    <SafeAreaView className="flex-1" style={{backgroundColor: '#F5F4F8'}}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView
        className="flex-1" style={{backgroundColor: '#F5F4F8'}}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E60076"
            colors={['#E60076']}
          />
        }>
        <View className="px-4 pt-4 pb-2" style={{gap: 16}}>
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-slate-800">
                {t('ScreensInfluencerCampaign.title')}
              </Text>
              <Text className="text-xs text-slate-400 mt-1 font-medium">
                {t('ScreensInfluencerCampaign.subtitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsFiltersOpen(true)}
              className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 items-center justify-center">
              <SlidersHorizontal size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-xl px-4 h-11 shadow-sm border border-slate-100">
            <Search size={18} color="#94A3B8" />
            <TextInput
              placeholder={t('ScreensInfluencerCampaign.searchPlaceholder')}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-sm text-slate-700"
            />
          </View>

          {/* Tab Switcher — count appears next to the label in parentheses */}
          <View className="bg-white p-1.5 rounded-2xl flex-row shadow-sm border border-slate-50" style={{gap: 4}}>
            {TABS.map(tab => {
              const label = t(`ScreensInfluencerCampaign.tabs.${tab}`, {
                count: tabCounts[tab] ?? 0,
              });
              return activeTab === tab ? (
                <LinearGradient
                  key={tab}
                  colors={['#E60076', '#D500F9']}
                  style={{borderRadius: 12, flex: 1}}>
                  <TouchableOpacity
                    onPress={() => setActiveTab(tab)}
                    className="py-2.5 items-center">
                    <Text className="text-xs font-bold text-white">{label}</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className="flex-1 py-2.5 rounded-xl items-center">
                  <Text className="text-xs font-bold text-slate-400">
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Filtered strip — mirrors web's "{shown} out of {total}
              campaigns" + gradient Show-all reset; only shown while a
              non-tab filter is active. */}
          {hasActiveFilters && !loading && (
            <View className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-50">
              <Text className="text-xs font-bold text-[#E60076] flex-1 mr-2">
                {t('ScreensInfluencerCampaign.filteredOutOf', {
                  shown: filteredCampaigns.length,
                  total: tabTotalUnfiltered,
                })}
              </Text>
              <TouchableOpacity
                onPress={clearAllFilters}
                style={{borderRadius: 10, overflow: 'hidden'}}>
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{paddingHorizontal: 12, paddingVertical: 7}}>
                  <Text className="text-[11px] font-bold text-white">
                    {t('ScreensInfluencerCampaign.showAll')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Campaign Cards */}
          {loading ? (
            <View className="py-20 items-center" style={{gap: 12}}>
              <ActivityIndicator size="large" color="#9810FA" />
              <Text className="text-sm font-bold text-slate-400">
                {t('ScreensInfluencerCampaign.loading')}
              </Text>
            </View>
          ) : (
            <View style={{gap: 16}}>
              {visibleCampaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  matchScore={calculateCampaignMatchScore(profile, campaign)}
                />
              ))}

              {filteredCampaigns.length === 0 && (
                <View className="py-20 bg-white rounded-[32px] items-center">
                  <Text className="text-sm font-bold text-slate-400">
                    {t('ScreensInfluencerCampaign.noCampaigns', {
                      tab: t(`ScreensInfluencerCampaign.tabsLower.${activeTab}`),
                    })}
                  </Text>
                </View>
              )}

              {hasMore && (
                <TouchableOpacity
                  onPress={() =>
                    setVisibleCount(c =>
                      Math.min(c + PAGE_SIZE, filteredCampaigns.length),
                    )
                  }
                  className="py-3.5 items-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <Text className="text-sm font-bold text-[#9810FA]">
                    {t('ScreensInfluencerCampaign.loadMore', {
                      n: remainingCount,
                    })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Clears the floating glass nav pill (bottom 14/24 + height 68). */}
        <View className="h-32" />
      </ScrollView>

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        budgetRange={budgetRange}
        setBudgetRange={setBudgetRange}
        budgetMaxDefault={200000}
        brands={brandNames}
        selectedBrands={selectedBrands}
        setSelectedBrands={setSelectedBrands}
        isVerifiedOnly={isVerifiedOnly}
        setIsVerifiedOnly={setIsVerifiedOnly}
      />
    </SafeAreaView>
  );
}
