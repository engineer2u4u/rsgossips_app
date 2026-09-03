import React from 'react';
import { View, Text, Image, Pressable, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import BrandSectionHeader from './brands/BrandSectionHeader';
import {
  ANGLE_96,
  CHIP_TINT,
  HOME_COLORS,
  VIOLET_BLUE,
  VIOLET_BLUE_LOCATIONS,
} from '../theme/brandHome';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE = (SCREEN_W - 28 - 11) / 2;

type Creator = { name: string; categoryKey: string; followers: string; rate: string; image: string };

const creators: Creator[] = [
  { name: 'Rohan Sharma', categoryKey: 'tech', followers: '45K', rate: '₹2.5K', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop' },
  { name: 'Ananya Singh', categoryKey: 'fashion', followers: '120K', rate: '₹4.0K', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop' },
  { name: 'Aryan Mehta', categoryKey: 'fitness', followers: '80K', rate: '₹3.2K', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop' },
  { name: 'Sneha Kapoor', categoryKey: 'travel', followers: '60K', rate: '₹2.8K', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop' },
];

export default function PocketFriendlyCreators() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <View style={{ width: '100%', gap: 11 }}>
      <BrandSectionHeader
        title={t('PocketFriendlyCreators.title')}
        subtitle={t('PocketFriendlyCreators.subtitle')}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11, paddingHorizontal: 14 }}>
        {creators.map(c => (
          <View
            key={c.name}
            style={{
              width: TILE,
              backgroundColor: HOME_COLORS.card,
              borderWidth: 1,
              borderColor: HOME_COLORS.cardBorder,
              borderRadius: 18,
              paddingVertical: 15,
              paddingHorizontal: 12,
              alignItems: 'center',
              gap: 7,
            }}>
            <Image source={{ uri: c.image }} style={{ width: 52, height: 52, borderRadius: 99, backgroundColor: '#EEF1F8' }} />
            <Text style={{ width: '100%', fontSize: 12, fontWeight: '700', color: HOME_COLORS.ink, textAlign: 'center' }} numberOfLines={1}>
              {c.name}
            </Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' }}>
              <LinearGradient
                colors={CHIP_TINT}
                start={ANGLE_96.start}
                end={ANGLE_96.end}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <Text style={{ fontSize: 8.5, fontWeight: '700', letterSpacing: 1, color: HOME_COLORS.violetDeep }}>
                {t(`PocketFriendlyCreators.categories.${c.categoryKey}`)}
              </Text>
            </View>
            <Text style={{ fontSize: 10.5, color: HOME_COLORS.muted }}>
              {t('PocketFriendlyCreators.followers', { count: c.followers })}
            </Text>
            <Pressable
              style={{
                width: '100%',
                marginTop: 2,
                borderRadius: 10,
                overflow: 'hidden',
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => navigation.navigate('BrandSearch' as never)}>
              <LinearGradient
                colors={VIOLET_BLUE}
                locations={VIOLET_BLUE_LOCATIONS}
                start={ANGLE_96.start}
                end={ANGLE_96.end}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '700' }}>
                {t('PocketFriendlyCreators.perReel', { rate: c.rate })}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
