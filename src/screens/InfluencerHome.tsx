import React, {useState, useRef} from 'react';
import {View, Text, ScrollView, Pressable} from 'react-native';
import {TrendingUp, Star, Box, Compass, Crown} from 'lucide-react-native';
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
import InfluencerLayout from '../layouts/InfluencerLayout';

const CATEGORIES = [
  {id: 1, label: 'Trending', icon: TrendingUp, target: 'trending'},
  {id: 2, label: 'For You', icon: Star, target: 'for-you'},
  {id: 3, label: 'Brands', icon: Box, target: 'brands'},
  {id: 4, label: 'Top Services', icon: Compass, target: 'top-services'},
  {id: 5, label: 'Top Creators', icon: Crown, target: 'top-creators'},
];

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('trending');
  const scrollRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});

  const handleCategoryPress = (target: string) => {
    setActiveCategory(target);
    const y = sectionPositions.current[target];
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({y, animated: true});
    }
  };

  const onSectionLayout = (target: string, y: number) => {
    sectionPositions.current[target] = y;
  };

  return (
    <InfluencerLayout>
      <ScrollView ref={scrollRef} className="flex-1 bg-white">
        {/* Pro Status Card */}
        <View className="px-5 mt-6">
          <ProStatusCard />
        </View>

        {/* Instagram Reconnect Banner */}
        <View className="mt-4">
          <InstagramReconnectBanner
            instagramTokenMissing={false}
          />
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
                onPress={() => handleCategoryPress(cat.target)}
                className={`flex-row items-center mr-3 px-4 py-3 rounded-2xl ${
                  isActive ? 'bg-pink-50' : 'bg-slate-100'
                }`}>
                <Icon
                  size={18}
                  color={isActive ? '#ec4899' : '#64748b'}
                />
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

        {/* Profile Cards Row — Media Kit first on mobile (matches web order) */}
        <View className="mt-6 px-4" style={{gap: 20}}>
          <AiMediaKitCard />
          <CompleteProfileCard />
          <AiToolsGrid />
        </View>

        {/* Creators Like You */}
        <View
          className="mt-6"
          onLayout={e =>
            onSectionLayout('trending', e.nativeEvent.layout.y)
          }>
          <CreatorsLikeYou />
        </View>

        {/* Journey Carousel (For You) */}
        <View
          onLayout={e =>
            onSectionLayout('for-you', e.nativeEvent.layout.y)
          }>
          <JourneyCarousel />
        </View>

        {/* Community Feed */}
        <CommunityFeed />

        {/* Performance Dashboard */}
        <PerformanceDashboard />

        {/* Bottom Sections */}
        <View style={{gap: 24}}>
          {/* Brands */}
          <View
            onLayout={e =>
              onSectionLayout('brands', e.nativeEvent.layout.y)
            }>
            <BrandsCarousel />
          </View>

          {/* Top Services */}
          <View
            onLayout={e =>
              onSectionLayout('top-services', e.nativeEvent.layout.y)
            }>
            <TopServices />
          </View>

          <TopPicksCarousel />
          <StayCarousel />

          {/* Top Creators */}
          <View
            onLayout={e =>
              onSectionLayout('top-creators', e.nativeEvent.layout.y)
            }>
            <CreatorsCarouselWithLink />
          </View>
        </View>

        {/* Bottom spacer for nav */}
        <View className="h-20" />
      </ScrollView>
    </InfluencerLayout>
  );
}
