import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {Search, SlidersHorizontal} from 'lucide-react-native';
import BrandCard from '../components/BrandCard';
import FilterModal from '../components/FilterModal';
import BottomNav from '../components/BottomNav';
import {useAuth} from '../context/AuthContext';
import {calculateBrandMatchScore} from '../utils/matchScore';
import {NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY} from '@env';

interface Brand {
  id: string;
  name: string;
  category: string;
  minBudget: number;
  maxBudget?: number;
  isVerified: boolean;
  platforms: string[];
  activeCampaigns: number;
  rating: number;
  followers: string;
  logo: string;
  payout: string;
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
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState({min: 0, max: 10000});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/list-brands`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: '{}',
        });
        const data = await res.json();
        if (data?.brands?.length) {
          setBrands(
            data.brands.map((b: any) => ({
              id: b.id || String(Math.random()),
              name: b.name || 'Brand',
              category: b.category || 'General',
              minBudget: b.minBudget || 0,
              maxBudget: b.maxBudget || 10000,
              isVerified: b.isVerified || false,
              platforms: b.platforms || ['Instagram'],
              activeCampaigns: b.activeCampaigns || 0,
              rating: b.rating || 0,
              followers: b.followers || '0',
              logo: b.logo || '',
              payout: b.payout || '—',
            })),
          );
        }
      } catch {
        // Keep fallback
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const filteredBrands = useMemo(() => {
    return brands.filter(brand => {
      const matchesSearch = brand.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(brand.category);
      const matchesBudget =
        brand.minBudget >= budgetRange.min &&
        brand.minBudget <= budgetRange.max;
      const matchesVerified = isVerifiedOnly ? brand.isVerified : true;
      const matchesPlatform =
        selectedPlatforms.length === 0 ||
        brand.platforms.some(p => selectedPlatforms.includes(p));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBudget &&
        matchesVerified &&
        matchesPlatform
      );
    });
  }, [
    brands,
    searchQuery,
    selectedCategories,
    budgetRange,
    isVerifiedOnly,
    selectedPlatforms,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}>
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

        {/* Brand Cards */}
        <View className="px-4 pt-2 pb-4" style={{gap: 12}}>
          {loading ? (
            <View className="py-20 items-center" style={{gap: 12}}>
              <ActivityIndicator size="large" color="#9810FA" />
              <Text className="text-sm font-bold text-slate-400">
                Loading brands...
              </Text>
            </View>
          ) : (
            <>
              {filteredBrands.map(brand => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  matchScore={calculateBrandMatchScore(profile, brand)}
                />
              ))}

              {filteredBrands.length === 0 && (
                <View className="py-20 bg-white rounded-[32px] items-center">
                  <Text className="text-sm font-bold text-slate-400">
                    No brands match these filters.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View className="h-20" />
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
        selectedPlatforms={selectedPlatforms}
        setSelectedPlatforms={setSelectedPlatforms}
        isVerifiedOnly={isVerifiedOnly}
        setIsVerifiedOnly={setIsVerifiedOnly}
      />
    </SafeAreaView>
  );
}
