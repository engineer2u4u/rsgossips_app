import React from 'react';
import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const topCreators = [
  {
    name: 'sahilanandofficial',
    rating: '4.2',
    image:
      'https://lh3.googleusercontent.com/d/1gpAUlvG4g-c8fCqx_YJUPZYDwUTDSSfL',
    followers: '1.4M',
  },
  {
    name: 'nonaberrry',
    rating: '4.2',
    image:
      'https://lh3.googleusercontent.com/d/17FV8146Zu6KAYNxfTEj-SGxj40nlyo_5',
    followers: '798K',
  },
  {
    name: 'aditirajputofficial',
    rating: '4.2',
    image:
      'https://lh3.googleusercontent.com/d/18IKmd6vgmGBOz9T5KVBAm8Oozl5iQyyo',
    followers: '166K',
  },
];

export const TopCreatorsCarousel = () => {
  const { t } = useTranslation();
  return (
    <View className="w-full bg-white py-8">
      {/* Header */}
      <View className="px-6 mb-6 flex-row justify-between items-start">
        <View>
          <Text className="text-2xl font-black text-[#1C115A]">
            {t('TopCreatorCarousel.title')}
          </Text>

          <Text className="text-slate-500 font-medium text-sm">
            {t('TopCreatorCarousel.subtitle')}
          </Text>
        </View>

        <Pressable>
          <Text className="text-[#5B3DF5] font-bold text-sm">{t('TopCreatorCarousel.seeAll')}</Text>
        </Pressable>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 24, gap: 16 }}
      >
        {topCreators.map((creator, index) => (
          <View
            key={index}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-[280px]"
          >
            {/* Image */}
            <View className="relative">
              <Image
                source={{ uri: creator.image }}
                className="w-full h-64"
                resizeMode="cover"
              />

              {/* Rating Badge */}
              <View className="absolute top-4 right-4 bg-white px-2 py-1 rounded-xl flex-row items-center gap-1">
                <Star size={14} color="#fb923c" fill="#fb923c" />

                <Text className="text-xs font-black text-slate-800">
                  {creator.rating}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View className="p-5 gap-4">
              <View className="flex-row justify-between items-start">
                <View className="gap-1">
                  <Text className="font-black text-[#1C115A] text-lg">
                    {creator.name}
                  </Text>

                  <View className="flex-row items-center gap-1">
                    <MapPin size={12} color="#94a3b8" />

                    <Text className="text-slate-400 text-xs font-bold">
                      {t('TopCreatorCarousel.followers', { followers: creator.followers })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Button */}
              <Pressable className="w-full py-3.5 rounded-2xl bg-slate-50 items-center">
                <Text className="text-[#1C115A] font-black text-sm">
                  {t('TopCreatorCarousel.viewProfile')}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
