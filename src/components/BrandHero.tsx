import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Search, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const BrandHero: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View className="w-full bg-[#2a1a8f] px-6 pt-12 pb-16 rounded-b-[40px]">
      {/* TOP ROW */}
      <View className="flex-row justify-between items-center mb-10">
        {/* Profile */}
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?u=brand' }}
            className="w-12 h-12 rounded-full border-2 border-white/20"
          />

          <View>
            <Text className="text-slate-300 text-xs font-medium">
              {t('BrandHero.welcomeBack')}
            </Text>

            <Text className="text-white font-bold text-sm">Versace</Text>
          </View>
        </View>

        {/* Invite Button */}
        <Pressable className="flex-row items-center gap-2 bg-white/10 border border-white/20 py-2 px-4 rounded-full">
          <Text className="text-white text-xs font-bold">
            {t('BrandHero.inviteAndEarn')}
          </Text>

          <View className="bg-white rounded-full p-1">
            <Plus size={14} color="#1C115A" />
          </View>
        </Pressable>
      </View>

      {/* HERO CONTENT */}
      <View className="gap-6">
        <Text className="text-white text-4xl font-extrabold leading-tight">
          {t('BrandHero.heroTitle')}{' '}
          <Text className="text-indigo-300">{t('BrandHero.heroEmphasis')}</Text>
        </Text>

        {/* ACTION BUTTONS */}
        <View className="gap-4 mt-2">
          <Pressable className="flex-row items-center justify-center gap-2 bg-white px-8 py-3 rounded-2xl">
            <Search size={16} color="black" />
            <Text className="text-black font-semibold text-sm">
              {t('BrandHero.browseCreators')}
            </Text>
          </Pressable>

          <Pressable className="bg-[#5B3DF5] px-8 py-3 rounded-2xl">
            <Text className="text-white font-semibold text-sm text-center">
              {t('BrandHero.viewActiveCampaigns')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default BrandHero;
