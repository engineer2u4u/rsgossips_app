import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

const CATEGORIES = [
  { label: 'All', emoji: '🔥' },
  { label: 'Lifestyle', emoji: '🏠' },
  { label: 'Tech', emoji: '💻' },
  { label: 'Finance', emoji: '📈' },
  { label: 'Education', emoji: '🎓' },
  { label: 'Health', emoji: '🏥' },
  { label: 'Fashion', emoji: '👗' },
  { label: 'Food', emoji: '🍕' },
  { label: 'Fitness', emoji: '🏋️' },
  { label: 'Beauty', emoji: '💄' },
  { label: 'Travel', emoji: '✈️' },
];

export const CategoryFilters = () => {
  const [active, setActive] = useState('All');

  return (
    <View className="py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {CATEGORIES.map(cat => {
          const isActive = active === cat.label;
          return (
            <Pressable
              key={cat.label}
              onPress={() => setActive(cat.label)}
              className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${
                isActive
                  ? 'bg-[#4C75BE] border-[#4C75BE]'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text className="text-sm">{cat.emoji}</Text>
              <Text
                className={`text-xs font-semibold ${
                  isActive ? 'text-white' : 'text-gray-600'
                }`}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
