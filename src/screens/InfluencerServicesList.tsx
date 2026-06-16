// All Services — discovery surface. Search, filter by tag and price band.
//
// Web parity: src/app/influencer/services/page.js. Edge function:
// `list-services` (empty body → all active rows).

import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Search, SlidersHorizontal, Star} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import InfluencerLayout from '../layouts/InfluencerLayout';
import {
  fetchServices,
  formatINR,
  iconForName,
  type ServiceRow,
} from '../lib/services';

type PriceBandId = 'any' | 'under-3k' | '3k-7k' | '7k-15k' | '15k-plus';

const PRICE_BANDS: {id: PriceBandId; label: string; test: (p: number) => boolean}[] = [
  {id: 'any', label: 'Any price', test: () => true},
  {id: 'under-3k', label: 'Under ₹3,000', test: p => p < 3000},
  {id: '3k-7k', label: '₹3K – ₹7K', test: p => p >= 3000 && p < 7000},
  {id: '7k-15k', label: '₹7K – ₹15K', test: p => p >= 7000 && p < 15000},
  {id: '15k-plus', label: '₹15K+', test: p => p >= 15000},
];

export default function InfluencerServicesList() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceBand, setPriceBand] = useState<PriceBandId>('any');
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await fetchServices();
      if (!cancelled) {
        setServices(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(services.map(s => s.tag).filter(Boolean))) as string[],
    [services],
  );

  const toggleTag = (t: string) =>
    setSelectedTags(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t],
    );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const band = PRICE_BANDS.find(b => b.id === priceBand) || PRICE_BANDS[0];
    return services.filter(s => {
      if (selectedTags.length && s.tag && !selectedTags.includes(s.tag)) return false;
      if (!band.test(s.price_starting || 0)) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.tag || '').toLowerCase().includes(q)
      );
    });
  }, [services, query, selectedTags, priceBand]);

  const hasActiveFilters =
    selectedTags.length > 0 || priceBand !== 'any' || query.trim().length > 0;

  return (
    <InfluencerLayout>
      <View className="flex-1" style={{backgroundColor: '#F5F4F8'}}>
        {/* Header — title left + filter icon right, matching the
            brands and campaigns list pages. */}
        <View className="px-4 pt-4 pb-2" style={{gap: 16}}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-slate-800">
                All Services
              </Text>
              <Text className="text-xs text-slate-400 mt-1 font-medium">
                Creator services brands are booking now
              </Text>
            </View>
            <View className="flex-row" style={{gap: 8}}>
              <TouchableOpacity
                onPress={() => navigation.navigate('InfluencerServiceOrders')}
                className="bg-pink-50 px-3 h-10 rounded-xl items-center justify-center">
                <Text className="text-xs font-bold text-pink-600">
                  My orders
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  /* TODO: open a FilterModal for tag + price band */
                }}
                className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 items-center justify-center">
                <SlidersHorizontal size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-xl px-4 h-11 shadow-sm border border-slate-100">
            <Search size={18} color="#94A3B8" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search services…"
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2 text-sm text-slate-700"
            />
          </View>

          {/* Price band */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{gap: 6}}>
            {PRICE_BANDS.map(b => {
              const active = priceBand === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setPriceBand(b.id)}
                  className={`px-3 py-1.5 rounded-full ${
                    active
                      ? 'bg-[#E60076]'
                      : 'bg-white border border-slate-200'
                  }`}>
                  <Text
                    className={`text-[11px] font-bold ${
                      active ? 'text-white' : 'text-slate-600'
                    }`}>
                    {b.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tag chips */}
          {allTags.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{gap: 6}}>
              {allTags.map(t => {
                const active = selectedTags.includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => toggleTag(t)}
                    className={`px-3 py-1.5 rounded-full ${
                      active
                        ? 'bg-purple-100 border border-purple-300'
                        : 'bg-white border border-slate-200'
                    }`}>
                    <Text
                      className={`text-[11px] font-bold ${
                        active ? 'text-purple-700' : 'text-slate-600'
                      }`}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          {hasActiveFilters ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedTags([]);
                setPriceBand('any');
                setQuery('');
              }}>
              <Text className="text-[11px] font-bold text-pink-500 underline">
                Clear filters
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* List */}
        <ScrollView
          contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 100, gap: 12}}
          showsVerticalScrollIndicator={false}>
          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator color="#E60076" size="large" />
            </View>
          ) : filtered.length === 0 ? (
            <View className="py-16 items-center" style={{gap: 6}}>
              <Text className="text-sm font-bold text-slate-600">
                No services match these filters
              </Text>
              <Text className="text-xs text-slate-400">
                Try widening the price band or clearing tags.
              </Text>
            </View>
          ) : (
            filtered.map(s => (
              <ServiceCard
                key={s.id}
                service={s}
                onPress={() =>
                  navigation.navigate('InfluencerServiceDetail', {
                    slug: s.slug || s.id,
                  })
                }
              />
            ))
          )}
        </ScrollView>
      </View>
    </InfluencerLayout>
  );
}

/* ─────────── Card ─────────── */

function ServiceCard({
  service,
  onPress,
}: {
  service: ServiceRow;
  onPress: () => void;
}) {
  const Icon = iconForName(service.icon_name);
  const ratingAvg = Number(service.rating_avg || 0);
  const reviewsCount = service.reviews_count || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Hero */}
      {service.featured_image_url ? (
        <Image
          source={{uri: service.featured_image_url}}
          className="w-full"
          style={{aspectRatio: 2.4 / 1, backgroundColor: '#f1f5f9'}}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['#9810FA', '#E60076']}
          style={{aspectRatio: 2.4 / 1, alignItems: 'center', justifyContent: 'center'}}>
          <Icon size={48} color="rgba(255,255,255,0.85)" />
        </LinearGradient>
      )}

      <View className="p-4" style={{gap: 8}}>
        <View className="flex-row items-center" style={{gap: 6}}>
          {service.tag ? (
            <View className="bg-rose-50 px-2 py-0.5 rounded-md">
              <Text className="text-[9px] font-black text-rose-600 uppercase">
                {service.tag}
              </Text>
            </View>
          ) : null}
          {ratingAvg > 0 ? (
            <View className="flex-row items-center" style={{gap: 4}}>
              <Star size={11} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-[11px] font-bold text-slate-700">
                {ratingAvg.toFixed(1)}
              </Text>
              <Text className="text-[10px] text-slate-400 font-semibold">
                ({reviewsCount})
              </Text>
            </View>
          ) : null}
        </View>

        <Text className="text-base font-black text-slate-900" numberOfLines={2}>
          {service.title}
        </Text>

        {service.description ? (
          <Text className="text-xs text-slate-500" numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}

        <View className="flex-row items-baseline mt-1" style={{gap: 6}}>
          <Text className="text-[10px] font-bold text-slate-400 uppercase">
            Starts at
          </Text>
          <Text className="text-base font-black text-pink-600">
            {formatINR(service.price_starting || 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
