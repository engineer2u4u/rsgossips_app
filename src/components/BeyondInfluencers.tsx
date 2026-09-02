import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import { ANGLE_120, HOME_COLORS } from '../theme/brandHome';

// Feature cards from the RGossips Explore design: two tinted promo tiles that
// send the brand into the directory pre-focused on a segment.
const CARDS = [
  {
    key: 'meme',
    emoji: '😂',
    colors: ['#F2ECFB', '#E4E7F7'],
    border: '#E1DAF3',
    tagColor: '#7A5AB8',
  },
  {
    key: 'celeb',
    emoji: '🎬',
    colors: ['#EAECFA', '#E0E6F7'],
    border: '#D8DEF2',
    tagColor: '#43589E',
  },
];

export const BeyondInfluencers = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <View style={{ flexDirection: 'row', gap: 11, paddingHorizontal: 14 }}>
      {CARDS.map(c => (
        <Pressable key={c.key} style={{ flex: 1 }} onPress={() => navigation.navigate('BrandSearch' as never)}>
          <LinearGradient
            colors={c.colors}
            start={ANGLE_120.start}
            end={ANGLE_120.end}
            style={{ padding: 16, borderRadius: 18, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
            <Text style={{ marginTop: 9, fontSize: 15, fontWeight: '700', color: HOME_COLORS.ink }}>
              {t(`BeyondInfluencers.${c.key}.title`)}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1, color: c.tagColor, marginTop: 2 }}>
              {t(`BeyondInfluencers.${c.key}.tag`)}
            </Text>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
};
