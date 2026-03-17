import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

const ITEM_WIDTH = width / 3;
const DUMMY_BRANDS = [
  {
    id: 1,
    name: 'D LUXE PERFUMES',
    logo: 'https://lh3.googleusercontent.com/d/1y5nOHRt1P-5SB6BCzryeczgmhyoHcuSs',
  },
  {
    id: 2,
    name: 'ZAUDI',
    logo: 'https://lh3.googleusercontent.com/d/1PS9A-rPC48WUPo8imZjw4XAzChADsceu',
  },
  {
    id: 3,
    name: 'RIAR ELUX',
    logo: 'https://lh3.googleusercontent.com/d/1cUytBemciPv8OdMi6-gADzUCKzfymr1R',
  },
  {
    id: 4,
    name: 'BIODANCE',
    logo: 'https://lh3.googleusercontent.com/d/16kk2EEAMw_Y0D3Jo4BCUKAwF2rE8ugLG',
  },
  {
    id: 5,
    name: 'SESA POWERPLUS',
    logo: 'https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r',
  },
  {
    id: 6,
    name: 'SESA AYURVEDIC',
    logo: 'https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r',
  },
];

export default function BrandsCarousel() {
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
        style={{ width }} // container width
        data={DUMMY_BRANDS}
        renderItem={({ item }) => (
          <View className="items-center justify-center">
            <View className="w-20 h-20 rounded-full border border-slate-100 bg-white items-center justify-center">
              <Image
                source={{ uri: item.logo }}
                className="w-12 h-12"
                resizeMode="contain"
              />
            </View>

            <Text
              numberOfLines={2}
              className="text-[10px] font-black text-center mt-3 text-slate-500 uppercase px-2"
            >
              {item.name}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
