import React from 'react';
import { View, Text, Image, Pressable, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import BrandSectionHeader from './brands/BrandSectionHeader';
import { ANGLE_96, CITY_GRADIENT, HOME_COLORS } from '../theme/brandHome';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE = (SCREEN_W - 28 - 10) / 2;

type Location = { key: string; count: string; image: string };

const locations: Location[] = [
  { key: 'mumbai', count: '24.6K', image: 'https://images.unsplash.com/photo-1598434192043-71111c1b3f41?q=80&w=735&auto=format&fit=crop' },
  { key: 'delhi', count: '18.9K', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=600&auto=format&fit=crop' },
  { key: 'bangalore', count: '12.4K', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=600&auto=format&fit=crop' },
  { key: 'hyderabad', count: '9.7K', image: 'https://images.unsplash.com/photo-1679214803434-af50c2c92009?q=80&w=1974&auto=format&fit=crop' },
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
            onPress={() => navigation.navigate('BrandSearch' as never)}
            style={{
              width: TILE,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: HOME_COLORS.card,
              borderWidth: 1,
              borderColor: HOME_COLORS.cardBorder,
            }}>
            <Image source={{ uri: loc.image }} style={{ width: '100%', height: 96, backgroundColor: '#EEF1F8' }} resizeMode="cover" />
            <LinearGradient
              colors={CITY_GRADIENT}
              start={ANGLE_96.start}
              end={ANGLE_96.end}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>
                  {t(`CreatorsByLocation.cities.${loc.key}`)}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9.5 }}>
                  {t('CreatorsByLocation.creatorsCount', { count: loc.count })}
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
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
