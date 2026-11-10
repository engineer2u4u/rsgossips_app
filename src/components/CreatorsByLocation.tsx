import React from 'react';
import { View, Text, Image, Pressable, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import BrandSectionHeader from './brands/BrandSectionHeader';
import { ANGLE_96, CITY_GRADIENT, HOME_COLORS } from '../theme/brandHome';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE = (SCREEN_W - 28 - 10) / 2;

type Location = { key: string; image: ReturnType<typeof require> };

// Bundled city photographs, the same files the web ships in
// src/assets/states. They were remote Unsplash URLs picked by ID, and one of
// them was wrong: the "Bangalore" tile showed the Petronas Towers, which are
// in Kuala Lumpur. Bundling also means the tiles still render offline.
//
// No creator counts. The numbers here ("24.6K", "18.9K", "12.4K", "9.7K")
// were invented — nothing counted creators per city — and the web dropped
// them for the same reason. A tile that states a figure it cannot source is
// worse than a tile that just names the city.
const locations: Location[] = [
  { key: 'mumbai', image: require('../assets/cities/mumbai.jpg') },
  { key: 'delhi', image: require('../assets/cities/delhi.jpg') },
  { key: 'bangalore', image: require('../assets/cities/banglore.jpg') },
  { key: 'hyderabad', image: require('../assets/cities/hyderabad.jpg') },
];

export const CreatorsByLocation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <View style={{ width: '100%', gap: 11 }}>
      <BrandSectionHeader
        title={t('CreatorsByLocation.title')}
        subtitle={t('CreatorsByLocation.subtitle')}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 14 }}>
        {locations.map(loc => (
          <Pressable
            key={loc.key}
            onPress={() =>
              (navigation.navigate as any)('BrandSearch', {
                location: t(`CreatorsByLocation.cities.${loc.key}`),
              })
            }
            style={{
              width: TILE,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: HOME_COLORS.card,
              borderWidth: 1,
              borderColor: HOME_COLORS.cardBorder,
            }}>
            <Image source={loc.image} style={{ width: '100%', height: 96, backgroundColor: '#EEF1F8' }} resizeMode="cover" />
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 10, overflow: 'hidden' }}>
              <LinearGradient
                colors={CITY_GRADIENT}
                start={ANGLE_96.start}
                end={ANGLE_96.end}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>
                  {t(`CreatorsByLocation.cities.${loc.key}`)}
                </Text>
              </View>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 99,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ color: '#fff', fontSize: 10 }}>→</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
