// Stat row for the redesigned brand Home feed: the brand's real Trust Score
// (from useBrandTrustScore) beside a platform-scale stat. Mirrors the two-card
// band in the RGossips Explore design.

import React, {useEffect, useState} from 'react';
import {Image, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {supabase} from '../../utils/supabase';
import {useBrandTrustScore} from '../../hooks/useBrandTrustScore';
import {trustBandKey} from '../../lib/brandProfile';
import {
  ANGLE_96,
  HOME_COLORS,
  VIOLET_BLUE,
  VIOLET_BLUE_LOCATIONS,
} from '../../theme/brandHome';

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
  const {t} = useTranslation();
  const {trust, loading} = useBrandTrustScore();
  // 300–900 scale: the floor is 300, not 0, so a loading/empty state shows
  // the scale minimum rather than an impossible number.
  const score = loading ? trust.scaleMin : trust.score;
  const pct = loading ? 0 : Math.max(4, Math.min(100, trust.overallPercent));
  const band = t(`TrustBands.${trustBandKey(trust.band)}`);

  // Two real faces for the creator-count card. Same public columns the
  // Recently Connected section reads; RLS does the gating.
  const [photos, setPhotos] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {data} = await supabase
        .from('influencer_profiles')
        .select('profile_photo_url, custom_profile_photo_url')
        .eq('status', 'active')
        .order('created_at', {ascending: false})
        .limit(6);
      if (cancelled) return;
      const urls = (data || [])
        .map((r: any) => r.custom_profile_photo_url || r.profile_photo_url)
        .filter(Boolean)
        .slice(0, 2);
      setPhotos(urls);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The fill is measured in points, not percent. BVLinearGradient has no
  // Fabric support on RN 0.84 and resolves a percentage the same way it
  // resolved the percentage HEIGHT noted below — to nothing — so the bar
  // stayed empty however good the score was.
  const [trackW, setTrackW] = useState(0);

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
          <Text style={{fontSize: 11, color: '#8B93AC'}}>/{trust.scaleMax}</Text>
        </View>
        <View
          onLayout={e => setTrackW(e.nativeEvent.layout.width)}
          style={{marginTop: 9, height: 5, borderRadius: 99, backgroundColor: '#EDEFF8', overflow: 'hidden'}}>
          <LinearGradient
            colors={VIOLET_BLUE}
            locations={VIOLET_BLUE_LOCATIONS}
            start={ANGLE_96.start}
            end={ANGLE_96.end}
            // Explicit height, not '100%': BVLinearGradient has no Fabric
            // support on RN 0.84 and a percentage height resolves to nothing
            // on iOS, so the fill was invisible and the bar looked empty
            // however good the score was.
            style={{height: 5, width: Math.round((trackW * pct) / 100)}}
          />
        </View>
      </View>

      {/* Platform scale */}
      <View style={[card, {flex: 1}]}>
        <Text style={label}>CREATORS</Text>
        <Text style={{fontSize: 24, fontWeight: '700', letterSpacing: -0.8, color: HOME_COLORS.ink, marginTop: 5}}>
          250K+
        </Text>
        {/* The View owns the circle and clips; the gradient is an absolute
            fill inside it. BVLinearGradient does not apply its own
            borderRadius on iOS (no Fabric support on RN 0.84), so these
            chips rendered as broken, half-clipped shapes. */}
        {/* Real creator photographs. These were three empty gradient discs
            with no image source at all, sitting under a creator count — so
            the row implied faces it never had. A creator without a usable
            photo keeps the gradient, which is what the disc was always
            meant to be: the fallback, not the content. */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
          <View style={avatar(0)}>
            <LinearGradient colors={['#9B5FC4', '#6A66C9']} style={FILL} />
            {photos[0] ? <Image source={{uri: photos[0]}} style={FILL} /> : null}
          </View>
          <View style={avatar(-8)}>
            <LinearGradient colors={['#8460CB', '#4F79C6']} style={FILL} />
            {photos[1] ? <Image source={{uri: photos[1]}} style={FILL} /> : null}
          </View>
          <View
            style={[avatar(-8), {alignItems: 'center', justifyContent: 'center'}]}>
            <LinearGradient colors={['#6A66C9', '#31508F']} style={FILL} />
            <Text style={{color: '#fff', fontSize: 8, fontWeight: '700'}}>+</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const FILL = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

function avatar(marginLeft: number) {
  return {
    width: 22,
    height: 22,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    marginLeft,
  } as const;
}
