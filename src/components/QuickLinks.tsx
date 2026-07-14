import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {Box, Compass, Crown, Star} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {CARD_SHADOW} from '../theme/brand';

type Tile = {
  key: string;
  label: string;
  Icon: typeof Box;
  tint: string;
  /** Either a navigation route name or a section-id understood by Home. */
  target: string;
  action: 'navigate' | 'scroll';
};

const TILES: Tile[] = [
  {key: 'brands', label: 'Brands', Icon: Box, tint: '#7c3aed', target: 'InfluencerSearch', action: 'navigate'},
  {key: 'top-services', label: 'Top Services', Icon: Compass, tint: '#ec0d8c', target: 'top-services', action: 'scroll'},
  {key: 'top-creators', label: 'Top Creators', Icon: Crown, tint: '#f59e0b', target: 'top-creators', action: 'scroll'},
  {key: 'campaigns', label: 'Campaigns', Icon: Star, tint: '#16a34a', target: 'recommended-campaigns', action: 'scroll'},
];

// Soft-tinted icon background — rgba so we don't need color-mix at runtime.
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function QuickLinks({
  onScroll,
}: {
  onScroll?: (sectionKey: string) => void;
}) {
  const navigation = useNavigation<any>();
  const {t: translate} = useTranslation();

  const handlePress = (t: Tile) => {
    if (t.action === 'navigate') {
      navigation.navigate(t.target);
    } else if (onScroll) {
      onScroll(t.target);
    }
  };

  return (
    <View className="flex-row px-4 mt-4" style={{gap: 10}}>
      {TILES.map(t => {
        const {Icon} = t;
        return (
          <Pressable
            key={t.key}
            onPress={() => handlePress(t)}
            className="flex-1 items-center"
            style={[
              {
                backgroundColor: '#ffffff',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(25,22,43,0.06)',
                paddingVertical: 14,
                gap: 8,
              },
              CARD_SHADOW,
            ]}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: hexToRgba(t.tint, 0.14),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon size={21} color={t.tint} />
            </View>
            <Text
              numberOfLines={1}
              className="text-[11px] font-bold text-slate-700">
              {translate(`QuickLinks.tiles.${t.key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
