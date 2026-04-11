import React, {useState, useRef} from 'react';
import {View, Text, ScrollView, Pressable} from 'react-native';
import {TrendingUp, Star, Box, Compass, Crown} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import ProStatusCard from '../components/ProStatuscard';
import InstagramReconnectBanner from '../components/InstagramReconnectBanner';
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
import InfluencerLayout, {useLayoutScroll} from '../layouts/InfluencerLayout';

const CATEGORIES = [
  {id: 1, label: 'Trending', icon: TrendingUp, target: 'trending', action: 'scroll' as const},
  {id: 2, label: 'For You', icon: Star, target: 'for-you', action: 'scroll' as const},
  {id: 3, label: 'Brands', icon: Box, target: 'brands', action: 'navigate' as const},
  {id: 4, label: 'Top Services', icon: Compass, target: 'top-services', action: 'scroll' as const},
  {id: 5, label: 'Top Creators', icon: Crown, target: 'top-creators', action: 'scroll' as const},
];

function HomeContent() {
  const navigation = useNavigation<any>();
  const layoutScroll = useLayoutScroll();
  const [activeCategory, setActiveCategory] = useState('trending');
  const sectionYs = useRef<Record<string, number>>({});

  const handleCategoryPress = (cat: typeof CATEGORIES[number]) => {
    if (cat.action === 'navigate') {
      navigation.navigate('InfluencerSearch');
      return;
    }
    setActiveCategory(cat.target);
    const y = sectionYs.current[cat.target];
    if (y !== undefined && layoutScroll?.current) {
      layoutScroll.current.scrollTo({y, animated: true});
    }
  };

  return (
    <>
      {/* Pro Status Card */}
      <View className="px-5 mt-6">
        <ProStatusCard />
      </View>

      {/* Instagram Reconnect Banner */}
      <View className="mt-4">
        <InstagramReconnectBanner instagramTokenMissing={false} />
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4 px-4">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.target;

          return (
            <Pressable
              key={cat.id}
              onPress={() => handleCategoryPress(cat)}
              className={`flex-row items-center mr-3 px-4 py-3 rounded-2xl ${
                isActive ? 'bg-pink-50' : 'bg-slate-100'
              }`}>
              <Icon size={18} color={isActive ? '#ec4899' : '#64748b'} />
              <Text
                className={`ml-2 text-sm font-semibold ${
                  isActive ? 'text-pink-600' : 'text-slate-600'
                }`}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Stacked Deals */}
      <View className="mt-6">
        <StackedDeals />
      </View>

      {/* Profile Cards Row */}
      <View className="mt-6 px-4" style={{gap: 20}}>
        <AiMediaKitCard />
        <CompleteProfileCard />
        <AiToolsGrid />
      </View>

      {/* Creators Like You (Trending) */}
      <View
        className="mt-6"
        onLayout={e => {
          (e.target as any).measureInWindow((_x: number, y: number) => {
            sectionYs.current['trending'] = y;
          });
        }}>
        <CreatorsLikeYou />
      </View>

      {/* Journey Carousel (For You) */}
      <View
        onLayout={e => {
          (e.target as any).measureInWindow((_x: number, y: number) => {
            sectionYs.current['for-you'] = y;
          });
        }}>
        <JourneyCarousel />
      </View>

      {/* Community Feed */}
      <CommunityFeed />

      {/* Performance Dashboard */}
      <PerformanceDashboard />

      {/* Bottom Sections */}
      <BrandsCarousel />

      <View
        onLayout={e => {
          (e.target as any).measureInWindow((_x: number, y: number) => {
            sectionYs.current['top-services'] = y;
          });
        }}>
        <TopServices />
      </View>

      <TopPicksCarousel />
      <StayCarousel />

      <View
        onLayout={e => {
          (e.target as any).measureInWindow((_x: number, y: number) => {
            sectionYs.current['top-creators'] = y;
          });
        }}>
        <CreatorsCarouselWithLink />
      </View>

      {/* Bottom spacer */}
      <View className="h-20" />
    </>
  );
}

export default function HomeScreen() {
  return (
    <InfluencerLayout>
      <HomeContent />
    </InfluencerLayout>
  );
}
