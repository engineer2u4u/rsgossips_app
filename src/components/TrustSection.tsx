import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export const TrustSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View className="px-4 w-full items-center gap-4">
      {/* Floating Search */}
      <View className="bg-white w-full rounded-3xl p-4 flex-row items-center justify-between shadow border border-slate-100">
        <Text className="text-slate-400 text-sm font-medium pl-2 flex-1">
          {t('TrustSection.searchPlaceholder')}
        </Text>

        <Pressable className="bg-[#5B3DF5] p-2.5 rounded-2xl">
          <Plus size={20} color="white" />
        </Pressable>
      </View>

      {/* Trust Score Card */}
      <View className="bg-[#1F1F1F] w-full rounded-3xl p-6 flex-row justify-between items-center">
        <View>
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            {t('TrustSection.yourTrustScore')}
          </Text>

          <View className="flex-row items-end gap-2">
            <Text className="text-white text-4xl font-black">840</Text>

            <Text className="text-emerald-400 text-xs font-bold">+12% ★</Text>
          </View>
        </View>

        {/* Score Ring */}
        <View className="relative items-center justify-center w-16 h-16">
          <View className="absolute inset-0 rounded-full border-4 border-slate-800" />
          <View className="absolute inset-0 rounded-full border-4 border-[#5B3DF5] border-t-transparent -rotate-45" />

          <Text className="text-white text-[10px] font-black italic">{t('TrustSection.high')}</Text>
        </View>
      </View>
    </View>
  );
};
