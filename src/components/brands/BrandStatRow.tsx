// Stat row for the redesigned brand Home feed: the brand's real Trust Score
// (from useBrandTrustScore) beside a platform-scale stat. Mirrors the two-card
// band in the RGossips Explore design.

import React from 'react';
import {Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useBrandTrustScore} from '../../hooks/useBrandTrustScore';
import type {TrustBand} from '../../lib/brandProfile';
import {
  ANGLE_96,
  HOME_COLORS,
  VIOLET_BLUE,
  VIOLET_BLUE_LOCATIONS,
} from '../../theme/brandHome';

const BAND_LABEL: Record<TrustBand, string> = {
  LOW: 'Emerging',
  GOOD: 'Established',
  HIGH: 'Trusted',
};

const card = {
  padding: 14,
  borderRadius: 18,
  backgroundColor: HOME_COLORS.card,
  borderWidth: 1,
  borderColor: HOME_COLORS.cardBorder,
} as const;

const label = {
  fontSize: 9,
  fontWeight: '700' as const,
  letterSpacing: 1.1,
  color: '#8B93AC',
};

export default function BrandStatRow() {
  const {trust, loading} = useBrandTrustScore();
  const score = loading ? 0 : trust.score;
  const pct = loading ? 0 : Math.max(4, Math.min(100, trust.percent));
  const band = BAND_LABEL[trust.band] || 'Emerging';

  return (
    <View style={{flexDirection: 'row', gap: 10, paddingHorizontal: 14}}>
      {/* Trust score */}
      <View style={[card, {flex: 1.1}]}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <Text style={label}>TRUST SCORE</Text>
          <Text style={{fontSize: 9, fontWeight: '700', color: HOME_COLORS.violet}}>{band}</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 5}}>
          <Text style={{fontSize: 24, fontWeight: '700', letterSpacing: -0.8, color: HOME_COLORS.ink}}>
            {score}
          </Text>
          <Text style={{fontSize: 11, color: '#8B93AC'}}>/1000</Text>
        </View>
        <View style={{marginTop: 9, height: 5, borderRadius: 99, backgroundColor: '#EDEFF8', overflow: 'hidden'}}>
          <LinearGradient
            colors={VIOLET_BLUE}
            locations={VIOLET_BLUE_LOCATIONS}
            start={ANGLE_96.start}
            end={ANGLE_96.end}
            style={{height: '100%', width: `${pct}%`}}
          />
        </View>
      </View>

      {/* Platform scale */}
      <View style={[card, {flex: 1}]}>
        <Text style={label}>CREATORS</Text>
        <Text style={{fontSize: 24, fontWeight: '700', letterSpacing: -0.8, color: HOME_COLORS.ink, marginTop: 5}}>
          250K+
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
          <LinearGradient colors={['#9B5FC4', '#6A66C9']} style={avatar(0)} />
          <LinearGradient colors={['#8460CB', '#4F79C6']} style={avatar(-8)} />
          <LinearGradient
            colors={['#6A66C9', '#31508F']}
            style={[avatar(-8), {alignItems: 'center', justifyContent: 'center'}]}>
            <Text style={{color: '#fff', fontSize: 8, fontWeight: '700'}}>+</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

function avatar(marginLeft: number) {
  return {
    width: 22,
    height: 22,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: '#fff',
    marginLeft,
  } as const;
}
