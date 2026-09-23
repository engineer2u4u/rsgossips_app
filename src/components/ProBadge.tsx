import React from 'react';
import {Text, View} from 'react-native';
import {BadgeCheck} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

// The Pro verified badge — the Pro counterpart of EliteBadge, same shape and
// sizes, cooler colours so the two read as a ladder rather than as rivals.
// Render it off the server's `is_pro` / `isPro` flag (list-influencers,
// landing-match), never off a plan string read on the client: the flag is
// date-aware, so a lapsed Pro stops showing it on its own. The two flags are
// mutually exclusive server-side — a creator holds one plan.
export default function ProBadge({size = 'sm'}: {size?: 'sm' | 'md'}) {
  const {t} = useTranslation();
  const big = size === 'md';
  return (
    <View
      accessibilityLabel={t('ProBadge.title')}
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
        colors={['#6366F1', '#8B5CF6', '#0EA5E9']}
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
        {t('ProBadge.label').toUpperCase()}
      </Text>
    </View>
  );
}
