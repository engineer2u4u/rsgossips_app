import React from 'react';
import {Text, View} from 'react-native';
import {BadgeCheck} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

// The Elite verified badge — one of the three Elite discovery perks.
// Render it off the server's `is_elite` flag (list-influencers,
// landing-match), never off a plan string read on the client: the flag is
// already date-aware, so a lapsed Elite stops showing it on its own.
export default function EliteBadge({size = 'sm'}: {size?: 'sm' | 'md'}) {
  const {t} = useTranslation();
  const big = size === 'md';
  return (
    <View
      accessibilityLabel={t('EliteBadge.title')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: big ? 9 : 6,
        paddingVertical: big ? 4 : 2,
        borderRadius: 99,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
      <LinearGradient
        colors={['#F59E0B', '#E1306C', '#833AB4']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0}}
      />
      <BadgeCheck size={big ? 12 : 10} color="#fff" strokeWidth={2.5} />
      <Text
        style={{
          color: '#fff',
          fontSize: big ? 10 : 8.5,
          fontWeight: '900',
          letterSpacing: 0.5,
        }}>
        {t('EliteBadge.label').toUpperCase()}
      </Text>
    </View>
  );
}
