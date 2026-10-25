import React, {useCallback, useRef, useState} from 'react';
import {View, Text} from 'react-native';
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
import {REWARDS_ENABLED} from '../lib/features';
import WelcomeRewardModal from '../components/WelcomeRewardModal';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {BRAND_GRADIENT_WARM} from '../theme/brand';

function HomeContent() {
  const layoutScroll = useLayoutScroll();
  const sectionYs = useRef<Record<string, number>>({});
  // AuthContext flips instagramTokenMissing when refresh-instagram returns
  // "No token stored" / "token expired". Pull those + the userId here so
  // the banner can both render and complete a re-connect via update-profile.
  const {user, instagramTokenMissing, setInstagramTokenMissing, refreshInstagram} = useAuth();
  const {t} = useTranslation();

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

  // Everything about YOUR account — plan, Instagram health, profile
  // completion, AI usage, referral balance — is meaningless to a visitor who
  // has no account. The catalogue below it is the part that is public, and
  // it is what a guest (and an App Store reviewer) sees first.
  const signedIn = !!user?.id;

  return (
    <>
      {signedIn && (
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
        </>
      )}

      {/* Refer & Earn wallet strip — self-hides when balance is 0.
          Hidden entirely while the rewards programme is off: store billing
          cannot honour RC as a discount, so showing a balance would promise
          something no checkout can deliver. See lib/features.ts. */}
      {REWARDS_ENABLED && signedIn && (
        <View className="mt-4 px-4">
          <ReferBalanceCard />
        </View>
      )}

      {/* The guest's version of the Pro card: says what this place is and
          where the account wall actually falls, so the page does not open
          with a gap and nobody is surprised later. */}
      {!signedIn && (
        <View className="px-5 mt-6">
          <View
            className="rounded-3xl px-5 py-4 overflow-hidden"
            style={{gap: 4}}>
            <LinearGradient
              colors={[...BRAND_GRADIENT_WARM]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Text className="text-white text-[15px] font-black">
              {t('InfluencerHome.guestTitle')}
            </Text>
            <Text className="text-[12px]" style={{color: 'rgba(255,255,255,0.9)'}}>
              {t('InfluencerHome.guestBody')}
            </Text>
          </View>
        </View>
      )}

      {/* Quick Links — replaces the chip-row category filters */}
      <QuickLinks onScroll={scrollToSection} />

      {/* Deal of the Day */}
      <View className="mt-6">
        <DealOfDayCarousel />
      </View>

      {/* Profile Cards Row — Get Your First Brand Deal → AI Media Kit →
          AI Creator Tools (live Content Studio, mirrors the web home).
          All three act on your own profile, so they wait for an account. */}
      {signedIn && (
      <View className="mt-6 px-4" style={{gap: 20}}>
        <CompleteProfileCard />
        <AiMediaKitCard />
        <AiToolsGrid />
      </View>
      )}

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
