import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';

interface InfluencerCardProps {
  name: string;
  category: string;
  instagram: string;
  youtube: string | null;
  imageUrl: string;
}

export const InfluencerCard = ({
  name,
  category,
  instagram,
  youtube,
  imageUrl,
}: InfluencerCardProps) => {
  return (
    <View className="flex-row items-center px-5 py-3.5 border-b border-gray-100">
      {/* Avatar */}
      <Image
        source={{ uri: imageUrl }}
        className="w-14 h-14 rounded-full bg-gray-200"
      />

      {/* Info */}
      <View className="flex-1 ml-3.5">
        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-[11px] text-gray-400 mt-0.5" numberOfLines={1}>
          {category}
        </Text>

        {/* Stats */}
        <View className="flex-row items-center gap-3 mt-1.5">
          <View className="flex-row items-center gap-1">
            <View className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr items-center justify-center">
              <Text className="text-[8px]">📸</Text>
            </View>
            <Text className="text-[11px] font-semibold text-gray-600">
              {instagram}
            </Text>
          </View>

          {youtube && (
            <View className="flex-row items-center gap-1">
              <View className="w-3.5 h-3.5 rounded-full items-center justify-center">
                <Text className="text-[8px]">▶️</Text>
              </View>
              <Text className="text-[11px] font-semibold text-gray-600">
                {youtube}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Invite Button */}
      <Pressable className="bg-[#4C75BE] px-4 py-2 rounded-full flex-row items-center gap-1.5">
        <Plus size={12} color="white" />
        <Text className="text-white text-[11px] font-bold">Invite</Text>
      </Pressable>
    </View>
  );
};
