import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Bookmark, MapPin, DollarSign, Users } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// --- Constants to match image layout ---
const CARD_WIDTH = width * 0.75; // Allows the next card to peek
const CARD_MARGIN = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

interface Campaign {
  id: string;
  imageUrl: string;
  category: string;
  match: string;
  brand: string;
  title: string;
  location: string;
  pay: string;
  req: string;
}

const CATEGORIES = ['All', 'Beauty', 'Travel', 'Tech', 'Fashion'];

const DUMMY_OFFERS: Campaign[] = [
  {
    id: 'camp-001',
    imageUrl:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600',
    category: 'BEAUTY',
    match: '98% Match',
    brand: 'Glow Essential',
    title: 'Summer Radiance Campaign',
    location: 'New York',
    pay: '₹30k - 45k',
    req: '20k+ Followers',
  },
  {
    id: 'camp-002',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600',
    category: 'TRAVEL',
    match: '95% Match',
    brand: 'Blue Horizon',
    title: 'Luxury Bali Retreat',
    location: 'Bali',
    pay: '₹80k + Flights',
    req: 'Travel Niche',
  },
];

export default function RecommendedCarousel() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <View className="bg-white py-6">
      {/* 1. Header Section */}
      <View className="px-6 flex-row justify-between items-end mb-4">
        <View>
          <Text className="text-xl font-black text-slate-900 tracking-tight">
            Recommended
          </Text>
          <Text className="text-[11px] text-slate-400 font-bold">
            Opportunities matched to your creator profile
          </Text>
        </View>
        <TouchableOpacity>
          <Text className="text-pink-600 font-black text-xs uppercase">
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, marginBottom: 20 }}
      >
        {CATEGORIES.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`mr-3 px-6 py-2.5 rounded-full border ${
              activeTab === tab
                ? 'bg-slate-900 border-slate-900'
                : 'bg-white border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${activeTab === tab ? 'text-white' : 'text-slate-600'}`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 3. Horizontal Card List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {DUMMY_OFFERS.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInRight.delay(index * 100)}
            style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
          >
            {/* Top Image Card */}
            <View className="h-48 relative">
              <Image
                source={{ uri: item.imageUrl }}
                className="w-full h-full"
              />

              {/* Category Badge */}
              <View className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-lg">
                <Text className="text-[10px] font-black text-slate-800 tracking-widest">
                  {item.category}
                </Text>
              </View>

              {/* Match Percentage Badge */}
              <View className="absolute bottom-4 left-4 bg-[#00C897] px-2 py-1 rounded-md">
                <Text className="text-white text-[10px] font-black">
                  {item.match}
                </Text>
              </View>
            </View>

            {/* Bottom Content Card */}
            <View className="p-5">
              <Text className="text-lg font-black text-slate-800 leading-tight mb-1">
                {item.title}
              </Text>

              <View className="flex-row items-center mb-4">
                <Text className="text-[10px] font-bold text-slate-400">
                  {item.brand}
                </Text>
                <View className="mx-1.5 w-1 h-1 rounded-full bg-slate-300" />
                <MapPin size={10} color="#94a3b8" />
                <Text className="text-[10px] font-bold text-slate-400 ml-0.5">
                  {item.location}
                </Text>
              </View>

              {/* Details Row */}
              <View className="flex-row justify-between bg-slate-50 rounded-2xl p-3 mb-5">
                <View>
                  <View className="flex-row items-center mb-0.5">
                    <DollarSign size={10} color="#00C897" />
                    <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      Pay
                    </Text>
                  </View>
                  <Text className="text-xs font-black text-slate-800">
                    {item.pay}
                  </Text>
                </View>

                <View className="w-[1px] bg-slate-200" />

                <View>
                  <View className="flex-row items-center mb-0.5">
                    <Users size={10} color="#3b82f6" />
                    <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      Req
                    </Text>
                  </View>
                  <Text className="text-xs font-black text-slate-800">
                    {item.req}
                  </Text>
                </View>
              </View>

              {/* Action Row */}
              <View className="flex-row gap-x-2">
                <TouchableOpacity className="flex-1">
                  <LinearGradient
                    colors={['#9810fa', '#e60076']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-3.5 rounded-2xl items-center"
                    style={{
                      borderRadius: 16,
                      paddingBottom: 14,
                      paddingTop: 14,
                    }}
                  >
                    <Text className="text-white font-black text-xs">Apply</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity className="aspect-square border border-slate-200 rounded-2xl items-center justify-center px-4">
                  <Bookmark size={18} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
