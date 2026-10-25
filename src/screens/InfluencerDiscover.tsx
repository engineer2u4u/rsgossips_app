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
import {useNavigation} from '@react-navigation/native';
import BrandCard from '../components/BrandCard';
import FilterModal from '../components/FilterModal';
import BottomNav from '../components/BottomNav';
import {useAuth} from '../context/AuthContext';
import {calculateBrandMatchScore} from '../utils/matchScore';
import {invokeFn} from '../lib/api';
import {useTranslation} from 'react-i18next';
import {matchesBrandType, toBrandAccountType, type BrandAccountType} from '../lib/brandType';

// Mirrors web's 30-per-page brand list — show 30 at a time, "Load more"
// appends the next 30, and the count resets on any filter/sort change.
const PAGE_SIZE = 30;

type SortBy = 'match' | 'az' | 'campaigns';

interface Brand {
  id: string;
  name: string;
  /** Single canonical category (legacy / fallback). */
  category: string;
  /** Multi-category list when the brand has more than one. The web filter
   *  prefers this; we fall back to `category` when it's empty. */
  categories?: string[];
  /** Instagram @handle — web's brand filter matches the search query
   *  against this in addition to `name`, with the leading `@` stripped. */
  instagram?: string;
  minBudget: number;
  maxBudget?: number;
  isVerified: boolean;
  platforms: string[];
  activeCampaigns: number;
  rating: number;
  followers: string;
  logo: string;
  payout: string;
  /** 300–900 composite trust score from list-brands. */
  trustScore?: number;
  /** Server-computed band: Elite / Trusted / Established / Emerging / Building Trust. */
  trustBand?: string;
  /** "brand" | "agency" — admin-set label from list-brands. */
  accountType?: BrandAccountType;
}

export default function InfluencerDiscover() {
  const {t} = useTranslation();
  const {profile} = useAuth();
  const navigation = useNavigation<any>();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  // See InfluencerCampaign: this screen used to fall back to five invented
  // brands with hard-coded ratings and payouts whenever list-brands failed.
  const [loadError, setLoadError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState({min: 0, max: 10000});
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  // Brand / agency checkboxes — [] or both ticked = everyone.
  const [brandTypes, setBrandTypes] = useState<BrandAccountType[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Sort order: match score (default) / A–Z / most active campaigns.
  // Mirrors web src/app/influencer/brands/page.js.
  const [sortBy, setSortBy] = useState<SortBy>('match');

  // Client-side pagination — render `visibleCount` cards, "Load more"
  // appends the next PAGE_SIZE. Reset on any filter/sort change so we
  // never show stale slices after toggling a filter.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadBrands = useCallback(async () => {
    setLoadError(false);
    try {
      // list-brands takes no caller identity, so this is the same call for a
      // guest as for a signed-in creator.
      const data = await invokeFn<{brands?: any[]}>('list-brands', {});
      if (data?.brands?.length) {
        setBrands(
          data.brands.map((b: any) => ({
            id: b.id || String(Math.random()),
            name: b.name || 'Brand',
            category: b.category || 'General',
            // Carry through both shapes the edge function can return so
            // the category filter can match either one (web behaviour).
            categories: Array.isArray(b.categories) ? b.categories : [],
            instagram: b.instagram || b.handle || '',
            minBudget: b.minBudget || 0,
            maxBudget: b.maxBudget || 10000,
            isVerified: b.isVerified || false,
            platforms: b.platforms || ['Instagram'],
            activeCampaigns: b.activeCampaigns || 0,
            rating: b.rating || 0,
            followers: b.followers || '0',
            logo: b.logo || '',
            payout: b.payout || '—',
            trustScore: typeof b.trustScore === 'number' ? b.trustScore : undefined,
            trustBand: b.trustBand || undefined,
            accountType: toBrandAccountType(b.accountType),
          })),
        );
      }
    } catch {
      setBrands([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadBrands();
    } finally {
      setRefreshing(false);
    }
  }, [loadBrands]);

  // Matches web's filter engine in src/app/influencer/brands/page.js:
  //  - search matches name OR @handle (with the leading @ stripped)
  //  - category check looks in brand.categories[] first, falls back to
  //    brand.category for single-cat rows
  //  - budget filter is skipped entirely when a brand has no budget info
  //    (minBudget === 0/null) — otherwise we'd hide every brand without
  //    a price tag attached
  //  - platforms filter dropped on web; mirrored here
  // After filtering we attach a `_matchScore` and sort descending so the
  // most relevant brand sits at the top of the grid. Score is memoised
  // once per render via the same calculateBrandMatchScore the cards use,
  // so the visible BrandCard.matchScore reads the cached value rather
  // than re-running the calculation per cell.
  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const passes = brands.filter(brand => {
      const name = (brand.name || '').toLowerCase();
      const ig = (brand.instagram || '').toLowerCase();
      const cats = Array.isArray(brand.categories) ? brand.categories : [];

      const matchesSearch =
        q === '' ||
        name.includes(q) ||
        ig.includes(q.replace(/^@/, ''));

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some(
          c => cats.includes(c) || brand.category === c,
        );

      const matchesBudget =
        !brand.minBudget ||
        (brand.minBudget >= budgetRange.min &&
          brand.minBudget <= budgetRange.max);

      const matchesVerified = isVerifiedOnly ? brand.isVerified : true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBudget &&
        matchesVerified &&
        matchesBrandType(brandTypes, brand.accountType)
      );
    });

    // User-selectable sort. "match" (default) keeps the best-fit brands on
    // top using the SAME scorer the card badge renders, so position and %
    // agree. The score is always attached — the cards read it either way.
    const scored = passes.map(b => ({
      ...b,
      _matchScore: calculateBrandMatchScore(profile, b),
    }));
    if (sortBy === 'az') {
      return scored.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    if (sortBy === 'campaigns') {
      return scored.sort(
        (a, b) => (b.activeCampaigns || 0) - (a.activeCampaigns || 0),
      );
    }
    return scored.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
  }, [brands, searchQuery, selectedCategories, budgetRange, isVerifiedOnly, brandTypes, profile, sortBy]);

  // Whenever the filtered list changes (filters/search/sort toggled), snap
  // visibleCount back to the first page so we never display an empty
  // tail of "phantom" loaded rows.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedCategories, budgetRange, isVerifiedOnly, brandTypes, sortBy]);

  const visibleBrands = useMemo(
    () => filteredBrands.slice(0, visibleCount),
    [filteredBrands, visibleCount],
  );
  const hasMore = visibleCount < filteredBrands.length;

  const loadMore = () =>
    setVisibleCount(c => Math.min(c + PAGE_SIZE, filteredBrands.length));

  const SORT_OPTIONS: {key: SortBy; label: string}[] = [
    {key: 'match', label: t('ScreensInfluencerDiscover.sortMatch')},
    {key: 'az', label: t('ScreensInfluencerDiscover.sortAz')},
    {key: 'campaigns', label: t('ScreensInfluencerDiscover.sortCampaigns')},
  ];

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
        {/* Header */}
        <View className="px-4 pt-4 pb-2" style={{gap: 16}}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-slate-800">
                {t('ScreensInfluencerDiscover.title')}
              </Text>
              <Text className="text-xs text-slate-400 mt-1 font-medium">
                {t('ScreensInfluencerDiscover.subtitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsFiltersOpen(true)}
              className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 items-center justify-center">
              <SlidersHorizontal size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white rounded-xl px-4 h-11 shadow-sm border border-slate-100">
            <Search size={18} color="#94A3B8" />
            <TextInput
              placeholder={t('ScreensInfluencerDiscover.searchPlaceholder')}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-sm text-slate-700"
            />
          </View>
        </View>

        {/* Brand Cards — two per row, matches web's `sm:grid-cols-2` */}
        <View className="px-4 pt-2 pb-4">
          {/* Count + sort control (mirrors web's brands page header row) */}
          {!loading && (
            <View className="mb-3" style={{gap: 8}}>
              <Text className="text-xs font-bold text-slate-400">
                {t('ScreensInfluencerDiscover.countBrands', {
                  n: filteredBrands.length,
                })}
              </Text>
              <View className="flex-row" style={{gap: 8}}>
                {SORT_OPTIONS.map(opt => {
                  const active = sortBy === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setSortBy(opt.key)}
                      activeOpacity={0.8}
                      className={
                        active
                          ? 'px-3 py-1.5 rounded-xl bg-[#9810FA]'
                          : 'px-3 py-1.5 rounded-xl bg-white border border-slate-100'
                      }>
                      <Text
                        className={
                          active
                            ? 'text-[11px] font-bold text-white'
                            : 'text-[11px] font-bold text-slate-500'
                        }>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {loading ? (
            <View className="py-20 items-center" style={{gap: 12}}>
              <ActivityIndicator size="large" color="#9810FA" />
              <Text className="text-sm font-bold text-slate-400">
                {t('ScreensInfluencerDiscover.loading')}
              </Text>
            </View>
          ) : loadError ? (
            <View
              className="py-16 bg-white rounded-[32px] items-center px-6"
              style={{gap: 10}}>
              <Text className="text-sm font-bold text-slate-700 text-center">
                {t('ScreensInfluencerDiscover.loadFailedTitle')}
              </Text>
              <Text className="text-xs text-slate-400 text-center">
                {t('ScreensInfluencerDiscover.loadFailedBody')}
              </Text>
              <TouchableOpacity
                onPress={loadBrands}
                accessibilityRole="button"
                className="mt-1 px-5 rounded-2xl border items-center justify-center"
                style={{height: 42, borderColor: '#cbd5e1'}}>
                <Text className="text-[13px] font-bold text-slate-600">
                  {t('common.retry')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredBrands.length === 0 ? (
            <View className="py-20 bg-white rounded-[32px] items-center">
              <Text className="text-sm font-bold text-slate-400">
                {t('ScreensInfluencerDiscover.empty')}
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap" style={{gap: 12}}>
                {visibleBrands.map(brand => (
                  <View key={brand.id} style={{width: '48%'}}>
                    <BrandCard
                      brand={brand}
                      matchScore={(brand as any)._matchScore || 0}
                      onPress={() =>
                        navigation.navigate('InfluencerCampaigns', {
                          brandName: brand.name,
                        })
                      }
                    />
                  </View>
                ))}
              </View>
              {hasMore && (
                <TouchableOpacity
                  onPress={loadMore}
                  activeOpacity={0.85}
                  className="mt-4 py-3 items-center bg-white rounded-2xl border border-slate-100">
                  <Text className="text-sm font-bold text-[#9810FA]">
                    {t('ScreensInfluencerDiscover.loadMore', {
                      n: filteredBrands.length - visibleCount,
                    })}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Clears the floating glass nav pill (bottom 14/24 + height 68). */}
        <View className="h-32" />
      </ScrollView>

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </View>

      {/* Filter Modal — brands don't need Platforms or Brand picker, so
          we pass the minimum subset of props (matching the web shape). */}
      <FilterModal
        visible={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        budgetRange={budgetRange}
        setBudgetRange={setBudgetRange}
        budgetMaxDefault={10000}
        isVerifiedOnly={isVerifiedOnly}
        setIsVerifiedOnly={setIsVerifiedOnly}
        brandTypes={brandTypes}
        setBrandTypes={setBrandTypes}
      />
    </SafeAreaView>
  );
}
