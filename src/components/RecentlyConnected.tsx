import React from 'react';
import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { UserPlus } from 'lucide-react-native';

const recentlyConnected = [
  {
    id: 1,
    name: 'Alex Rivera',
    platform: 'Instagram',
    image: 'https://i.pravatar.cc/150?u=alex',
  },
  {
    id: 2,
    name: 'Sarah Chen',
    platform: 'YouTube',
    image: 'https://i.pravatar.cc/150?u=sarah',
  },
  {
    id: 3,
    name: 'Jordan Smith',
    platform: 'TikTok',
    image: 'https://i.pravatar.cc/150?u=jordan',
  },
  {
    id: 4,
    name: 'Mika Tanaka',
    platform: 'Twitter',
    image: 'https://i.pravatar.cc/150?u=mika',
  },
  {
    id: 5,
    name: 'Elena Gomez',
    platform: 'Instagram',
    image: 'https://i.pravatar.cc/150?u=elena',
  },
  {
    id: 6,
    name: 'David Park',
    platform: 'TikTok',
    image: 'https://i.pravatar.cc/150?u=david',
  },
];

export const RecentlyConnected = () => {
  return (
    <View className="w-full px-4 py-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-[#1C115A]">
          Influencers Recently Connected
        </Text>

        <Text className="text-slate-500 text-sm">
          Direct connects happening right now
        </Text>
      </View>

      {/* Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      >
        {recentlyConnected.map(influencer => (
          <View
            key={influencer.id}
            className="w-[160px] bg-white border border-slate-100 rounded-3xl p-5 items-center shadow-sm"
          >
            {/* Profile Image */}
            <View className="w-20 h-20 mb-4 items-center justify-center">
              <View className="absolute inset-0 rounded-full border-2 border-[#5B3DF5]" />

              <Image
                source={{ uri: influencer.image }}
                className="w-full h-full rounded-full"
                resizeMode="cover"
              />
            </View>

            {/* Name */}
            <Text
              className="font-bold text-[#1C115A] text-sm mb-1 text-center"
              numberOfLines={1}
            >
              {influencer.name}
            </Text>

            {/* Platform */}
            <Text className="text-slate-400 text-[10px] uppercase tracking-wider mb-4">
              {influencer.platform}
            </Text>

            {/* Button */}
            <Pressable className="w-full flex-row items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50">
              <UserPlus size={14} color="#1C115A" />

              <Text className="text-[#1C115A] text-xs font-bold">Connect</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
