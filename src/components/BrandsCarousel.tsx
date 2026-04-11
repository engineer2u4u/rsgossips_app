import React, {useState, useEffect} from 'react';
import {View, Text, Image, Dimensions} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY} from '@env';

const {width} = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

interface Brand {
  id: string;
  name: string;
  logo: string;
}

const FALLBACK_BRANDS: Brand[] = [
  {
    id: '1',
    name: 'D LUXE PERFUMES',
    logo: 'https://lh3.googleusercontent.com/d/1y5nOHRt1P-5SB6BCzryeczgmhyoHcuSs',
  },
  {
    id: '2',
    name: 'ZAUDI',
    logo: 'https://lh3.googleusercontent.com/d/1PS9A-rPC48WUPo8imZjw4XAzChADsceu',
  },
  {
    id: '3',
    name: 'RIAR ELUX',
    logo: 'https://lh3.googleusercontent.com/d/1cUytBemciPv8OdMi6-gADzUCKzfymr1R',
  },
  {
    id: '4',
    name: 'BIODANCE',
    logo: 'https://lh3.googleusercontent.com/d/16kk2EEAMw_Y0D3Jo4BCUKAwF2rE8ugLG',
  },
  {
    id: '5',
    name: 'SESA POWERPLUS',
    logo: 'https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r',
  },
  {
    id: '6',
    name: 'SESA AYURVEDIC',
    logo: 'https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r',
  },
];

export default function BrandsCarousel() {
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/list-brands`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: '{}',
          },
        );
        const data = await res.json();
        if (data?.brands?.length) {
          const mapped = data.brands.map((b: any) => ({
            id: b.id,
            name: b.name || 'Brand',
            logo:
              b.logo ||
              'https://lh3.googleusercontent.com/d/1y5nOHRt1P-5SB6BCzryeczgmhyoHcuSs',
          }));
          if (mapped.length) setBrands(mapped);
        }
      } catch {
        // Keep fallback data
      }
    };
    fetchBrands();
  }, []);

  return (
    <View className="w-full py-8">
      <Text className="text-lg font-bold text-center text-slate-800 mb-6 uppercase tracking-widest">
        Brands You'll Love
      </Text>

      <Carousel
        loop
        autoPlay
        autoPlayInterval={3000}
        scrollAnimationDuration={1200}
        width={ITEM_WIDTH}
        height={140}
        style={{width}}
        data={brands}
        renderItem={({item}) => (
          <View className="items-center justify-center">
            <View className="w-20 h-20 rounded-full border border-slate-100 bg-white items-center justify-center">
              <Image
                source={{uri: item.logo}}
                className="w-12 h-12"
                resizeMode="contain"
              />
            </View>
            <Text
              numberOfLines={2}
              className="text-[10px] font-black text-center mt-3 text-slate-500 uppercase px-2">
              {item.name}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
