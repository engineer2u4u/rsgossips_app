import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {ArrowUpRight} from 'lucide-react-native';

export const CampaignCard = () => {
  return (
    <View className="bg-white rounded-3xl p-4 shadow-sm shadow-gray-100 border border-gray-50">
      {/* Top Row */}
      <View className="flex-row items-center gap-3 mb-3">
        <Image
          source={{uri: 'https://i.pravatar.cc/150?u=brand'}}
          className="w-10 h-10 rounded-full"
        />
        <View className="flex-1">
          <Text className="text-sm font-bold text-gray-900">
            Summer Collection Launch
          </Text>
          <Text className="text-[11px] text-gray-400 mt-0.5">
            Fashion Brand Co.
          </Text>
        </View>
        <View className="bg-[#E0F7EC] px-2.5 py-1 rounded-full">
          <Text className="text-[10px] font-bold text-[#0D7C4A]">Live</Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-xs text-gray-500 leading-5 mb-3" numberOfLines={2}>
        Looking for fashion influencers to showcase our new summer collection.
        Reels & Stories required.
      </Text>

      {/* Tags */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="bg-[#F3F1FF] px-3 py-1 rounded-full">
          <Text className="text-[10px] font-semibold text-[#4F46E5]">
            Fashion
          </Text>
        </View>
        <View className="bg-[#FFF3E0] px-3 py-1 rounded-full">
          <Text className="text-[10px] font-semibold text-[#E65100]">
            10K-50K
          </Text>
        </View>
        <View className="bg-[#E3F2FD] px-3 py-1 rounded-full">
          <Text className="text-[10px] font-semibold text-[#1565C0]">
            Instagram
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-50">
        <Text className="text-xs text-gray-400">Budget: ₹15,000</Text>
        <TouchableOpacity className="flex-row items-center gap-1">
          <Text className="text-xs font-bold text-[#5851DB]">Apply</Text>
          <ArrowUpRight size={14} color="#5851DB" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
