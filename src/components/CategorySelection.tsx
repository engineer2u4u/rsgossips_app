import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  onNext: (categories: string[]) => void;
  onSkip?: () => void;
}

const categories = [
  'Beauty',
  'Fashion',
  'Tech',
  'Fitness',
  'Travel',
  'Food',
  'Lifestyle',
  'Finance',
  'Gaming',
  'Education',
  'Photography',
  'Vlogging',
];

export default function CategorySelection({ onNext, onSkip }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (cat: string) => {
    setSelected(prev =>
      prev.includes(cat) ? prev.filter(i => i !== cat) : [...prev, cat],
    );
  };

  return (
    <View className="flex-1 px-6 space-y-8">
      {/* HEADER */}
      <View className="items-center space-y-2">
        <Text className="text-2xl font-bold text-slate-900 text-center">
          What Do You Create?
        </Text>

        <Text className="text-slate-500 text-sm text-center">
          Select categories to get better campaign matches
        </Text>
      </View>

      {/* CATEGORY PILLS */}
      <View className="flex-row flex-wrap justify-center gap-3">
        {categories.map(cat => {
          const isSelected = selected.includes(cat);

          return (
            <Pressable
              key={cat}
              onPress={() => toggle(cat)}
              className={`px-6 py-2.5 rounded-full border ${
                isSelected
                  ? 'bg-[#9810FA] border-transparent'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isSelected ? 'text-white' : 'text-slate-500'
                }`}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* FOOTER */}
      <View className="space-y-4 pt-4">
        <Text className="text-center text-[11px] text-slate-400">
          You can change this later
        </Text>

        <Pressable
          disabled={selected.length < 1}
          onPress={() => onNext(selected)}
          className={`h-[54px] rounded-2xl items-center justify-center ${
            selected.length < 1 ? 'bg-slate-200' : 'bg-[#9810FA]'
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              selected.length < 1 ? 'text-slate-400' : 'text-white'
            }`}
          >
            Continue
          </Text>
        </Pressable>

        {onSkip && (
          <Pressable onPress={onSkip}>
            <Text className="text-center text-sm font-semibold text-[#6347F9]">
              Skip
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
