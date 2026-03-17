import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { TrendingUp, Star, Box, Compass, Crown } from 'lucide-react-native';
import ProStatusCard from '../components/ProStatuscard';
import StackedDeals from '../components/StackedDeals';
import CompleteProfileCard from '../components/CompleteProfileCard';
import AiMediaKitCard from '../components/AIMediaKitCard';
import AiToolsGrid from '../components/AIToolsGrid';
import CreatorsLikeYou from '../components/CreatorsLikeYou';
import JourneyCarousel from '../components/JourneyCarousel';
import CommunityFeed from '../components/CommunityFeed';
import PerformanceDashboard from '../components/PerformanceDashboard';
import BrandsCarousel from '../components/BrandsCarousel';
import TopServices from '../components/TopServices';
import TopPicksCarousel from '../components/TopPicksCarousel';
import StayCarousel from '../components/StayCarousel';
import CreatorsCarouselWithLink from '../components/CreatorCarouselWithLink';
import InfluencerLayout from '../layouts/InfluencerLayout';

const CATEGORIES = [
  { id: 1, label: 'Trending', icon: TrendingUp, active: true },
  { id: 2, label: 'For You', icon: Star, active: false },
  { id: 3, label: 'Brands', icon: Box, active: false },
  { id: 4, label: 'Discover', icon: Compass, active: false },
  { id: 5, label: 'Top Creators', icon: Crown, active: false },
];

export default function HomeScreen() {
  return (
    <InfluencerLayout>
      <ScrollView className="flex-1 bg-white">
        {/* Pro Card */}
        <View className="px-5 mt-6">
          <ProStatusCard />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-6 px-4"
        >
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;

            return (
              <Pressable
                key={cat.id}
                className={`flex-row items-center mr-3 px-4 py-3 rounded-2xl ${
                  cat.active ? 'bg-pink-50' : 'bg-slate-100'
                }`}
              >
                <Icon size={18} color={cat.active ? '#ec4899' : '#64748b'} />

                <Text
                  className={`ml-2 text-sm font-semibold ${
                    cat.active ? 'text-pink-600' : 'text-slate-600'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Deals */}
        <View className="mt-6">
          <StackedDeals />
        </View>

        {/* Cards Section */}
        <View className="mt-6 flex items-center justify-center gap-6 space-y-5">
          <CompleteProfileCard />
          <AiMediaKitCard />
          <AiToolsGrid />
        </View>

        {/* Creator Section */}
        <View className="mt-6">
          <CreatorsLikeYou />
        </View>

        <JourneyCarousel />

        <CommunityFeed />

        <PerformanceDashboard />

        {/* Remaining Content */}
        <View className="mt-8 space-y-6">
          <BrandsCarousel />
          <TopServices />
          <TopPicksCarousel />
          <StayCarousel />
          <CreatorsCarouselWithLink />
        </View>

        <View className="h-20" />
      </ScrollView>
    </InfluencerLayout>
  );
}
