import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Headphones } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import BrandHero from '../components/BrandHero';
import { TrustSection } from '../components/TrustSection';
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

import BrandsLayout from '../layouts/BrandLayout';

export default function BrandHome() {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <View className="flex-1">
      <BrandsLayout>
        <View>
          <BrandHero />
        </View>
        <View className="w-full items-center gap-8 px-4 py-6">
          <BrandMatchPrompt />
          <TrustSection />
          <CategorySection />

          <TopCreatorsCarousel />

          <RecentlyConnected />

          <CreatorsByLocation />

          <BeyondInfluencers />

          <CreatorStories />

          <PocketFriendlyCreators />

          <CreatorCTASection />
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
