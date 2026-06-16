import React, {useEffect, useState, useRef} from 'react';
import {View, Text, Dimensions, Pressable} from 'react-native';
import Carousel, {type ICarouselInstance} from 'react-native-reanimated-carousel';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import CreatorCard from './CreatorCard';
import {supabase} from '../utils/supabase';
import {BRAND_GRADIENT_WARM} from '../theme/brand';

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
function SectionTitle({text}: {text: string}) {
  return (
    <View className="w-full flex-row items-center mb-8 px-6" style={{gap: 12}}>
      <LinearGradient
        colors={['#f5907f', '#e07f9a', '#c95fa2', 'rgba(201,95,162,0)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={{flex: 1, height: 2}}
      />
      <Text className="text-base font-bold tracking-widest text-slate-600 uppercase">
        {text}
      </Text>
      <LinearGradient
        colors={['rgba(139,100,186,0)', '#8b64ba', '#6a64c0', '#5e6fc0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={{flex: 1, height: 2}}
      />
    </View>
  );
}

export default function CreatorsCarouselWithLink() {
  const {width} = Dimensions.get('window');
  const [creators, setCreators] = useState<Creator[]>(fallbackCreators);
  const [current, setCurrent] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {data} = await supabase
        .from('featured_creators')
        .select(
          'username, display_name, avatar_url, followers_label, verified, instagram_url',
        )
        .eq('is_active', true)
        .order('position', {ascending: true});
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
    <View className="w-full py-10">
      <SectionTitle text="Our Top Creators" />

      <Carousel
        ref={carouselRef}
        width={width}
        style={{width}}
        height={420}
        data={creators}
        loop
        autoPlay
        autoPlayInterval={3500}
        scrollAnimationDuration={900}
        onSnapToItem={index => setCurrent(index)}
        // Let vertical pans pass through to the page ScrollView.
        onConfigurePanGesture={g =>
          g.activeOffsetX([-10, 10]).failOffsetY([-5, 5])
        }
        renderItem={({item}) => (
          <View className="items-center justify-start">
            <CreatorCard {...item} />
          </View>
        )}
      />

      {/* Nav arrows */}
      <View className="flex-row justify-center mt-4" style={{gap: 32}}>
        <Pressable
          onPress={() => carouselRef.current?.prev()}
          className="p-3 bg-white rounded-full border border-slate-100"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: {width: 0, height: 2},
            elevation: 2,
          }}>
          <ChevronLeft size={20} color="#0f172a" />
        </Pressable>
        <Pressable
          onPress={() => carouselRef.current?.next()}
          className="p-3 bg-white rounded-full border border-slate-100"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: {width: 0, height: 2},
            elevation: 2,
          }}>
          <ChevronRight size={20} color="#0f172a" />
        </Pressable>
      </View>

      {/* Dots */}
      <View className="flex-row justify-center mt-6" style={{gap: 8}}>
        {creators.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => carouselRef.current?.scrollTo({index: i, animated: true})}
            className={`h-2.5 rounded-full ${
              current === i ? 'w-10' : 'bg-gray-300 w-2.5'
            }`}>
            {current === i ? (
              <LinearGradient
                colors={[...BRAND_GRADIENT_WARM]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{flex: 1, borderRadius: 100}}
              />
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
