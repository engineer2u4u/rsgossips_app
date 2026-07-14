import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ChevronRight, Sparkles, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { key: 'lifestyle', emoji: '🏠' },
  { key: 'tech', emoji: '💻' },
  { key: 'finance', emoji: '📈' },
  { key: 'education', emoji: '🎓' },
  { key: 'health', emoji: '🏥' },
  { key: 'fashion', emoji: '👗' },
  { key: 'food', emoji: '🍕' },
  { key: 'fitness', emoji: '🏋️' },
  { key: 'beauty', emoji: '💄' },
  { key: 'travel', emoji: '✈️' },
];

const CategoryIcon = ({ labelKey, emoji }: { labelKey: string; emoji: string }) => {
  const { t } = useTranslation();
  return (
    <Pressable className="items-center justify-center bg-white p-4 gap-3 rounded-2xl border border-slate-100 shadow-sm w-[90px]">
      <Text className="text-2xl">{emoji}</Text>

      <Text className="text-[10px] font-bold text-slate-500 text-center">
        {t(`CategorySection.categories.${labelKey}`)}
      </Text>
    </Pressable>
  );
};

export const CategorySection = () => {
  const { t } = useTranslation();
  return (
    <View className="px-4 bg-slate-50/50 w-full py-10 gap-8">
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <Text className="text-2xl font-black text-slate-900">
          {t('CategorySection.title')}
        </Text>

        <Pressable className="flex-row items-center gap-1">
          <Text className="text-sm font-bold text-[#5B3DF5]">{t('CategorySection.viewAll')}</Text>

          <ChevronRight size={14} color="#5B3DF5" />
        </Pressable>
      </View>

      {/* Horizontal Category Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {CATEGORIES.map(cat => (
          <CategoryIcon key={cat.key} labelKey={cat.key} emoji={cat.emoji} />
        ))}
      </ScrollView>

      {/* Selection Cards */}
      <View className="gap-4">
        {/* Influencers Card */}
        <Pressable className="bg-[#E9F0FF] p-6 rounded-[32px] h-36 border border-blue-100 justify-between">
          <Sparkles size={24} color="#facc15" />

          <View>
            <Text className="font-black text-[#1C115A] text-xl">
              {t('CategorySection.influencers.title')}
            </Text>

            <Text className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
              {t('CategorySection.influencers.subtitle')}
            </Text>
          </View>
        </Pressable>

        {/* Celebrities Card */}
        <Pressable className="bg-[#FFF1F1] p-6 rounded-[32px] h-36 border border-red-50 justify-between">
          <Text className="text-2xl">🎭</Text>

          <View>
            <Text className="font-black text-[#6B1D1D] text-xl">
              {t('CategorySection.celebrities.title')}
            </Text>

            <Text className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">
              {t('CategorySection.celebrities.subtitle')}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Trust Sidebar Replacement (Mobile Card) */}
      <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-slate-900">
            {t('CategorySection.trustScore.title')}
          </Text>

          <View className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            <Text className="text-orange-500 text-sm font-bold">10%</Text>
          </View>
        </View>

        <Text className="text-slate-400 text-sm mb-6">
          {t('CategorySection.trustScore.subtitle')}
        </Text>

        {/* Progress Bar */}
        <View className="w-full bg-slate-100 h-2.5 rounded-full mb-8 overflow-hidden">
          <View className="bg-orange-500 h-full w-[10%] rounded-full" />
        </View>

        {/* Locked Notice */}
        <View className="bg-slate-50 rounded-3xl p-6 border border-slate-100 items-center">
          <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mb-4 border border-slate-100">
            <Zap size={20} color="#fb923c" />
          </View>

          <Text className="text-slate-600 text-xs font-semibold text-center leading-relaxed">
            {t('CategorySection.trustScore.lockedNotice')}
          </Text>
        </View>

        <Pressable className="mt-8 bg-[#131722] py-4 rounded-2xl items-center">
          <Text className="text-white font-bold text-sm">{t('CategorySection.trustScore.verifyEmail')}</Text>
        </Pressable>
      </View>
    </View>
  );
};
