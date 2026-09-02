import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Headphones } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import BrandHero from '../components/BrandHero';
import BrandStatRow from '../components/brands/BrandStatRow';
import { CategorySection } from '../components/CategorySection';
import { TopCreatorsCarousel } from '../components/TopCreatorCarousel';
import { RecentlyConnected } from '../components/RecentlyConnected';
import { CreatorsByLocation } from '../components/CreatorsByLocation';
import { BeyondInfluencers } from '../components/BeyondInfluencers';
import CreatorStories from '../components/CreatorStories';
import PocketFriendlyCreators from '../components/PocketFriendlyCreators';
import { CreatorCTASection } from '../components/CreatorCTASection';
import BrandSupportChatModal from '../components/BrandSupportChatModal';
import BrandMatchPrompt from '../components/brands/BrandMatchPrompt';
import { HOME_BG } from '../theme/brandHome';

import BrandsLayout from '../layouts/BrandLayout';

export default function BrandHome() {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <View className="flex-1">
      <BrandsLayout>
        {/* Redesigned Home feed (RGossips Explore): navy + violet→blue language
            on a light ground. Above-the-fold is the new top bar → AI-matching
            hero → trust stat row; the sections below carry over for now. */}
        <View style={{ backgroundColor: HOME_BG }}>
          <BrandHero onSupport={() => setSupportOpen(true)} />
          <View style={{ height: 12 }} />
          <BrandMatchPrompt />
          <View style={{ height: 14 }} />
          <BrandStatRow />
          {/* Sections self-pad (14px) and span full width — no parent padding. */}
          <View className="w-full gap-8 pt-8">
            <CategorySection />

            <BeyondInfluencers />

            <TopCreatorsCarousel />

            <RecentlyConnected />

            <CreatorsByLocation />

            <PocketFriendlyCreators />

            <CreatorStories />

            <CreatorCTASection />
          </View>
        </View>
      </BrandsLayout>

      {/* Floating Help & Support trigger — sits above the bottom nav (h-16).
          BrandsLayout scrolls its children, so the button lives outside it. */}
      <Pressable
        onPress={() => setSupportOpen(true)}
        style={{
          position: 'absolute',
          right: 16,
          bottom: 84,
          borderRadius: 24,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}>
        <LinearGradient
          colors={['#5851DB', '#4A3996']}
          style={{
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Headphones size={20} color="#fff" />
        </LinearGradient>
      </Pressable>

      {/* Brand support decision-tree chat — mirrors web's BrandSupportChat. */}
      <BrandSupportChatModal
        visible={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </View>
  );
}
