import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {ArrowUpRight} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

export const FeaturedCampaign = () => {
  const {t} = useTranslation();
  return (
    // Wrapping View carries the size; the gradient is an absolute background.
    // BVLinearGradient has no Fabric support on RN 0.84 and a gradient that
    // sizes itself from padding + children collapses through the interop layer.
    <View className="rounded-3xl p-5 overflow-hidden">
      <LinearGradient
        colors={['#5851DB', '#4338CA']}
        style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
      />
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-2 h-2 bg-red-400 rounded-full" />
        <Text className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
          {t('BrandsFeaturedCampaign.badge')}
        </Text>
      </View>

      <Text className="text-lg font-bold text-white mb-1">
        {t('BrandsFeaturedCampaign.title')}
      </Text>
      <Text className="text-xs text-white/70 leading-5 mb-4" numberOfLines={2}>
        {t('BrandsFeaturedCampaign.description')}
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
          <Text className="text-[10px] text-white/60 ml-2">
            {t('BrandsFeaturedCampaign.applied', {count: 48})}
          </Text>
        </View>

        <TouchableOpacity className="bg-white px-4 py-2.5 rounded-full flex-row items-center gap-1.5">
          <Text className="text-xs font-bold text-[#5851DB]">
            {t('BrandsFeaturedCampaign.view')}
          </Text>
          <ArrowUpRight size={14} color="#5851DB" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
