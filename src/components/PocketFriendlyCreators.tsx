import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

type Creator = {
  name: string;
  categoryKey: string;
  followers: string;
  image: string;
};

const creators: Creator[] = [
  {
    name: 'Rohan Sharma',
    categoryKey: 'tech',
    followers: '45K',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
  },
  {
    name: 'Ananya Singh',
    categoryKey: 'fashion',
    followers: '120K',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop',
  },
  {
    name: 'Aryan Mehta',
    categoryKey: 'fitness',
    followers: '80K',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop',
  },
  {
    name: 'Sneha Kapoor',
    categoryKey: 'travel',
    followers: '60K',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop',
  },
  {
    name: 'Vikram Goel',
    categoryKey: 'food',
    followers: '35K',
    image:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=200&h=200&auto=format&fit=crop',
  },
];

export default function PocketFriendlyCreators() {
  const { t } = useTranslation();
  const CARD_WIDTH = width * 0.75;

  return (
    <View className="w-full px-4 py-10 bg-white">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-[#1C115A]">
          {t('PocketFriendlyCreators.title')}
        </Text>

        <Text className="text-sm text-slate-500">
          {t('PocketFriendlyCreators.subtitle')}
        </Text>
      </View>

      {/* Horizontal List */}
      <FlatList
        data={creators}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.name}
        contentContainerStyle={{ gap: 16 }}
        renderItem={({ item }) => (
          <View
            style={{ width: CARD_WIDTH }}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 items-center"
          >
            {/* Profile Image with Gradient Border */}
            <View className="w-24 h-24 mb-4 items-center justify-center">
              {/* Gradient Border */}
              <View className="absolute w-full h-full rounded-full bg-indigo-500" />

              <View className="bg-white rounded-full p-1 w-[90px] h-[90px]">
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-full rounded-full"
                />
              </View>
            </View>

            {/* Name */}
            <Text className="font-bold text-[#1C115A] text-lg text-center">
              {item.name}
            </Text>

            {/* Category Badge */}
            <View className="bg-indigo-50 px-3 py-1 rounded-full mt-3">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {t(`PocketFriendlyCreators.categories.${item.categoryKey}`)}
              </Text>
            </View>

            {/* Followers */}
            <Text className="text-xs text-slate-400 mt-2 font-medium">
              {t('PocketFriendlyCreators.followers', { count: item.followers })}
            </Text>

            {/* Button */}
            <Pressable className="mt-6 w-full py-3 bg-[#1C115A] rounded-2xl items-center">
              <Text className="text-white text-xs font-bold">
                {t('PocketFriendlyCreators.viewProfile')}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
