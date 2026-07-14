// Category quick-filter row at the top of brand search.
//
// Controlled by the parent — pressing a chip toggles that category in the
// Categories array of the parent's filter state. "All" clears the array.
// The 15 categories match the web's CATEGORIES list (also used in the
// create-campaign form). Emojis are eye candy, no semantic meaning.

import React from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, ScrollView, Text, View} from 'react-native';

const CATEGORIES = [
  {label: 'Beauty & Skincare', short: 'Beauty', emoji: '💄', key: 'beauty'},
  {label: 'Fashion & Lifestyle', short: 'Fashion', emoji: '👗', key: 'fashion'},
  {label: 'Food & Beverage', short: 'Food', emoji: '🍕', key: 'food'},
  {label: 'Health, Fitness & Wellness', short: 'Fitness', emoji: '🏋️', key: 'fitness'},
  {label: 'Travel & Hospitality', short: 'Travel', emoji: '✈️', key: 'travel'},
  {label: 'Technology & Gadgets', short: 'Tech', emoji: '💻', key: 'tech'},
  {label: 'Parenting & Family', short: 'Family', emoji: '👨‍👩‍👧', key: 'family'},
  {label: 'Home & Decor', short: 'Home', emoji: '🏠', key: 'home'},
  {label: 'Finance & Personal Finance', short: 'Finance', emoji: '📈', key: 'finance'},
  {label: 'Education & Career', short: 'Education', emoji: '🎓', key: 'education'},
  {label: 'Gaming & Entertainment', short: 'Gaming', emoji: '🎮', key: 'gaming'},
  {label: 'Automobile & Mobility', short: 'Auto', emoji: '🚗', key: 'auto'},
  {label: 'Entrepreneurship & Business', short: 'Business', emoji: '💼', key: 'business'},
  {label: 'Sustainable & Eco-conscious Living', short: 'Eco', emoji: '🌱', key: 'eco'},
  {label: 'Pet Care & Animals', short: 'Pets', emoji: '🐾', key: 'pets'},
] as const;

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function CategoryFilters({value, onChange}: Props) {
  const {t} = useTranslation();
  const allActive = value.length === 0;

  const toggle = (label: string) => {
    if (value.includes(label)) {
      onChange(value.filter(c => c !== label));
    } else {
      onChange([...value, label]);
    }
  };

  return (
    <View className="py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 16, gap: 8}}>
        <Pressable
          onPress={() => onChange([])}
          className={`flex-row items-center px-4 py-2 rounded-full border ${
            allActive ? 'bg-[#4C75BE] border-[#4C75BE]' : 'bg-white border-gray-200'
          }`}
          style={{gap: 6}}>
          <Text className="text-sm">🔥</Text>
          <Text
            className={`text-xs font-semibold ${
              allActive ? 'text-white' : 'text-gray-600'
            }`}>
            {t('BrandsCategoryFilters.all')}
          </Text>
        </Pressable>

        {CATEGORIES.map(cat => {
          const active = value.includes(cat.label);
          return (
            <Pressable
              key={cat.label}
              onPress={() => toggle(cat.label)}
              className={`flex-row items-center px-4 py-2 rounded-full border ${
                active ? 'bg-[#4C75BE] border-[#4C75BE]' : 'bg-white border-gray-200'
              }`}
              style={{gap: 6}}>
              <Text className="text-sm">{cat.emoji}</Text>
              <Text
                className={`text-xs font-semibold ${
                  active ? 'text-white' : 'text-gray-600'
                }`}>
                {t(`BrandsCategoryFilters.category.${cat.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
