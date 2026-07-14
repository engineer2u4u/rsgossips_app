import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, Image, Dimensions, Pressable} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {supabase} from '../utils/supabase';
import {invokeFn} from '../lib/api';
import {BRAND_GRADIENT} from '../theme/brand';

const {width} = Dimensions.get('window');
const ITEM_WIDTH = width / 2; // Two brands visible at a time, matches web mobile basis-1/2.

interface Brand {
  id: string;
  name: string;
  logo: string;
  instagram_url?: string;
}

const FALLBACK_BRANDS: Brand[] = [
  {id: '1', name: 'D LUXE PERFUMES', logo: 'https://lh3.googleusercontent.com/d/1y5nOHRt1P-5SB6BCzryeczgmhyoHcuSs'},
  {id: '2', name: 'ZAUDI', logo: 'https://lh3.googleusercontent.com/d/1PS9A-rPC48WUPo8imZjw4XAzChADsceu'},
  {id: '3', name: 'RIAR ELUX', logo: 'https://lh3.googleusercontent.com/d/1cUytBemciPv8OdMi6-gADzUCKzfymr1R'},
  {id: '4', name: 'BIODANCE', logo: 'https://lh3.googleusercontent.com/d/16kk2EEAMw_Y0D3Jo4BCUKAwF2rE8ugLG'},
  {id: '5', name: 'SESA POWERPLUS', logo: 'https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r'},
  {id: '6', name: 'SESA AYURVEDIC', logo: 'https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r'},
];

// Section title — warm half of the logo gradient fades INTO the heading on
// the left, cool half emerges from it on the right. Echoes the
// `.marquee::before/::after` rules in the web prototype.
function SectionTitle({text}: {text: string}) {
  return (
    <View className="w-full flex-row items-center mb-6 px-6" style={{gap: 12}}>
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

// 128px circular brand tile — the image fills the whole disc (cover),
// matching the web's BRANDS YOU'LL LOVE row. Falls back to a coral→
// fuchsia→purple gradient initial when the URL is missing or 404s.
function BrandLogo({logo, name}: {logo: string; name: string}) {
  const [failed, setFailed] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const LOGO_SIZE = 128;
  const sharedShadow = {
    shadowColor: '#19162b',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  } as const;

  if (!logo || failed) {
    return (
      <LinearGradient
        colors={['#ec4899', '#d946ef', '#a855f7']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          borderRadius: LOGO_SIZE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          ...sharedShadow,
        }}>
        <Text className="text-white font-black" style={{fontSize: 40}}>
          {initial}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <View
      style={{
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        borderRadius: LOGO_SIZE / 2,
        // White fallback shows through if the brand logo has transparent
        // edges — keeps the round silhouette clean while the image covers.
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        ...sharedShadow,
      }}>
      <Image
        source={{uri: logo}}
        onError={() => setFailed(true)}
        style={{width: '100%', height: '100%'}}
        resizeMode="cover"
      />
    </View>
  );
}

export default function BrandsCarousel() {
  const navigation = useNavigation<any>();
  const {t} = useTranslation();
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Admin-curated featured brands first; fall back to the full directory.
        const {data: featured} = await supabase
          .from('featured_brands')
          .select('id, name, logo_url, instagram_url')
          .eq('is_active', true)
          .order('position', {ascending: true});
        if (cancelled) return;
        if (featured && featured.length > 0) {
          setBrands(
            featured.map((b: any) => ({
              id: String(b.id),
              name: b.name,
              logo: b.logo_url || '',
              instagram_url: b.instagram_url || '',
            })),
          );
          return;
        }
        const data = await invokeFn<{brands?: any[]}>('list-brands', {});
        if (cancelled) return;
        if (data?.brands?.length) {
          setBrands(
            data.brands.map((b: any) => ({
              id: String(b.id),
              name: b.name || 'Brand',
              logo: b.logo || '',
              instagram_url: b.instagram_url || '',
            })),
          );
        }
      } catch {
        // Keep the fallback set on any failure.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Brands with a real logo first — the initial-tile fallback handles the
  // rest. Without this nudge the carousel opens on a run of letter tiles.
  const sortedBrands = useMemo(
    () =>
      [...brands].sort((a, b) => (b.logo ? 1 : 0) - (a.logo ? 1 : 0)),
    [brands],
  );

  if (!sortedBrands.length) return null;

  return (
    <View className="w-full pt-10 pb-2">
      <SectionTitle text={t('BrandsCarousel.sectionTitle')} />

      <Carousel
        loop
        autoPlay
        autoPlayInterval={3000}
        scrollAnimationDuration={1000}
        width={ITEM_WIDTH}
        height={196}
        style={{width}}
        data={sortedBrands}
        // Let vertical pans bubble to the page ScrollView; only this
        // carousel takes the gesture once horizontal motion clears 10px.
        onConfigurePanGesture={g =>
          g.activeOffsetX([-10, 10]).failOffsetY([-5, 5])
        }
        renderItem={({item}: {item: Brand}) => (
          <Pressable
            onPress={() =>
              // Open the Campaigns tab with this brand pre-seeded as the
              // search filter. The campaigns screen reads route.params and
              // initialises its searchQuery from it — same case-insensitive
              // brand-name substring match it already uses for typing.
              navigation.navigate('InfluencerCampaigns', {
                brandName: item.name,
              })
            }
            className="items-center justify-center px-3">
            <BrandLogo logo={item.logo} name={item.name} />
            <Text
              numberOfLines={1}
              className="text-[13px] font-bold mt-3 text-center text-slate-700">
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
