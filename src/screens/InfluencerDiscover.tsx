import React, {useCallback, useState, useMemo, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
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

const PAGE_SIZE = 10;
const LOAD_MORE_STEP = 6;

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
  /** 0-1000 composite trust score from list-brands. */
  trustScore?: number;
  /** Label that maps to a trust band (Excellent / Very Good / Good / Fair / Poor). */
  trustBand?: string;
}

const FALLBACK_BRANDS: Brand[] = [
  {
    id: '1',
    name: 'D LUXE PERFUMES',
    category: 'Perfume',
    minBudget: 1500,
    maxBudget: 7500,
    isVerified: true,
    platforms: ['Instagram'],
    activeCampaigns: 12,
    rating: 4.9,
    followers: '45K',
    logo: 'https://lh3.googleusercontent.com/d/1y5nOHRt1P-5SB6BCzryeczgmhyoHcuSs',
    payout: '₹1,500 - ₹7,500',
  },
  {
    id: '2',
    name: 'ZAUDI',
    category: 'Perfume',
    minBudget: 1000,
    maxBudget: 5000,
    isVerified: false,
    platforms: ['Instagram'],
    activeCampaigns: 4,
    rating: 4.3,
    followers: '12K',
    logo: 'https://lh3.googleusercontent.com/d/1PS9A-rPC48WUPo8imZjw4XAzChADsceu',
    payout: '₹1,000 - ₹5,000',
  },
  {
    id: '3',
    name: 'RIAR ELUX',
    category: 'Wellness',
    minBudget: 2000,
    maxBudget: 8000,
    isVerified: true,
    platforms: ['Instagram'],
    activeCampaigns: 8,
    rating: 4.7,
    followers: '28K',
    logo: 'https://lh3.googleusercontent.com/d/1cUytBemciPv8OdMi6-gADzUCKzfymr1R',
    payout: '₹2,000 - ₹8,000',
  },
  {
    id: '4',
    name: 'BIODANCE',
    category: 'Skincare',
    minBudget: 3000,
    maxBudget: 12000,
    isVerified: false,
    platforms: ['Instagram'],
    activeCampaigns: 15,
    rating: 4.8,
    followers: '85K',
    logo: 'https://lh3.googleusercontent.com/d/16kk2EEAMw_Y0D3Jo4BCUKAwF2rE8ugLG',
    payout: '₹3,000 - ₹12,000',
  },
  {
    id: '5',
    name: 'SESA POWERPLUS',
    category: 'Health',
    minBudget: 1200,
    maxBudget: 6000,
    isVerified: false,
    platforms: ['Instagram'],
    activeCampaigns: 6,
    rating: 4.5,
    followers: '19K',
    logo: 'https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r',
    payout: '₹1,200 - ₹6,000',
  },
];

export default function InfluencerDiscover() {
  const {profile} = useAuth();
  const navigation = useNavigation<any>();
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState({min: 0, max: 10000});
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Client-side pagination — render `visibleCount` cards, bump by
  // LOAD_MORE_STEP when the user scrolls past the bottom threshold.
  // Reset whenever the filtered list shrinks below `visibleCount` so
  // we never show stale slices after toggling a filter.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadingMoreRef = useRef(false);

  const loadBrands = useCallback(async () => {
    try {
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
          })),
        );
      }
    } catch {
      // Keep fallback brands.
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
  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return brands.filter(brand => {
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
        matchesSearch && matchesCategory && matchesBudget && matchesVerified
      );
    });
  }, [brands, searchQuery, selectedCategories, budgetRange, isVerifiedOnly]);

  // Whenever the filtered list changes (filters/search toggled), snap
  // visibleCount back to the first page so we never display an empty
  // tail of "phantom" loaded rows.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedCategories, budgetRange, isVerifiedOnly]);

  const visibleBrands = useMemo(
    () => filteredBrands.slice(0, visibleCount),
    [filteredBrands, visibleCount],
  );
  const hasMore = visibleCount < filteredBrands.length;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasMore || loadingMoreRef.current) return;
    const {layoutMeasurement, contentOffset, contentSize} = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (distanceFromBottom < 240) {
      loadingMoreRef.current = true;
      setVisibleCount(c =>
        Math.min(c + LOAD_MORE_STEP, filteredBrands.length),
      );
      setTimeout(() => {
        loadingMoreRef.current = false;
      }, 250);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{backgroundColor: '#F5F4F8'}}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView
        className="flex-1" style={{backgroundColor: '#F5F4F8'}}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={64}
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
                Discover Brands
              </Text>
              <Text className="text-xs text-slate-400 mt-1 font-medium">
                Find the perfect collaboration
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
              placeholder="Search brands..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-sm text-slate-700"
            />
          </View>
        </View>

        {/* Brand Cards — two per row, matches web's `sm:grid-cols-2` */}
        <View className="px-4 pt-2 pb-4">
          {loading ? (
            <View className="py-20 items-center" style={{gap: 12}}>
              <ActivityIndicator size="large" color="#9810FA" />
              <Text className="text-sm font-bold text-slate-400">
                Loading brands...
              </Text>
            </View>
          ) : filteredBrands.length === 0 ? (
            <View className="py-20 bg-white rounded-[32px] items-center">
              <Text className="text-sm font-bold text-slate-400">
                No brands match these filters.
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap" style={{gap: 12}}>
                {visibleBrands.map(brand => (
                  <View key={brand.id} style={{width: '48%'}}>
                    <BrandCard
                      brand={brand}
                      matchScore={calculateBrandMatchScore(profile, brand)}
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
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#9810FA" />
                </View>
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
      />
    </SafeAreaView>
  );
}
