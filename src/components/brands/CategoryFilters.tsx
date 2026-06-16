// Category quick-filter row at the top of brand search.
//
// Controlled by the parent — pressing a chip toggles that category in the
// Categories array of the parent's filter state. "All" clears the array.
// The 15 categories match the web's CATEGORIES list (also used in the
// create-campaign form). Emojis are eye candy, no semantic meaning.

import React from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';

const CATEGORIES = [
  {label: 'Beauty & Skincare', short: 'Beauty', emoji: '💄'},
  {label: 'Fashion & Lifestyle', short: 'Fashion', emoji: '👗'},
  {label: 'Food & Beverage', short: 'Food', emoji: '🍕'},
  {label: 'Health, Fitness & Wellness', short: 'Fitness', emoji: '🏋️'},
  {label: 'Travel & Hospitality', short: 'Travel', emoji: '✈️'},
  {label: 'Technology & Gadgets', short: 'Tech', emoji: '💻'},
  {label: 'Parenting & Family', short: 'Family', emoji: '👨‍👩‍👧'},
  {label: 'Home & Decor', short: 'Home', emoji: '🏠'},
  {label: 'Finance & Personal Finance', short: 'Finance', emoji: '📈'},
  {label: 'Education & Career', short: 'Education', emoji: '🎓'},
  {label: 'Gaming & Entertainment', short: 'Gaming', emoji: '🎮'},
  {label: 'Automobile & Mobility', short: 'Auto', emoji: '🚗'},
  {label: 'Entrepreneurship & Business', short: 'Business', emoji: '💼'},
  {label: 'Sustainable & Eco-conscious Living', short: 'Eco', emoji: '🌱'},
  {label: 'Pet Care & Animals', short: 'Pets', emoji: '🐾'},
] as const;

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function CategoryFilters({value, onChange}: Props) {
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
            All
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
                {cat.short}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
