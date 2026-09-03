import React from 'react';
import { View, Text, Image, Pressable, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

import BrandSectionHeader from './brands/BrandSectionHeader';
import {
  ANGLE_96,
  HOME_COLORS,
  VIOLET_BLUE,
  VIOLET_BLUE_LOCATIONS,
} from '../theme/brandHome';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE = (SCREEN_W - 28 - 11) / 2; // 14px padding each side, 11px gap

const recentlyConnected = [
  { id: 1, name: 'Alex Rivera', handle: '@ALEXRIVERA', image: 'https://i.pravatar.cc/150?u=alex' },
  { id: 2, name: 'Sarah Chen', handle: '@SARAH.CHEN', image: 'https://i.pravatar.cc/150?u=sarah' },
  { id: 3, name: 'Jordan Smith', handle: '@JORDANSMITH', image: 'https://i.pravatar.cc/150?u=jordan' },
  { id: 4, name: 'Mika Tanaka', handle: '@MIKA_T', image: 'https://i.pravatar.cc/150?u=mika' },
];

export const RecentlyConnected = () => {
  const { t } = useTranslation();

  return (
    <View style={{ width: '100%', gap: 11 }}>
      <BrandSectionHeader
        title={t('RecentlyConnected.title')}
        subtitle={t('RecentlyConnected.subtitle')}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11, paddingHorizontal: 14 }}>
        {recentlyConnected.map(inf => (
          <View
            key={inf.id}
            style={{
              width: TILE,
              backgroundColor: HOME_COLORS.card,
              borderWidth: 1,
              borderColor: HOME_COLORS.cardBorder,
              borderRadius: 18,
              paddingVertical: 15,
              paddingHorizontal: 12,
              alignItems: 'center',
              gap: 9,
            }}>
            <LinearGradient
              colors={['#9B5FC4', '#6A66C9', '#4F79C6']}
              start={ANGLE_96.start}
              end={ANGLE_96.end}
              style={{ width: 54, height: 54, borderRadius: 99, padding: 2.5 }}>
              <Image
                source={{ uri: inf.image }}
                style={{ width: '100%', height: '100%', borderRadius: 99, borderWidth: 2, borderColor: '#fff' }}
              />
            </LinearGradient>
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={{ fontSize: 11.5, fontWeight: '600', color: HOME_COLORS.ink }} numberOfLines={1}>
                {inf.name}
              </Text>
              <Text style={{ fontSize: 9, color: HOME_COLORS.faint, letterSpacing: 0.4 }} numberOfLines={1}>
                {inf.handle}
              </Text>
            </View>
            <Pressable
              style={{
                width: '100%',
                height: 32,
                borderRadius: 9,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <LinearGradient
                colors={VIOLET_BLUE}
                locations={VIOLET_BLUE_LOCATIONS}
                start={ANGLE_96.start}
                end={ANGLE_96.end}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '700' }}>
                {t('RecentlyConnected.mediaKit')}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
};
