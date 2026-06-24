import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Carousel, {type ICarouselInstance} from 'react-native-reanimated-carousel';
import {useNavigation} from '@react-navigation/native';
import {Sparkles, MapPin} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {BRAND, BRAND_GRADIENT_WARM} from '../theme/brand';
import {invokeFn} from '../lib/api';

interface Stay {
  id: string;
  displayTitle: string;
  brandName: string;
  description: string;
  location: string;
  imageUrl: string;
  priceType: string;
  brand: {instagramFollowers: string};
}

const {width} = Dimensions.get('window');

const DEFAULT_TITLE = 'Plan your stay with us';

// Fallback shown while list-featured-campaigns (section: "stay") has no
// active rows — mirrors the web FALLBACK_STAYS.
const FALLBACK_STAYS: Stay[] = [
  {
    id: 'stay-1',
    displayTitle: 'The Azure Glass Resort',
    brandName: 'Azure Hospitality',
    description: 'Luxury overwater villa partnerships',
    location: 'Maldives, Indian Ocean',
    imageUrl:
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800',
    priceType: 'Full Collab',
    brand: {instagramFollowers: '120K'},
  },
  {
    id: 'stay-2',
    displayTitle: 'Urban Oasis Suites',
    brandName: 'Urban Oasis',
    description: 'City escapes for lifestyle creators',
    location: 'Downtown Tokyo, Japan',
    imageUrl:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800',
    priceType: 'Gifting',
    brand: {instagramFollowers: '45K'},
  },
  {
    id: 'stay-3',
    displayTitle: 'Alpine Heritage Lodge',
    brandName: 'Heritage Alps',
    description: 'Boutique alpine retreats',
    location: 'Zermatt, Switzerland',
    imageUrl:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800',
    priceType: 'Paid Stay',
    brand: {instagramFollowers: '88K'},
  },
  {
    id: 'stay-4',
    displayTitle: 'Terrace Palms Boutique',
    brandName: 'Terrace Palms',
    description: 'Moroccan riad collabs',
    location: 'Marrakech, Morocco',
    imageUrl:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800',
    priceType: 'Full Collab',
    brand: {instagramFollowers: '250K'},
  },
];

// StayCard mirrors the DealOfDay card: full-bleed image with a dark gradient
// veil top + bottom, a brand chip + secondary location chip at the top, and
// the title + short description + Apply gradient button anchored to the
// bottom. Tap anywhere on the card → open the offer detail (mirrors web).
function StayCard({stay}: {stay: Stay}) {
  const navigation = useNavigation<any>();
  const openOffer = () =>
    navigation.navigate('InfluencerOfferDetail', {id: stay.id});

  return (
    <Pressable
      onPress={openOffer}
      className="rounded-[28px] overflow-hidden border border-slate-100"
      style={{
        height: 360,
        marginRight: 12,
        backgroundColor: '#fff',
        shadowColor: '#19162b',
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: {width: 0, height: 10},
        elevation: 6,
      }}>
      <Image
        source={{uri: stay.imageUrl}}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
      />

      <LinearGradient
        colors={['rgba(10,6,20,0.34)', 'transparent', 'transparent', 'rgba(10,6,20,0.82)']}
        locations={[0, 0.3, 0.5, 1]}
        style={{position: 'absolute', inset: 0}}
      />

      <View
        className="flex-row justify-between items-start"
        style={{position: 'absolute', top: 14, left: 14, right: 14, gap: 8}}>
        <View
          className="flex-row items-center bg-slate-900/65 rounded-full px-3 py-1.5"
          style={{gap: 6, flexShrink: 1}}>
          <Sparkles size={12} color="#fff" />
          <Text
            className="text-white text-[10px] font-black uppercase tracking-widest"
            numberOfLines={1}
            style={{flexShrink: 1}}>
            {stay.brandName || stay.priceType || 'Featured'}
          </Text>
        </View>
        {!!stay.location && (
          <View
            className="flex-row items-center bg-white/95 rounded-full px-3 py-1.5"
            style={{gap: 5}}>
            <MapPin size={12} color="#19162b" />
            <Text
              className="text-[11px] font-bold text-slate-900"
              numberOfLines={1}
              style={{maxWidth: 130}}>
              {stay.location}
            </Text>
          </View>
        )}
      </View>

      <View style={{position: 'absolute', left: 16, right: 16, bottom: 16}}>
        <Text
          className="text-white text-2xl font-black leading-tight mb-1"
          numberOfLines={2}>
          {stay.displayTitle}
        </Text>
        {!!stay.description && (
          <Text
            className="text-white/85 text-[12px] font-medium mb-3"
            numberOfLines={2}>
            {stay.description}
          </Text>
        )}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={openOffer}
          style={{borderRadius: 14, paddingVertical: 13, overflow: 'hidden'}}>
          <LinearGradient
            colors={[...BRAND_GRADIENT_WARM]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <Text className="text-white text-center text-[13px] font-black uppercase tracking-widest">
            Apply Now
          </Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

export default function StayCarousel() {
  const carouselRef = useRef<ICarouselInstance>(null);
  const [active, setActive] = useState(0);
  const [stays, setStays] = useState<Stay[]>([]);
  const [sectionTitle, setSectionTitle] = useState(DEFAULT_TITLE);
  const [loading, setLoading] = useState(true);
  const CARD_W = width - 56;

  // Mirrors web StayCarousel: hits list-featured-campaigns with
  // {section: "stay"} so the backend can return a curated subset (vs the
  // generic deal-of-day list) and lets the BE control the section title.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{
          sectionTitle?: string;
          campaigns?: any[];
        }>('list-featured-campaigns', {section: 'stay'});
        if (cancelled) return;
        if (data?.sectionTitle) setSectionTitle(data.sectionTitle);
        if (Array.isArray(data?.campaigns) && data.campaigns.length > 0) {
          setStays(
            data.campaigns.map((c: any) => ({
              id: c.id,
              displayTitle: c.title || 'Featured Stay',
              brandName: c.brandName || '',
              // Trimmed to ~60 chars so it fits the two-line description
              // under the title without wrapping further. Falls back to
              // the campaign category, then a generic label.
              description:
                (c.description || '').slice(0, 60) ||
                c.category ||
                'Brand Collab',
              location: c.location || '',
              imageUrl: c.bannerImage || c.brandLogo || '',
              priceType: c.priceType || '',
              brand: {
                instagramFollowers: c.brandInstagram
                  ? `@${c.brandInstagram}`
                  : '',
              },
            })),
          );
        } else {
          setStays(FALLBACK_STAYS);
        }
      } catch {
        if (!cancelled) setStays(FALLBACK_STAYS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View
        className="w-full items-center justify-center"
        style={{height: 380}}>
        <ActivityIndicator size="large" color={BRAND.accent} />
        <Text className="mt-3 text-sm font-medium text-slate-400">
          Finding your next stay…
        </Text>
      </View>
    );
  }

  if (!stays.length) return null;

  return (
    <View className="w-full mt-2">
      <View className="flex-row items-center justify-between px-5 mb-3">
        <Text
          className="text-xl font-black text-slate-900 tracking-tight"
          numberOfLines={1}>
          {sectionTitle}
        </Text>
      </View>

      <Carousel
        ref={carouselRef}
        width={CARD_W + 12}
        height={376}
        style={{width, paddingLeft: 20}}
        data={stays}
        loop
        autoPlay
        autoPlayInterval={5500}
        scrollAnimationDuration={500}
        onSnapToItem={i => setActive(i)}
        // Let vertical pans bubble to the page ScrollView so the home page
        // keeps scrolling smoothly through this slider — same pattern Deal
        // of the Day uses.
        onConfigurePanGesture={g =>
          g.activeOffsetX([-10, 10]).failOffsetY([-5, 5])
        }
        renderItem={({item}: {item: Stay}) => (
          <View style={{width: CARD_W}}>
            <StayCard stay={item} />
          </View>
        )}
      />

      <View className="flex-row justify-center mt-4" style={{gap: 6}}>
        {stays.map((_, i) => (
          <Pressable
            key={i}
            onPress={() =>
              carouselRef.current?.scrollTo({index: i, animated: true})
            }
            style={{
              width: active === i ? 22 : 7,
              height: 7,
              borderRadius: 9,
              backgroundColor:
                active === i ? BRAND.accent : 'rgba(25,22,43,0.13)',
            }}
          />
        ))}
      </View>
    </View>
  );
}
