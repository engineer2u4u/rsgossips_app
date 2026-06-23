import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { MapPin, DollarSign, Users } from 'lucide-react-native';
import Carousel, {
  type ICarouselInstance,
} from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { invokeFn } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { scoreCampaignForUser } from '../utils/matchScore';
import { BRAND, BRAND_GRADIENT_WARM, CARD_SHADOW } from '../theme/brand';

const { width } = Dimensions.get('window');

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600',
];

interface Campaign {
  id: string;
  imageUrl: string;
  category: string;
  badge: string;
  match: number;
  brand: string;
  title: string;
  location: string;
  desc: string;
  pay: string;
  req: string;
}

export default function RecommendedCampaigns() {
  const navigation = useNavigation<any>();
  const { profile, user } = useAuth();
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);

  const userCategories = useMemo(
    () => profile?.categories || [],
    [profile?.categories],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{ campaigns?: any[] }>('list-campaigns', {
          influencerId: user?.id || null,
        });
        if (cancelled) return;
        if (Array.isArray(data?.campaigns)) setAllCampaigns(data.campaigns);
      } catch {
        // Leave the list empty on error.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Rank by tiered fit: exact-category first, then partial, then indirect,
  // within each tier by overall match %. Campaigns the creator already
  // applied to are dropped entirely. Mirrors web's TopPicksCarousel.
  const filteredOffers: Campaign[] = useMemo(() => {
    const eligible = allCampaigns.filter(
      c => c.status === 'Active' && !c.applicationStatus && !c.isExpired,
    );

    const scored = eligible.map(c => {
      const { score, categoryTier } = scoreCampaignForUser(profile, c);
      return { c, score, categoryTier };
    });

    const visible =
      userCategories.length > 0
        ? scored.filter(s => s.categoryTier >= 1)
        : scored;

    visible.sort((a, b) => {
      if (b.categoryTier !== a.categoryTier)
        return b.categoryTier - a.categoryTier;
      return b.score - a.score;
    });

    return visible.slice(0, 6).map(({ c, score }, i) => ({
      id: c.id,
      imageUrl:
        c.bannerImage || PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
      category: c.tags?.[0] || 'General',
      badge:
        c.daysLeft && parseInt(c.daysLeft, 10) <= 7 ? 'Ending Soon' : 'Active',
      match: score,
      brand: c.brandName || 'Brand',
      title: c.title,
      location: c.location || 'Pan India',
      desc:
        c.description?.slice(0, 70) || 'Apply to collaborate with this brand.',
      pay: c.budget || '₹TBD',
      req: c.deliverables || 'Not specified',
    }));
  }, [allCampaigns, userCategories, profile]);

  const subtitle =
    userCategories.length > 0
      ? `Matched to your niche — ${userCategories.slice(0, 3).join(', ')}${
          userCategories.length > 3 ? ` +${userCategories.length - 3}` : ''
        }`
      : 'Opportunities matched to your creator profile';

  // Card width tracks the Deal-of-the-Day carousel so the two sliders line
  // up visually. CARD_W is the actual card width; the carousel width adds
  // a small gap so peeking-next-card looks intentional.
  const CARD_W = width - 56;
  const CAROUSEL_HEIGHT = 430;

  return (
    <View className="w-full py-8">
      {/* Header */}
      <View className="px-5 mb-6 flex-row justify-between items-start">
        <View className="flex-1 pr-3">
          <Text className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Campaigns for you
          </Text>
          <Text className="text-xs text-slate-400 font-medium mt-1">
            {subtitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('InfluencerCampaigns', {
              // Pre-select the same niche filters this carousel uses, so
              // "View all" surfaces a superset of the cards already shown.
              categories: userCategories,
            })
          }
        >
          <Text className="text-sm font-bold" style={{ color: BRAND.accent }}>
            View all ›
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="py-16 items-center" style={{ gap: 8 }}>
          <ActivityIndicator size="large" color={BRAND.accent} />
          <Text className="text-sm font-bold text-slate-400">
            Loading campaigns...
          </Text>
        </View>
      ) : filteredOffers.length === 0 ? (
        <View className="mx-4 py-16 bg-slate-50 rounded-3xl items-center">
          <Text className="text-sm font-bold text-slate-400">
            No matching campaigns yet
          </Text>
        </View>
      ) : (
        <>
          <Carousel
            ref={carouselRef}
            width={CARD_W + 12}
            height={CAROUSEL_HEIGHT}
            style={{ width, paddingLeft: 20 }}
            data={filteredOffers}
            loop={filteredOffers.length > 1}
            autoPlay={filteredOffers.length > 1}
            autoPlayInterval={5000}
            scrollAnimationDuration={500}
            onSnapToItem={i => setActive(i)}
            // Let vertical pans pass through to the page ScrollView so the
            // home scroll keeps working through this slider.
            onConfigurePanGesture={g =>
              g.activeOffsetX([-10, 10]).failOffsetY([-5, 5])
            }
            renderItem={({ item }: { item: Campaign }) => (
              <View style={{ width: CARD_W }}>
                <CampaignCardSlide
                  item={item}
                  onApply={() =>
                    navigation.navigate('InfluencerOfferDetail', {
                      id: item.id,
                    })
                  }
                />
              </View>
            )}
          />

          {/* Dots — same shape as Deal of the Day */}
          <View className="flex-row justify-center mt-4" style={{ gap: 6 }}>
            {filteredOffers.map((_, i) => (
              <Pressable
                key={i}
                onPress={() =>
                  carouselRef.current?.scrollTo({ index: i, animated: true })
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
        </>
      )}
    </View>
  );
}

function CampaignCardSlide({
  item,
  onApply,
}: {
  item: Campaign;
  onApply: () => void;
}) {
  return (
    <View
      className="bg-white rounded-[32px] border border-slate-100 overflow-hidden mr-3"
      style={CARD_SHADOW}
    >
      {/* Image */}
      <View className="h-56 p-3">
        <View className="flex-1 rounded-3xl overflow-hidden relative">
          <Image
            source={{ uri: item.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full">
            <Text className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">
              {item.category}
            </Text>
          </View>
          <View
            className="absolute top-3 right-3 bg-slate-900/80 px-2.5 py-1 rounded-full flex-row items-center"
            style={{ gap: 4 }}
          >
            <View className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <Text className="text-white text-[9px] font-bold">
              {item.badge}
            </Text>
          </View>
          {item.match > 0 && (
            <View
              className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor:
                  item.match >= 75
                    ? '#22C55E'
                    : item.match >= 50
                      ? '#F59E0B'
                      : '#64748B',
              }}
            >
              <Text className="text-white text-[10px] font-black">
                {item.match}% match
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View className="px-5 pb-5">
        <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
          <View className="w-5 h-5 rounded-full bg-pink-100 items-center justify-center">
            <Text className="text-[8px] font-bold text-pink-600">
              {item.brand[0]}
            </Text>
          </View>
          <Text className="text-xs font-bold text-slate-400">{item.brand}</Text>
          <Text className="text-slate-300">·</Text>
          <View className="flex-row items-center" style={{ gap: 2 }}>
            <MapPin size={10} color="#94A3B8" />
            <Text className="text-[10px] font-bold text-slate-400">
              {item.location}
            </Text>
          </View>
        </View>

        <Text
          className="text-lg font-black text-slate-900 leading-tight mb-1"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          className="text-xs text-slate-400 font-medium leading-relaxed mb-3"
          numberOfLines={2}
        >
          {item.desc}
        </Text>

        <View className="flex-row mb-4" style={{ gap: 8 }}>
          <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-50">
            <View className="flex-row items-center mb-1" style={{ gap: 4 }}>
              <DollarSign size={10} color="#22C55E" />
              <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Pay
              </Text>
            </View>
            <Text className="text-xs font-black text-slate-800">
              {item.pay}
            </Text>
          </View>
          <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-50">
            <View className="flex-row items-center mb-1" style={{ gap: 4 }}>
              <Users size={10} color="#3B82F6" />
              <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Req
              </Text>
            </View>
            <Text
              className="text-xs font-black text-slate-800"
              numberOfLines={1}
            >
              {item.req}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onApply}
          style={{
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={[...BRAND_GRADIENT_WARM]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Text className="text-white text-xs font-black">Apply Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
