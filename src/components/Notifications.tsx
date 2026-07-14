import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  onNext: (enabled: boolean) => void;
}

export default function Notifications({ onNext }: Props) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center px-6 space-y-6">
      {/* IMAGE SECTION */}
      <View className="relative w-full items-center pt-4">
        {/* Glow background */}
        <View className="absolute w-[260px] h-[260px] bg-[#6347F9] opacity-10 rounded-full blur-3xl" />

        <Image
          source={require('../assets/login/BellIllustration.png')}
          resizeMode="contain"
          className="w-full max-w-[320px] h-[260px]"
        />
      </View>

      {/* TEXT */}
      <View className="items-center space-y-2 px-4">
        <Text className="text-2xl font-bold text-slate-900 text-center">
          {t('Notifications.title')}
        </Text>

        <Text className="text-sm text-slate-500 text-center max-w-[280px]">
          {t('Notifications.subtitle')}
        </Text>
      </View>

      {/* BUTTONS */}
      <View className="w-full space-y-3 pt-2">
        <Pressable
          onPress={() => onNext(true)}
          className="h-[54px] rounded-2xl bg-[#9810FA] items-center justify-center"
        >
          <Text className="text-white font-semibold text-base">
            {t('Notifications.enable')}
          </Text>
        </Pressable>

        <Pressable onPress={() => onNext(false)}>
          <Text className="text-center text-sm font-semibold text-slate-400">
            {t('Notifications.notNow')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
