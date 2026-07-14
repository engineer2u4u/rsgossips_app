import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MessageCircle, Instagram, Hash } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export function CreatorCTASection() {
  const { t } = useTranslation();
  return (
    <View className="w-full px-4 pb-20">
      {/* CTA Card */}
      <View className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
        {/* Top Section */}
        <View className="flex-row items-center gap-4 mb-6">
          {/* Icon */}
          <View className="w-16 h-16 bg-[#131722] rounded-2xl items-center justify-center">
            <Text className="text-white text-3xl font-bold">#</Text>
          </View>

          {/* Heading */}
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900">
              {t('CreatorCTASection.heading')}
            </Text>

            <Text className="text-slate-500 text-sm mt-1">
              {t('CreatorCTASection.subheading')}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View className="gap-4">
          {/* WhatsApp */}
          <Pressable className="flex-row items-center justify-center gap-2 bg-[#25D366] py-4 rounded-2xl">
            <MessageCircle size={20} color="white" />
            <Text className="text-white font-bold text-sm">{t('CreatorCTASection.whatsappUs')}</Text>
          </Pressable>

          {/* Instagram */}
          <Pressable className="flex-row items-center justify-center gap-2 border border-slate-200 py-4 rounded-2xl bg-white">
            <Instagram size={20} color="#475569" />
            <Text className="text-slate-700 font-bold text-sm">{t('CreatorCTASection.followUs')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View className="mt-10 items-center gap-2">
        <View className="flex-row items-center gap-2">
          <Hash size={14} color="#9ca3af" />
          <Text className="text-gray-400 text-xs">Recentgossips</Text>
        </View>

        <Text className="text-gray-400 text-xs">
          {t('CreatorCTASection.copyright')}
        </Text>
      </View>
    </View>
  );
}
