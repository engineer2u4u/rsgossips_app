import React, {useEffect, useState, useRef} from 'react';
import {View, Text, Image, TouchableOpacity, Dimensions, Pressable, ActivityIndicator} from 'react-native';
import Carousel, {type ICarouselInstance} from 'react-native-reanimated-carousel';
import {Flame, Clock, MapPin} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {BRAND, BRAND_GRADIENT_WARM} from '../theme/brand';
import {invokeFn} from '../lib/api';

interface Deal {
  id: string | number;
  title: string;
  img: string;
  /** ISO date string or epoch ms; null for "no deadline / open". */
  deadline: string | number | null;
}

const {width} = Dimensions.get('window');

// Same fallback list the web uses when list-featured-campaigns returns empty
// or errors out. The numeric ids signal "no deep link — open the campaigns
// tab instead of trying to route to a non-existent offer detail".
const FALLBACK_DEALS: Deal[] = [
  {id: 1, title: 'Featured Campaign', img: 'https://images.pexels.com/photos/27127418/pexels-photo-27127418.jpeg', deadline: null},
  {id: 2, title: 'Featured Campaign', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800', deadline: null},
  {id: 3, title: 'Featured Campaign', img: 'https://images.pexels.com/photos/22922098/pexels-photo-22922098.jpeg', deadline: null},
  {id: 4, title: 'Featured Campaign', img: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=800', deadline: null},
];

// Countdown — mirrors web's RollingTimer logic:
// - No deadline → "OPEN"
// - 0 → "CLOSED"
// - ≥ 1 day → "N days left"
// - < 1 day → HH:MM:SS with the seconds in the brand accent
function Countdown({deadline}: {deadline: Deal['deadline']}) {
  const target = deadline ? new Date(deadline).getTime() : null;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) {
    return (
      <View className="bg-white/95 rounded-full px-3 py-1.5">
        <Text className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
          Open
        </Text>
      </View>
    );
  }

  const secondsLeft = Math.max(0, Math.floor((target - now) / 1000));

  if (secondsLeft === 0) {
    return (
      <View className="bg-white/95 rounded-full px-3 py-1.5">
        <Text className="text-[11px] font-black text-rose-500 uppercase tracking-widest">
          Closed
        </Text>
      </View>
    );
  }

  const days = Math.floor(secondsLeft / 86400);
  if (days >= 1) {
    return (
      <View
        className="flex-row items-center bg-white/95 rounded-full px-3 py-1.5"
        style={{gap: 5}}>
        <Clock size={12} color="#19162b" />
        <Text className="text-[13px] font-black text-slate-900">{days}</Text>
        <Text className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
          {days === 1 ? 'day left' : 'days left'}
        </Text>
      </View>
    );
  }

  const h = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
  const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const s = String(secondsLeft % 60).padStart(2, '0');
  return (
    <View
      className="flex-row items-center bg-white/95 rounded-full px-3 py-1.5"
      style={{gap: 6}}>
      <Clock size={12} color="#19162b" />
      <Text className="text-[12px] font-bold text-slate-900">
        {h}:{m}
        <Text style={{color: BRAND.accent}}>:{s}</Text>
      </Text>
    </View>
  );
}

function DealCard({deal}: {deal: Deal}) {
  const navigation = useNavigation<any>();

  const handleApply = () => {
    // Fallback rows carry numeric ids and don't deep-link anywhere; only
    // real campaign UUIDs go to the offer detail. Matches web behaviour.
    if (typeof deal.id === 'string') {
      navigation.navigate('InfluencerOfferDetail', {id: deal.id});
    } else {
      navigation.navigate('InfluencerCampaigns');
    }
  };

  return (
    <View
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
      {deal.img ? (
        <Image
          source={{uri: deal.img}}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
        />
      ) : (
        <View style={{position: 'absolute', inset: 0, backgroundColor: '#f1f5f9'}} />
      )}

      <LinearGradient
        colors={['rgba(10,6,20,0.34)', 'transparent', 'transparent', 'rgba(10,6,20,0.82)']}
        locations={[0, 0.3, 0.5, 1]}
        style={{position: 'absolute', inset: 0}}
      />

      <View
        className="flex-row justify-between items-start"
        style={{position: 'absolute', top: 14, left: 14, right: 14}}>
        <View
          className="flex-row items-center bg-slate-900/65 rounded-full px-3 py-1.5"
          style={{gap: 6}}>
          <Flame size={12} color="#fff" />
          <Text className="text-white text-[10px] font-black uppercase tracking-widest">
            Deal of the Day
          </Text>
        </View>
        <Countdown deadline={deal.deadline} />
      </View>

      <View style={{position: 'absolute', left: 16, right: 16, bottom: 16}}>
        <Text className="text-white text-2xl font-black leading-tight mb-3" numberOfLines={2}>
          {deal.title || 'Featured Campaign'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleApply}
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
    </View>
  );
}

export default function DealOfDayCarousel() {
  const carouselRef = useRef<ICarouselInstance>(null);
  const [active, setActive] = useState(0);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const CARD_W = width - 56;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{campaigns?: any[]}>(
          'list-featured-campaigns',
          {},
        );
        if (cancelled) return;
        if (Array.isArray(data?.campaigns) && data.campaigns.length > 0) {
          setDeals(
            data.campaigns.slice(0, 6).map((c: any) => ({
              id: c.id,
              img: c.bannerImage || c.brandLogo || '',
              title: c.brandName || c.title || 'Featured Campaign',
              deadline: c.applicationDeadline || null,
            })),
          );
        } else {
          setDeals(FALLBACK_DEALS);
        }
      } catch {
        if (!cancelled) setDeals(FALLBACK_DEALS);
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
      <View className="w-full items-center justify-center" style={{height: 400}}>
        <ActivityIndicator size="large" color={BRAND.accent} />
        <Text className="mt-3 text-sm font-medium text-slate-400">
          Loading featured campaigns…
        </Text>
      </View>
    );
  }

  if (!deals.length) return null;

  return (
    <View className="w-full mt-2">
      <View className="flex-row items-center justify-between px-5 mb-3">
        <Text className="text-xl font-black text-slate-900 tracking-tight">
          Deal of the Day
        </Text>
      </View>

      <Carousel
        ref={carouselRef}
        width={CARD_W + 12}
        height={376}
        style={{width, paddingLeft: 20}}
        data={deals}
        loop
        autoPlay={false}
        scrollAnimationDuration={500}
        onSnapToItem={i => setActive(i)}
        // Don't capture vertical drags — let them bubble to the parent
        // ScrollView. Only claim the gesture once horizontal travel
        // exceeds ~10px; bail out the moment vertical travel exceeds 5px
        // so the page keeps scrolling instead of snagging on the deck.
        // (v4 of the carousel uses onConfigurePanGesture rather than the
        // old panGestureHandlerProps prop bag.)
        onConfigurePanGesture={g =>
          g.activeOffsetX([-10, 10]).failOffsetY([-5, 5])
        }
        renderItem={({item}: {item: Deal}) => (
          <View style={{width: CARD_W}}>
            <DealCard deal={item} />
          </View>
        )}
      />

      <View className="flex-row justify-center mt-4" style={{gap: 6}}>
        {deals.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => carouselRef.current?.scrollTo({index: i, animated: true})}
            style={{
              width: active === i ? 22 : 7,
              height: 7,
              borderRadius: 9,
              backgroundColor: active === i ? BRAND.accent : 'rgba(25,22,43,0.13)',
            }}
          />
        ))}
      </View>
    </View>
  );
}
