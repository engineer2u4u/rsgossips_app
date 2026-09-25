import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {
  Sparkles,
  Shirt,
  Pizza,
  Dumbbell,
  Plane,
  Laptop,
  House,
  GraduationCap,
} from 'lucide-react-native';

import BrandSectionHeader from './brands/BrandSectionHeader';
import { HOME_COLORS } from '../theme/brandHome';

// Vector icons rather than emoji — emoji render as a "?" tofu box on the
// device's font stack (same issue fixed in WelcomeRewardModal).
// `label` must match the canonical category strings in
// components/brands/CategoryFilters.tsx — BrandSearch filters on those exact
// values, so a tile that passed anything else would filter to nothing.
const CATEGORIES = [
  { key: 'beauty', Icon: Sparkles, label: 'Beauty & Skincare' },
  { key: 'fashion', Icon: Shirt, label: 'Fashion & Lifestyle' },
  { key: 'food', Icon: Pizza, label: 'Food & Beverage' },
  { key: 'fitness', Icon: Dumbbell, label: 'Health, Fitness & Wellness' },
  { key: 'travel', Icon: Plane, label: 'Travel & Hospitality' },
  { key: 'tech', Icon: Laptop, label: 'Technology & Gadgets' },
  { key: 'lifestyle', Icon: House, label: 'Home & Decor' },
  { key: 'education', Icon: GraduationCap, label: 'Education & Career' },
];

export const CategorySection = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const goSearch = () => navigation.navigate('BrandSearch' as never);
  // Carry the category through, or the tile just opens an unfiltered
  // directory and looks like it did nothing.
  const goCategory = (label: string) =>
    (navigation.navigate as any)('BrandSearch', { category: label });

  return (
    <View style={{ width: '100%', gap: 12 }}>
      <BrandSectionHeader
        title={t('CategorySection.title')}
        subtitle={t('CategorySection.subtitle')}
        action={t('CategorySection.viewAll')}
        onAction={goSearch}
      />

      {/* 4-col grid via 25%-width cells with internal padding for the gap —
          this can never overflow the screen edge the way fixed widths did. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 9.5 }}>
        {CATEGORIES.map(cat => (
          <View key={cat.key} style={{ width: '25%', padding: 4.5 }}>
            <Pressable
              onPress={() => goCategory(cat.label)}
              style={{
                minHeight: 84,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                paddingVertical: 12,
                paddingHorizontal: 4,
                backgroundColor: HOME_COLORS.card,
                borderWidth: 1,
                borderColor: HOME_COLORS.cardBorder,
                borderRadius: 16,
              }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F1ECFB',
                }}>
                <cat.Icon size={17} color="#7C3AED" strokeWidth={2} />
              </View>
              <Text
                style={{ fontSize: 9.5, fontWeight: '600', color: HOME_COLORS.ink, textAlign: 'center', lineHeight: 12 }}
                numberOfLines={2}>
                {t(`CategorySection.categories.${cat.key}`)}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
};
