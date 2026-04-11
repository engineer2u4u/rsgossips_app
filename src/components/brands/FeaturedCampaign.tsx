import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {ArrowUpRight} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

export const FeaturedCampaign = () => {
  return (
    <LinearGradient
      colors={['#5851DB', '#4338CA']}
      className="rounded-3xl p-5 overflow-hidden">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-2 h-2 bg-red-400 rounded-full" />
        <Text className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
          Featured Campaign
        </Text>
      </View>

      <Text className="text-lg font-bold text-white mb-1">
        Mega Brand Collab 2025
      </Text>
      <Text className="text-xs text-white/70 leading-5 mb-4" numberOfLines={2}>
        Join the biggest influencer campaign of the year. Open to all categories
        with 5K+ followers.
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {[1, 2, 3].map(i => (
            <Image
              key={i}
              source={{uri: `https://i.pravatar.cc/150?u=featured${i}`}}
              className="w-8 h-8 rounded-full border-2 border-[#5851DB] -ml-2 first:ml-0"
            />
          ))}
          <Text className="text-[10px] text-white/60 ml-2">+48 applied</Text>
        </View>

        <TouchableOpacity className="bg-white px-4 py-2.5 rounded-full flex-row items-center gap-1.5">
          <Text className="text-xs font-bold text-[#5851DB]">View</Text>
          <ArrowUpRight size={14} color="#5851DB" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};
