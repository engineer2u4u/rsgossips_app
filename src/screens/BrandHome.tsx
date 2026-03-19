import React from 'react';
import { View } from 'react-native';

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

import BrandsLayout from '../layouts/BrandLayout';

export default function BrandHome() {
  return (
    <BrandsLayout>
      <View>
        <BrandHero />
      </View>
      <View className="w-full items-center gap-8 px-4 py-6">
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
  );
}
