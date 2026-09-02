import React from 'react';
import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import BrandSectionHeader from './brands/BrandSectionHeader';
import {
  ANGLE_96,
  HOME_COLORS,
  VIOLET_BLUE,
  VIOLET_BLUE_LOCATIONS,
} from '../theme/brandHome';

const topCreators = [
  { name: 'sahilanandofficial', rating: '4.9', image: 'https://lh3.googleusercontent.com/d/1gpAUlvG4g-c8fCqx_YJUPZYDwUTDSSfL', followers: '1.4M' },
  { name: 'nonaberrry', rating: '5.0', image: 'https://lh3.googleusercontent.com/d/17FV8146Zu6KAYNxfTEj-SGxj40nlyo_5', followers: '798K' },
  { name: 'aditirajputofficial', rating: '4.8', image: 'https://lh3.googleusercontent.com/d/18IKmd6vgmGBOz9T5KVBAm8Oozl5iQyyo', followers: '166K' },
];

export const TopCreatorsCarousel = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const goSearch = () => navigation.navigate('BrandSearch' as never);

  return (
    <View style={{ width: '100%', gap: 11 }}>
      <BrandSectionHeader
        title={t('TopCreatorCarousel.title')}
        subtitle={t('TopCreatorCarousel.subtitle')}
        action={t('TopCreatorCarousel.seeAll')}
        onAction={goSearch}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, gap: 12, paddingBottom: 4 }}>
        {topCreators.map((creator, index) => (
          <View
            key={index}
            style={{
              width: 216,
              backgroundColor: HOME_COLORS.card,
              borderWidth: 1,
              borderColor: HOME_COLORS.cardBorder,
              borderRadius: 20,
              overflow: 'hidden',
            }}>
            <View style={{ position: 'relative', height: 232, backgroundColor: '#EEF1F8' }}>
              <Image source={{ uri: creator.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <LinearGradient
                colors={['#9B5FC4', '#6A66C9']}
                style={{ position: 'absolute', top: 10, left: 10, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99 }}>
                <Text style={{ color: '#fff', fontSize: 8.5, fontWeight: '700', letterSpacing: 0.7 }}>AI PICK</Text>
              </LinearGradient>
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 99,
                  backgroundColor: 'rgba(255,255,255,0.94)',
                }}>
                <Star size={11} color="#fb923c" fill="#fb923c" />
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: HOME_COLORS.ink }}>{creator.rating}</Text>
              </View>
            </View>

            <View style={{ padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: HOME_COLORS.ink }} numberOfLines={1}>
                  {creator.name}
                </Text>
                <Text style={{ fontSize: 10.5, color: HOME_COLORS.muted, marginTop: 2 }} numberOfLines={1}>
                  ◍ {t('TopCreatorCarousel.followers', { followers: creator.followers })}
                </Text>
              </View>
              <Pressable onPress={goSearch}>
                <LinearGradient
                  colors={VIOLET_BLUE}
                  locations={VIOLET_BLUE_LOCATIONS}
                  start={ANGLE_96.start}
                  end={ANGLE_96.end}
                  style={{ height: 34, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '700' }}>{t('TopCreatorCarousel.invite')}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
