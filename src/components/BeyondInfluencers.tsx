import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Film, Newspaper, Handshake } from 'lucide-react-native';

type Category = {
  label: string;
  bgColor: string;
  textColor: string;
  Icon: any;
};

const categories: Category[] = [
  {
    label: 'Celebs & Actors',
    Icon: Film,
    bgColor: '#FFF9F1',
    textColor: '#D97706',
  },
  {
    label: 'Publishers & Media',
    Icon: Newspaper,
    bgColor: '#F1F7FF',
    textColor: '#2563EB',
  },
  {
    label: 'Talent Agencies',
    Icon: Handshake,
    bgColor: '#F9F5FF',
    textColor: '#9333EA',
  },
  {
    label: 'Meme Pages & More',
    Icon: Film, // replace with another icon if needed
    bgColor: '#F0FDF4',
    textColor: '#16A34A',
  },
];

export const BeyondInfluencers = () => {
  return (
    <View className="w-full px-4 py-6">
      {/* Title */}
      <Text className="text-xl font-black text-[#1C115A] mb-6">
        Beyond Influencers
      </Text>

      {/* Grid */}
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {categories.map((item, index) => {
          const IconComponent = item.Icon;

          return (
            <Pressable
              key={index}
              style={{ backgroundColor: item.bgColor }}
              className="w-[48%] rounded-3xl py-8 px-5 shadow-sm"
            >
              {/* Icon */}
              <View className="w-10 h-10 mb-4 justify-center">
                <IconComponent size={24} color="#1f2937" />
              </View>

              {/* Label */}
              <Text
                style={{ color: item.textColor }}
                className="font-black text-[15px] leading-tight"
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
