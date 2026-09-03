import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { Laugh, Clapperboard } from 'lucide-react-native';

import { ANGLE_120, HOME_COLORS } from '../theme/brandHome';

// Feature cards from the RGossips Explore design: two tinted promo tiles that
// send the brand into the directory pre-focused on a segment.
// Vector icons, not emoji (emoji render as "?" on the device font stack).
const CARDS = [
  {
    key: 'meme',
    Icon: Laugh,
    colors: ['#F2ECFB', '#E4E7F7'],
    border: '#E1DAF3',
    tagColor: '#7A5AB8',
  },
  {
    key: 'celeb',
    Icon: Clapperboard,
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
        // The Pressable is the sized/bordered card; the gradient is an absolute
        // background. BVLinearGradient has no Fabric support on RN 0.84, so a
        // gradient that sizes itself from padding + children collapses and
        // clips the title — driving the size from a plain View avoids that.
        <Pressable
          key={c.key}
          onPress={() => navigation.navigate('BrandSearch' as never)}
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: c.border,
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={c.colors}
            start={ANGLE_120.start}
            end={ANGLE_120.end}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <c.Icon size={22} color={c.tagColor} strokeWidth={2} />
          <Text style={{ marginTop: 9, fontSize: 15, fontWeight: '700', color: HOME_COLORS.ink }}>
            {t(`BeyondInfluencers.${c.key}.title`)}
          </Text>
          <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1, color: c.tagColor, marginTop: 2 }}>
            {t(`BeyondInfluencers.${c.key}.tag`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
