import React, {useCallback, useRef, useState} from 'react';
import {View} from 'react-native';
import ProStatusCard from '../components/ProStatuscard';
import InstagramReconnectBanner from '../components/InstagramReconnectBanner';
import {useAuth} from '../context/AuthContext';
import DealOfDayCarousel from '../components/DealOfDayCarousel';
import QuickLinks from '../components/QuickLinks';
import CompleteProfileCard from '../components/CompleteProfileCard';
import AiMediaKitCard from '../components/AIMediaKitCard';
import AiToolsGrid from '../components/AIToolsGrid';
import BrandsCarousel from '../components/BrandsCarousel';
import TopServices from '../components/TopServices';
import TopPicksCarousel from '../components/TopPicksCarousel';
import StayCarousel from '../components/StayCarousel';
import CreatorsCarouselWithLink from '../components/CreatorCarouselWithLink';
import InfluencerLayout, {useLayoutScroll} from '../layouts/InfluencerLayout';
import ReferBalanceCard from '../components/ReferBalanceCard';
import WelcomeRewardModal from '../components/WelcomeRewardModal';

function HomeContent() {
  const layoutScroll = useLayoutScroll();
  const sectionYs = useRef<Record<string, number>>({});
  // AuthContext flips instagramTokenMissing when refresh-instagram returns
  // "No token stored" / "token expired". Pull those + the userId here so
  // the banner can both render and complete a re-connect via update-profile.
  const {user, instagramTokenMissing, setInstagramTokenMissing, refreshInstagram} = useAuth();

  const scrollToSection = (key: string) => {
    const y = sectionYs.current[key];
    if (y !== undefined && layoutScroll?.current) {
      layoutScroll.current.scrollTo({y, animated: true});
    }
  };

  const setSectionY = (key: string) => (e: any) => {
    (e.target as any).measureInWindow((_x: number, y: number) => {
      sectionYs.current[key] = y;
    });
  };

  return (
    <>
      {/* Pro Status Card */}
      <View className="px-5 mt-6">
        <ProStatusCard />
      </View>

      {/* Instagram Reconnect Banner */}
      <View className="mt-4">
        <InstagramReconnectBanner
          userId={user?.id}
          instagramTokenMissing={instagramTokenMissing}
          onReconnected={() => {
            // Clear the flag locally and re-pull fresh IG data so the home
            // page reflects the reconnected profile without a manual reload.
            setInstagramTokenMissing(false);
            if (user?.id) refreshInstagram(user.id);
          }}
        />
      </View>

      {/* First-time welcome-reward celebration for new signups. */}
      <WelcomeRewardModal />

      {/* Refer & Earn wallet strip — self-hides when balance is 0. */}
      <View className="mt-4 px-4">
        <ReferBalanceCard />
      </View>

      {/* Quick Links — replaces the chip-row category filters */}
      <QuickLinks onScroll={scrollToSection} />

      {/* Deal of the Day */}
      <View className="mt-6">
        <DealOfDayCarousel />
      </View>

      {/* Profile Cards Row — Get Your First Brand Deal → AI Media Kit →
          AI Creator Tools (live Content Studio, mirrors the web home). */}
      <View className="mt-6 px-4" style={{gap: 20}}>
        <CompleteProfileCard />
        <AiMediaKitCard />
        <AiToolsGrid />
      </View>

      {/* Brands Carousel */}
      <BrandsCarousel />

      {/* Top Services */}
      <View onLayout={setSectionY('top-services')}>
        <TopServices />
      </View>

      {/* Campaigns For You */}
      <View onLayout={setSectionY('recommended-campaigns')}>
        <TopPicksCarousel />
      </View>

      {/* Plan Your Stay */}
      <StayCarousel />

      {/* Top Creators */}
      <View className="mt-8" onLayout={setSectionY('top-creators')}>
        <CreatorsCarouselWithLink />
      </View>
    </>
  );
}

function HomeWithRefresh() {
  const {refreshProfile, refreshInstagram, user} = useAuth();
  // Bumping this key forces every fetch-on-mount component (carousels,
  // services, brands, top picks) to re-run their useEffect. Mounted as a
  // <React.Fragment key=...> wrapper around HomeContent below.
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1);
    await Promise.allSettled([
      refreshProfile(),
      user?.id ? refreshInstagram(user.id) : Promise.resolve(),
    ]);
  }, [refreshProfile, refreshInstagram, user?.id]);

  return (
    <InfluencerLayout onRefresh={handleRefresh}>
      <React.Fragment key={refreshKey}>
        <HomeContent />
      </React.Fragment>
    </InfluencerLayout>
  );
}

export default function HomeScreen() {
  return <HomeWithRefresh />;
}
