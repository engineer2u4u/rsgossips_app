import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import BrandSectionHeader from './brands/BrandSectionHeader';
import { HOME_COLORS } from '../theme/brandHome';

const CATEGORIES = [
  { key: 'beauty', emoji: '💄' },
  { key: 'fashion', emoji: '👗' },
  { key: 'food', emoji: '🍕' },
  { key: 'fitness', emoji: '🏋️' },
  { key: 'travel', emoji: '✈️' },
  { key: 'tech', emoji: '💻' },
  { key: 'lifestyle', emoji: '🏠' },
  { key: 'education', emoji: '🎓' },
];

export const CategorySection = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const goSearch = () => navigation.navigate('BrandSearch' as never);

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
              onPress={goSearch}
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
                <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
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
