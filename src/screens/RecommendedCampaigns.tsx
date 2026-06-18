import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  DollarSign,
  Users,
  MapPin,
  Check,
  X,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {invokeFn} from '../lib/api';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// ─── DATA ───
const DUMMY_OFFERS = [
  {
    id: 'camp-001',
    imageUrl:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600',
    category: 'Beauty',
    badge: 'Trending',
    match: '98% Match',
    brand: 'Glow Essential',
    title: 'Summer Radiance Campaign',
    location: 'New York',
    desc: 'Showcase our new summer glow collection in your daily skincare routine.',
    pay: '₹30k - 45k',
    followers: '20k+ Followers',
  },
  {
    id: 'camp-002',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600',
    category: 'Travel',
    badge: 'High Paying',
    match: '95% Match',
    brand: 'Blue Horizon',
    title: 'Luxury Bali Retreat',
    location: 'Bali',
    desc: 'Exclusive 3-night stay at our newest eco-luxury resort in Uluwatu.',
    pay: '₹80k + Flights',
    followers: 'Travel Niche',
  },
  {
    id: 'camp-003',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600',
    category: 'Tech',
    badge: 'New',
    match: '92% Match',
    brand: 'Sonic Audio',
    title: 'Pro Headset Review',
    location: 'Remote',
    desc: 'Test and review our flagship noise-cancelling wireless headphones.',
    pay: '₹15k + Product',
    followers: 'Tech Reviewers',
  },
  {
    id: 'camp-004',
    imageUrl:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600',
    category: 'Fashion',
    badge: 'Featured',
    match: '90% Match',
    brand: 'Vogue Studio',
    title: 'Spring Collection Lookbook',
    location: 'Mumbai',
    desc: 'Style and shoot our spring 2025 collection with your personal twist.',
    pay: '₹25k - 40k',
    followers: '15k+ Followers',
  },
];

const CATEGORIES = [
  'Beauty & Skincare',
  'Fashion & Lifestyle',
  'Food & Beverage',
  'Health, Fitness & Wellness',
  'Travel & Hospitality',
  'Technology & Gadgets',
  'Parenting & Family',
  'Home & Decor',
  'Finance & Personal Finance',
  'Education & Career',
  'Gaming & Entertainment',
  'Automobile & Mobility',
  'Entrepreneurship & Business',
  'Sustainable & Eco-conscious Living',
  'Pet Care & Animals',
];

const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'Facebook'];

const BUDGET_RANGES = [
  '1k — 10K',
  '10K — 50K',
  '50K — 100K',
  '100K — 500K',
  '500K — 1M',
];

const CONTENT_TYPES = ['Posts', 'Reels', 'Shorts', 'Stories', 'Videos'];

const SORT_OPTIONS = [
  { label: 'Recommended', sub: '' },
  { label: 'Most Engagement', sub: '' },
  { label: 'Highest Followers', sub: '' },
  { label: 'Lowest Collaboration Cost', sub: 'Cheapest to work with' },
  { label: 'Highest Collaboration Cost', sub: 'Biggest deal first' },
  { label: 'New Creators', sub: '' },
  { label: 'Nearby Creators', sub: '' },
];

export default function RecommendedCampaigns() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('Recommended');
  const [campaigns, setCampaigns] = useState(DUMMY_OFFERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{campaigns?: any[]}>('list-campaigns', {
          influencerId: user?.id,
        });
        if (cancelled) return;
        if (data?.campaigns?.length) {
          const mapped = data.campaigns
            .filter((c: any) => c.status === 'active' || c.status === 'Active')
            .map((c: any) => ({
              id: c.id,
              imageUrl:
                c.image ||
                'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600',
              category: c.tags?.[0] || 'General',
              badge: 'Active',
              match: `${Math.floor(Math.random() * 10 + 88)}% Match`,
              brand: c.brandName || 'Brand',
              title: c.title,
              location: c.location || 'India',
              desc: c.description || '',
              pay: c.budget
                ? typeof c.budget === 'number'
                  ? `₹${(c.budget / 1000).toFixed(0)}k`
                  : c.budget
                : '₹TBD',
              followers: c.deliverables || '10k+ Followers',
            }));
          if (mapped.length) setCampaigns(mapped);
        }
      } catch {
        // Best-effort — keeps the dummy list visible.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Fashion & Lifestyle',
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'Instagram',
  ]);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(
    [],
  );

  // Modal visibility
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);

  const toggleItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    item: string,
  ) => {
    setter(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item],
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedPlatforms([]);
    setBudgetMin('');
    setBudgetMax('');
    setSelectedContentTypes([]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* HEADER */}
      <View className="bg-white border-b border-slate-100">
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full bg-slate-50"
          >
            <ChevronLeft size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-slate-900">
            Recommended
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setShowSortModal(true)}
              className="p-2 rounded-full overflow-hidden"
            >
              <LinearGradient
                colors={['#8E2DE2', '#F6339A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 999,
                  padding: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowUpDown size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              className="p-2 rounded-full overflow-hidden"
            >
              <LinearGradient
                colors={['#8E2DE2', '#F6339A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 999,
                  padding: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SlidersHorizontal size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-4 pb-3">
          <View className="flex-row items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
            <Search size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search campaigns or brands..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-sm text-slate-900"
            />
          </View>
        </View>

        {/* Quick Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
          className="gap-2"
        >
          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 mr-2"
          >
            <ArrowUpDown size={12} color="#475569" />
            <Text className="text-xs font-semibold text-slate-600">Sort</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 mr-2"
          >
            <SlidersHorizontal size={12} color="#475569" />
            <Text className="text-xs font-semibold text-slate-600">Filter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowBudgetModal(true)}
            className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 mr-2"
          >
            <DollarSign size={12} color="#475569" />
            <Text className="text-xs font-semibold text-slate-600">Budget</Text>
            {(budgetMin || budgetMax) ? (
              <View className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPlatformModal(true)}
            className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200"
          >
            <Text className="text-xs font-semibold text-slate-600">
              Platform
            </Text>
            {selectedPlatforms.length > 0 ? (
              <View className="bg-pink-500 w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-white text-[9px] font-bold">
                  {selectedPlatforms.length}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* CAMPAIGN CARDS */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 20 }}
      >
        {loading ? (
          <View className="py-20 items-center" style={{gap: 12}}>
            <ActivityIndicator size="large" color="#9810FA" />
            <Text className="text-sm font-bold text-slate-400">Loading campaigns...</Text>
          </View>
        ) : null}
        {!loading && campaigns.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.brand.toLowerCase().includes(searchQuery.toLowerCase())).map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInUp.delay(index * 80).springify()}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
          >
            {/* Image */}
            <View className="h-48 p-3">
              <View className="flex-1 rounded-2xl overflow-hidden relative">
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                {/* Top badges */}
                <View className="absolute top-3 left-3">
                  <View className="bg-white/90 px-3 py-1 rounded-full">
                    <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-700">
                      {item.category}
                    </Text>
                  </View>
                </View>
                <View className="absolute top-3 right-3">
                  <View className="bg-black/70 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                    <View className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <Text className="text-white text-[9px] font-bold">
                      {item.badge}
                    </Text>
                  </View>
                </View>
                {/* Match badge */}
                <View className="absolute bottom-3 left-3">
                  <View className="bg-emerald-500 px-3 py-1.5 rounded-lg">
                    <Text className="text-white text-[10px] font-bold">
                      {item.match}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Content */}
            <View className="px-4 pb-4">
              {/* Brand info */}
              <View className="flex-row items-center gap-2 mb-1.5">
                <View className="w-4 h-4 rounded-full bg-pink-100 items-center justify-center">
                  <Text className="text-[8px] font-bold text-pink-600">
                    {item.brand[0]}
                  </Text>
                </View>
                <Text className="text-[11px] font-semibold text-slate-400">
                  {item.brand}
                </Text>
                <Text className="text-slate-300">·</Text>
                <View className="flex-row items-center gap-0.5">
                  <MapPin size={10} color="#94a3b8" />
                  <Text className="text-[10px] font-semibold text-slate-400">
                    {item.location}
                  </Text>
                </View>
              </View>

              <Text className="text-base font-bold text-slate-900 mb-1">
                {item.title}
              </Text>

              {/* Pay + Followers row */}
              <View className="flex-row items-center gap-3 mb-3">
                <View className="flex-row items-center gap-1">
                  <DollarSign size={12} color="#22c55e" />
                  <Text className="text-xs font-semibold text-slate-500">
                    {item.pay}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Users size={12} color="#3b82f6" />
                  <Text className="text-xs font-semibold text-slate-500">
                    {item.followers}
                  </Text>
                </View>
              </View>

              {/* Apply button */}
              <TouchableOpacity
                className="w-full"
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={['#8E2DE2', '#F6339A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <Text className="text-white text-sm font-bold">Apply</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}
        <View className="h-6" />
      </ScrollView>

      {/* ─── SORT MODAL ─── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4">
              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                className="p-2 rounded-full bg-slate-50"
              >
                <ChevronLeft size={20} color="#1e293b" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-slate-900">
                Sort Influencers
              </Text>
              <View className="w-9" />
            </View>

            {/* Options */}
            <View className="px-5 pb-2">
              {SORT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.label}
                  onPress={() => setSelectedSort(option.label)}
                  className="flex-row items-center justify-between py-3.5 px-1 border-b border-slate-50"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                        selectedSort === option.label
                          ? 'border-pink-500 bg-pink-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedSort === option.label && (
                        <Check size={12} color="white" />
                      )}
                    </View>
                    <View>
                      <Text
                        className={`text-sm font-semibold ${
                          selectedSort === option.label
                            ? 'text-slate-900'
                            : 'text-slate-600'
                        }`}
                      >
                        {option.label}
                      </Text>
                      {option.sub ? (
                        <Text className="text-[11px] text-slate-400">
                          {option.sub}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View className="flex-row gap-3 px-5 py-4 border-t border-slate-100">
              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 items-center"
              >
                <Text className="text-sm font-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                className="flex-1 overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={['#8E2DE2', '#F6339A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-white text-sm font-bold">Apply</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── FILTER MODAL ─── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4">
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="p-2 rounded-full bg-slate-50"
              >
                <ChevronLeft size={20} color="#1e293b" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-slate-900">Filters</Text>
              <View className="w-9" />
            </View>

            <ScrollView className="px-5 pb-4">
              {/* Category */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => toggleItem(setSelectedCategories, cat)}
                      className={`px-4 py-2 rounded-full border ${
                        selectedCategories.includes(cat)
                          ? 'border-transparent'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {selectedCategories.includes(cat) ? (
                        <LinearGradient
                          colors={['#8E2DE2', '#F6339A']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: 999,
                          }}
                        />
                      ) : null}
                      <Text
                        className={`text-xs font-semibold ${
                          selectedCategories.includes(cat)
                            ? 'text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Platform */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Platform
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PLATFORMS.map(platform => (
                    <TouchableOpacity
                      key={platform}
                      onPress={() => toggleItem(setSelectedPlatforms, platform)}
                      className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
                        selectedPlatforms.includes(platform)
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                      style={{ width: (width - 56) / 2 }}
                    >
                      {selectedPlatforms.includes(platform) && (
                        <Check size={14} color="#059669" />
                      )}
                      <Text
                        className={`text-xs font-semibold ${
                          selectedPlatforms.includes(platform)
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {platform}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Budget Range */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Budget Range
                </Text>
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="flex-1 flex-row items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                    <Text className="text-xs text-slate-400">₹</Text>
                    <TextInput
                      placeholder="Min"
                      placeholderTextColor="#94a3b8"
                      value={budgetMin}
                      onChangeText={setBudgetMin}
                      keyboardType="numeric"
                      className="flex-1 text-sm font-semibold text-slate-900"
                    />
                  </View>
                  <Text className="text-slate-300 text-xs">—</Text>
                  <View className="flex-1 flex-row items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                    <Text className="text-xs text-slate-400">₹</Text>
                    <TextInput
                      placeholder="Max"
                      placeholderTextColor="#94a3b8"
                      value={budgetMax}
                      onChangeText={setBudgetMax}
                      keyboardType="numeric"
                      className="flex-1 text-sm font-semibold text-slate-900"
                    />
                  </View>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <LinearGradient
                      colors={['#8E2DE2', '#F6339A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                    <Text className="text-white text-xs font-bold">Go</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {BUDGET_RANGES.map(range => (
                    <TouchableOpacity
                      key={range}
                      className="px-3 py-2 rounded-xl border border-slate-200"
                    >
                      <Text className="text-[11px] font-semibold text-slate-500">
                        {range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Content Type */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Content Type
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CONTENT_TYPES.map(type => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => toggleItem(setSelectedContentTypes, type)}
                      className={`px-4 py-2 rounded-full border ${
                        selectedContentTypes.includes(type)
                          ? 'border-transparent'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {selectedContentTypes.includes(type) ? (
                        <LinearGradient
                          colors={['#8E2DE2', '#F6339A']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: 999,
                          }}
                        />
                      ) : null}
                      <Text
                        className={`text-xs font-semibold ${
                          selectedContentTypes.includes(type)
                            ? 'text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="flex-row gap-3 px-5 py-4 border-t border-slate-100">
              <TouchableOpacity
                onPress={resetFilters}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 items-center"
              >
                <Text className="text-sm font-bold text-slate-600">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="flex-1 overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={['#8E2DE2', '#F6339A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-white text-sm font-bold">
                    Apply Filters
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── BUDGET MODAL ─── */}
      <Modal
        visible={showBudgetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4">
              <TouchableOpacity
                onPress={() => setShowBudgetModal(false)}
                className="p-2 rounded-full bg-slate-50"
              >
                <ChevronLeft size={20} color="#1e293b" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-slate-900">
                Budget Range
              </Text>
              <View className="w-9" />
            </View>

            <View className="px-5 pb-4">
              <View className="flex-row items-center gap-3 mb-4">
                <View className="flex-1 flex-row items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                  <Text className="text-xs text-slate-400">₹</Text>
                  <TextInput
                    placeholder="Min"
                    placeholderTextColor="#94a3b8"
                    value={budgetMin}
                    onChangeText={setBudgetMin}
                    keyboardType="numeric"
                    className="flex-1 text-sm font-semibold text-slate-900"
                  />
                </View>
                <Text className="text-slate-300 text-xs">—</Text>
                <View className="flex-1 flex-row items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                  <Text className="text-xs text-slate-400">₹</Text>
                  <TextInput
                    placeholder="Max"
                    placeholderTextColor="#94a3b8"
                    value={budgetMax}
                    onChangeText={setBudgetMax}
                    keyboardType="numeric"
                    className="flex-1 text-sm font-semibold text-slate-900"
                  />
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {BUDGET_RANGES.map(range => (
                  <TouchableOpacity
                    key={range}
                    className="px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <Text className="text-[11px] font-semibold text-slate-500">
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Footer */}
            <View className="flex-row gap-3 px-5 py-4 border-t border-slate-100">
              <TouchableOpacity
                onPress={() => {
                  setBudgetMin('');
                  setBudgetMax('');
                }}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 items-center"
              >
                <Text className="text-sm font-bold text-slate-600">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowBudgetModal(false)}
                className="flex-1 overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={['#8E2DE2', '#F6339A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-white text-sm font-bold">Apply</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── PLATFORM MODAL ─── */}
      <Modal
        visible={showPlatformModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlatformModal(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4">
              <TouchableOpacity
                onPress={() => setShowPlatformModal(false)}
                className="p-2 rounded-full bg-slate-50"
              >
                <ChevronLeft size={20} color="#1e293b" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-slate-900">Platform</Text>
              <View className="w-9" />
            </View>

            <View className="px-5 pb-4">
              <View className="flex-row flex-wrap gap-2">
                {PLATFORMS.map(platform => (
                  <TouchableOpacity
                    key={platform}
                    onPress={() => toggleItem(setSelectedPlatforms, platform)}
                    className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
                      selectedPlatforms.includes(platform)
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-slate-200'
                    }`}
                    style={{ width: (width - 56) / 2 }}
                  >
                    {selectedPlatforms.includes(platform) && (
                      <Check size={14} color="#059669" />
                    )}
                    <Text
                      className={`text-xs font-semibold ${
                        selectedPlatforms.includes(platform)
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {platform}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Footer */}
            <View className="flex-row gap-3 px-5 py-4 border-t border-slate-100">
              <TouchableOpacity
                onPress={() => setSelectedPlatforms([])}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 items-center"
              >
                <Text className="text-sm font-bold text-slate-600">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPlatformModal(false)}
                className="flex-1 overflow-hidden rounded-2xl"
              >
                <LinearGradient
                  colors={['#8E2DE2', '#F6339A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-white text-sm font-bold">Apply</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
