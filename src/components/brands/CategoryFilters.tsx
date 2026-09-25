// Category quick-filter row at the top of brand search.
//
// Controlled by the parent — pressing a chip toggles that category in the
// Categories array of the parent's filter state. "All" clears the array.
// The 15 categories match the web's CATEGORIES list (also used in the
// create-campaign form). Icons are eye candy, no semantic meaning.

import React from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {
  Briefcase,
  Car,
  Dumbbell,
  Flame,
  Gamepad2,
  GraduationCap,
  House,
  Laptop,
  PawPrint,
  Pizza,
  Plane,
  Shirt,
  Sparkles,
  Sprout,
  TrendingUp,
  Users,
} from 'lucide-react-native';

// Vector icons, not emoji — emoji render as a "?" tofu box on the device font
// stack (same fix as the brand-home category tiles).
const CATEGORIES = [
  {label: 'Beauty & Skincare', short: 'Beauty', Icon: Sparkles, key: 'beauty'},
  {label: 'Fashion & Lifestyle', short: 'Fashion', Icon: Shirt, key: 'fashion'},
  {label: 'Food & Beverage', short: 'Food', Icon: Pizza, key: 'food'},
  {label: 'Health, Fitness & Wellness', short: 'Fitness', Icon: Dumbbell, key: 'fitness'},
  {label: 'Travel & Hospitality', short: 'Travel', Icon: Plane, key: 'travel'},
  {label: 'Technology & Gadgets', short: 'Tech', Icon: Laptop, key: 'tech'},
  {label: 'Parenting & Family', short: 'Family', Icon: Users, key: 'family'},
  {label: 'Home & Decor', short: 'Home', Icon: House, key: 'home'},
  {label: 'Finance & Personal Finance', short: 'Finance', Icon: TrendingUp, key: 'finance'},
  {label: 'Education & Career', short: 'Education', Icon: GraduationCap, key: 'education'},
  {label: 'Gaming & Entertainment', short: 'Gaming', Icon: Gamepad2, key: 'gaming'},
  {label: 'Automobile & Mobility', short: 'Auto', Icon: Car, key: 'auto'},
  {label: 'Entrepreneurship & Business', short: 'Business', Icon: Briefcase, key: 'business'},
  {label: 'Sustainable & Eco-conscious Living', short: 'Eco', Icon: Sprout, key: 'eco'},
  {label: 'Pet Care & Animals', short: 'Pets', Icon: PawPrint, key: 'pets'},
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
          <Flame size={14} color={allActive ? '#fff' : '#4b5563'} />
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
              <cat.Icon size={14} color={active ? '#fff' : '#4b5563'} />
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
