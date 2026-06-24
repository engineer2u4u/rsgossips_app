import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, Dimensions, Pressable } from 'react-native';
import Carousel, {
  type ICarouselInstance,
} from 'react-native-reanimated-carousel';
import { CheckCircle2 } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import CreatorCard from './CreatorCard';
import { supabase } from '../utils/supabase';
import { BRAND_GRADIENT_WARM } from '../theme/brand';

interface Creator {
  name: string;
  verified: boolean;
  image: string;
  posts: string;
  followers: string;
  following: string;
  bio: string;
  link: string;
}

// Same fallback shown on web — used until the admin publishes any rows in
// public.featured_creators.
const fallbackCreators: Creator[] = [
  {
    name: 'sahilanandofficial',
    verified: true,
    image:
      'https://lh3.googleusercontent.com/d/1gpAUlvG4g-c8fCqx_YJUPZYDwUTDSSfL',
    posts: '1454',
    followers: '1.4M',
    following: '1123',
    bio: 'Sahil Nanda | Male',
    link: 'https://www.instagram.com/sahilanandofficial/',
  },
  {
    name: 'nonaberrry',
    verified: true,
    image:
      'https://lh3.googleusercontent.com/d/17FV8146Zu6KAYNxfTEj-SGxj40nlyo_5',
    posts: '860',
    followers: '798K',
    following: '1181',
    bio: 'Naina Singh | Female',
    link: 'https://www.instagram.com/nonaberrry/',
  },
  {
    name: 'aditirajputofficial',
    verified: false,
    image:
      'https://lh3.googleusercontent.com/d/18IKmd6vgmGBOz9T5KVBAm8Oozl5iQyyo',
    posts: '319',
    followers: '166K',
    following: '102',
    bio: 'Aditi Rajput | Female',
    link: 'https://www.instagram.com/aditirajputofficial/',
  },
  {
    name: 'karishmatalwar93',
    verified: false,
    image:
      'https://lh3.googleusercontent.com/d/10tTiJ3qm15UAS8KUDr5Hs7EFdGPo7pvG',
    posts: '1606',
    followers: '366K',
    following: '1345',
    bio: 'Karishma Talwar | Female',
    link: 'https://www.instagram.com/karishmatalwar93',
  },
  {
    name: 'theshilpa_official',
    verified: false,
    image:
      'https://lh3.googleusercontent.com/d/173V34LvsTJ4n-UB6qE2S49cSm3junhkR',
    posts: '659',
    followers: '235K',
    following: '450',
    bio: 'Shilpa Choudhary | Female',
    link: 'https://www.instagram.com/theshilpa_official/',
  },
];

// SectionTitle — full logo gradient flanks. Warm half fades into the heading
// on the left, cool half emerges on the right. Matches BrandsCarousel.
function SectionTitle({ text }: { text: string }) {
  return (
    <View
      className="w-full flex-row items-center mb-8 px-6"
      style={{ gap: 12 }}
    >
      <LinearGradient
        colors={['#f5907f', '#e07f9a', '#c95fa2', 'rgba(201,95,162,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, height: 2 }}
      />
      <Text className="text-base font-bold tracking-widest text-slate-600 uppercase">
        {text}
      </Text>
      <LinearGradient
        colors={['rgba(139,100,186,0)', '#8b64ba', '#6a64c0', '#5e6fc0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, height: 2 }}
      />
    </View>
  );
}

export default function CreatorsCarouselWithLink() {
  const { width } = Dimensions.get('window');
  const [creators, setCreators] = useState<Creator[]>(fallbackCreators);
  const [current, setCurrent] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('featured_creators')
        .select(
          'username, display_name, avatar_url, followers_label, verified, instagram_url',
        )
        .eq('is_active', true)
        .order('position', { ascending: true });
      if (cancelled) return;
      if (data && data.length > 0) {
        setCreators(
          data.map((r: any) => ({
            name: r.username,
            verified: !!r.verified,
            image: r.avatar_url || '',
            followers: r.followers_label || '',
            posts: '',
            following: '',
            bio: r.display_name || '',
            link: r.instagram_url,
          })),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View className="w-full">
      <SectionTitle text="Our Top Creators" />

      <Carousel
        ref={carouselRef}
        width={width}
        style={{ width }}
        height={400}
        data={creators}
        loop
        autoPlay
        autoPlayInterval={4500}
        scrollAnimationDuration={900}
        onSnapToItem={index => setCurrent(index)}
        // Let vertical pans pass through to the page ScrollView.
        onConfigurePanGesture={g =>
          g.activeOffsetX([-10, 10]).failOffsetY([-5, 5])
        }
        renderItem={({ item, index }) => (
          <View className="items-center justify-start">
            <CreatorCard
              {...item}
              rank={index + 1}
              trending={index < 3 /* top 3 get the green pill */}
            />
          </View>
        )}
      />

      {/* MINI RANK ROW — top 3 creators visible at a glance under the
          featured slide. Tapping a card scrolls the carousel to that index.
          Mirrors the row shown in the design screenshot. */}
      <View className="px-4" style={{}}>
        <View className="flex-row" style={{ gap: 10 }}>
          {creators.slice(0, 3).map((c, i) => (
            <MiniRankCard
              key={`${c.name}-${i}`}
              creator={c}
              rank={i + 1}
              active={current === i}
              onPress={() =>
                carouselRef.current?.scrollTo({ index: i, animated: true })
              }
            />
          ))}
        </View>
      </View>

      {/* Dots */}
      <View className="flex-row justify-center mt-6" style={{ gap: 8 }}>
        {creators.map((_, i) => (
          <Pressable
            key={i}
            onPress={() =>
              carouselRef.current?.scrollTo({ index: i, animated: true })
            }
            className={`h-2.5 rounded-full ${
              current === i ? 'w-10' : 'bg-gray-300 w-2.5'
            }`}
          >
            {current === i ? (
              <LinearGradient
                colors={[...BRAND_GRADIENT_WARM]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, borderRadius: 100 }}
              />
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Mini rank card — small version of the featured card shown in a row.

function avatarTone(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const palette: [string, string][] = [
    ['#3B82F6', '#1D4ED8'],
    ['#EC4899', '#BE185D'],
    ['#F59E0B', '#EA580C'],
    ['#10B981', '#047857'],
    ['#8B5CF6', '#6D28D9'],
  ];
  return palette[Math.abs(h) % palette.length];
}

function MiniRankCard({
  creator,
  rank,
  active,
  onPress,
}: {
  creator: Creator;
  rank: number;
  active: boolean;
  onPress: () => void;
}) {
  const initial = (creator.name || '?').trim().charAt(0).toUpperCase();
  const [bgA, bgB] = avatarTone(creator.name || '?');

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: active ? '#FBCFE8' : '#F1F5F9',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* Rank pill — top-left */}
      <View
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          width: 18,
          height: 18,
          borderRadius: 6,
          backgroundColor: '#F1F5F9',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text className="text-[10px] font-black text-slate-600">{rank}</Text>
      </View>

      {/* Small gradient-ringed avatar */}
      <LinearGradient
        colors={['#8B5CF6', '#FA288A', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          padding: 2.5,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
        }}
      >
        {creator.image ? (
          <Image
            source={{ uri: creator.image }}
            style={{
              width: 51,
              height: 51,
              borderRadius: 26,
              borderWidth: 2,
              borderColor: '#fff',
            }}
          />
        ) : (
          <LinearGradient
            colors={[bgA, bgB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 51,
              height: 51,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#fff',
            }}
          >
            <Text className="text-white font-black" style={{ fontSize: 20 }}>
              {initial}
            </Text>
          </LinearGradient>
        )}
      </LinearGradient>

      <View
        className="flex-row items-center mt-2"
        style={{ gap: 3, maxWidth: '100%' }}
      >
        <Text
          numberOfLines={1}
          className="text-[11px] font-black text-slate-900"
          style={{ maxWidth: 80 }}
        >
          {creator.name}
        </Text>
        {creator.verified ? <CheckCircle2 size={9} color="#d2418f" /> : null}
      </View>
      <Text className="text-[10px] font-bold text-slate-400 mt-0.5">
        {creator.followers || '—'}
      </Text>
    </Pressable>
  );
}
