import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {MapPin, DollarSign, Users} from 'lucide-react-native';
import Animated, {FadeInUp} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY} from '@env';

const CATEGORIES = ['All', 'Beauty', 'Fashion', 'Travel', 'Tech', 'Food'];

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600',
];

interface Campaign {
  id: string;
  imageUrl: string;
  category: string;
  badge: string;
  brand: string;
  title: string;
  location: string;
  desc: string;
  pay: string;
  req: string;
}

export default function RecommendedCampaigns() {
  const [activeTab, setActiveTab] = useState('All');
  const [offers, setOffers] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/list-campaigns`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: '{}',
          },
        );
        const data = await res.json();
        if (data?.campaigns) {
          const active = data.campaigns
            .filter((c: any) => c.status === 'Active')
            .slice(0, 6);
          setOffers(
            active.map((c: any, i: number) => ({
              id: c.id,
              imageUrl: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
              category:
                c.tags?.[0]?.split(' ')?.[0] || 'General',
              badge:
                c.daysLeft && parseInt(c.daysLeft) <= 7
                  ? 'Ending Soon'
                  : 'Active',
              brand: c.brandName || 'Brand',
              title: c.title,
              location: c.location || 'Pan India',
              desc:
                c.description?.slice(0, 80) ||
                'Apply to collaborate with this brand.',
              pay: c.budget || '₹TBD',
              req: c.deliverables || 'Not specified',
            })),
          );
        }
      } catch {}
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  const filtered =
    activeTab === 'All'
      ? offers
      : offers.filter(o =>
          o.category.toLowerCase().includes(activeTab.toLowerCase()),
        );

  return (
    <View className="w-full py-8 bg-white">
      {/* Header */}
      <View className="px-5 mb-2">
        <Text className="text-xl font-black text-slate-900 uppercase tracking-tight">
          Recommended Campaigns
        </Text>
        <Text className="text-xs text-slate-400 font-medium mt-1">
          Opportunities matched to your creator profile
        </Text>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 12}}
        style={{marginBottom: 4}}>
        <View className="flex-row bg-slate-50 p-1.5 rounded-2xl border border-slate-100" style={{gap: 4}}>
          {CATEGORIES.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl ${
                activeTab === tab ? 'bg-white shadow-sm' : ''
              }`}>
              <Text
                className={`text-xs font-bold ${
                  activeTab === tab ? 'text-slate-900' : 'text-slate-400'
                }`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => navigation.navigate('InfluencerCampaigns')}
            className="px-3 py-2">
            <Text className="text-[#D61F69] text-xs font-bold">
              View All ›
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Campaign Cards */}
      {loading ? (
        <View className="py-16 items-center" style={{gap: 8}}>
          <ActivityIndicator size="large" color="#9810FA" />
          <Text className="text-sm font-bold text-slate-400">
            Loading campaigns...
          </Text>
        </View>
      ) : (
        <View className="px-4" style={{gap: 16}}>
          {filtered.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInUp.delay(index * 80).springify()}>
              <View className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                {/* Image */}
                <View className="h-52 p-3">
                  <View className="flex-1 rounded-3xl overflow-hidden relative">
                    <Image
                      source={{uri: item.imageUrl}}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {/* Category badge */}
                    <View className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full">
                      <Text className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">
                        {item.category}
                      </Text>
                    </View>
                    {/* Status badge */}
                    <View className="absolute top-3 right-3 bg-slate-900/80 px-2.5 py-1 rounded-full flex-row items-center" style={{gap: 4}}>
                      <View className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      <Text className="text-white text-[9px] font-bold">
                        {item.badge}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Content */}
                <View className="px-5 pb-6">
                  {/* Brand info */}
                  <View className="flex-row items-center mb-2" style={{gap: 6}}>
                    <View className="w-5 h-5 rounded-full bg-pink-100 items-center justify-center">
                      <Text className="text-[8px] font-bold text-pink-600">
                        {item.brand[0]}
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-400">
                      {item.brand}
                    </Text>
                    <Text className="text-slate-300">·</Text>
                    <View className="flex-row items-center" style={{gap: 2}}>
                      <MapPin size={10} color="#94A3B8" />
                      <Text className="text-[10px] font-bold text-slate-400">
                        {item.location}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-lg font-black text-slate-900 leading-tight mb-1">
                    {item.title}
                  </Text>
                  <Text className="text-xs text-slate-400 font-medium leading-relaxed mb-4">
                    {item.desc}
                  </Text>

                  {/* Pay & Req */}
                  <View className="flex-row mb-5" style={{gap: 8}}>
                    <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-50">
                      <View className="flex-row items-center mb-1" style={{gap: 4}}>
                        <DollarSign size={10} color="#22C55E" />
                        <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Pay
                        </Text>
                      </View>
                      <Text className="text-xs font-black text-slate-800">
                        {item.pay}
                      </Text>
                    </View>
                    <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-50">
                      <View className="flex-row items-center mb-1" style={{gap: 4}}>
                        <Users size={10} color="#3B82F6" />
                        <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Req
                        </Text>
                      </View>
                      <Text className="text-xs font-black text-slate-800" numberOfLines={1}>
                        {item.req}
                      </Text>
                    </View>
                  </View>

                  {/* Apply Button */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('InfluencerOfferDetail', {
                        id: item.id,
                      })
                    }>
                    <LinearGradient
                      colors={['#8E2DE2', '#F6339A']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={{borderRadius: 16, paddingVertical: 14}}
                      className="items-center">
                      <Text className="text-white text-xs font-black">
                        Apply Now
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ))}

          {filtered.length === 0 && !loading && (
            <View className="py-16 bg-slate-50 rounded-3xl items-center">
              <Text className="text-sm font-bold text-slate-400">
                No campaigns in this category
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
