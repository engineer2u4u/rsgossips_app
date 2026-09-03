import React from 'react';
import { View, Text, Pressable, Linking, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

import {
  ANGLE_96,
  ANGLE_120,
  NAVY_GRADIENT,
  NAVY_LOCATIONS,
  VIOLET_BLUE,
  VIOLET_BLUE_LOCATIONS,
} from '../theme/brandHome';

const FOOTER_LINKS = ['For Brands', 'For Influencers', 'Pricing', 'Support', 'Privacy Policy'];

export function CreatorCTASection() {
  const { t } = useTranslation();
  // Explicit width — BVLinearGradient (no Fabric support on RN 0.84) sizes to
  // its content instead of stretching, so the card rendered wider than the
  // screen and clipped on the right.
  const { width: winW } = useWindowDimensions();

  return (
    <View style={{ width: '100%' }}>
      {/* Navy CTA card */}
      <LinearGradient
        colors={NAVY_GRADIENT}
        locations={NAVY_LOCATIONS}
        start={ANGLE_120.start}
        end={ANGLE_120.end}
        style={{ width: winW - 28, marginHorizontal: 14, padding: 20, borderRadius: 20, overflow: 'hidden' }}>
        <LinearGradient
          colors={VIOLET_BLUE}
          locations={VIOLET_BLUE_LOCATIONS}
          start={ANGLE_96.start}
          end={ANGLE_96.end}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }}
        />
        <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: -0.5, lineHeight: 23, color: '#fff' }}>
          {t('CreatorCTASection.heading')}
        </Text>
        <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)', marginTop: 5 }}>
          {t('CreatorCTASection.subheading')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 9, marginTop: 15 }}>
          <Pressable
            style={{ flex: 1, height: 44, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => Linking.openURL('https://wa.me/919999999999').catch(() => {})}>
            <LinearGradient
              colors={VIOLET_BLUE}
              locations={VIOLET_BLUE_LOCATIONS}
              start={ANGLE_96.start}
              end={ANGLE_96.end}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{t('CreatorCTASection.whatsappUs')}</Text>
          </Pressable>
          <Pressable
            style={{ flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}
            onPress={() => Linking.openURL('https://instagram.com/rgossips').catch(() => {})}>
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{t('CreatorCTASection.followUs')}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Dark footer */}
      <View style={{ marginTop: 12, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 24, backgroundColor: '#0B1129' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>RGossips</Text>
        <Text style={{ marginTop: 11, fontSize: 11, lineHeight: 18, color: 'rgba(255,255,255,0.6)' }}>
          {t('CreatorCTASection.footerBlurb')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {FOOTER_LINKS.map(l => (
            <View key={l} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.09)' }}>
              <Text style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.78)' }}>{l}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 16, paddingTop: 13, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 16 }}>
            {t('CreatorCTASection.copyright')}
          </Text>
        </View>
      </View>
    </View>
  );
}
