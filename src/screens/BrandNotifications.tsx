// Brand notifications — `notifications` edge function via the shared
// NotificationsList component (same component drives the influencer side).

import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import BrandsLayout from '../layouts/BrandLayout';
import {NotificationsList} from '../components/NotificationsList';

export default function BrandNotifications() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  return (
    <BrandsLayout>
      <View className="flex-1 bg-[#F8F9FE]">
        <View className="bg-white px-5 py-5 flex-row items-center justify-between shadow-sm">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-[#EBE9FE] items-center justify-center">
            <ChevronLeft size={24} color="#5851DB" />
          </Pressable>
          <Text className="text-xl font-bold text-slate-800">
            {t('ScreensBrandNotifications.title')}
          </Text>
          <View className="w-10" />
        </View>

        <NotificationsList
          accentColor="#5851DB"
          emptyHint={t('ScreensBrandNotifications.emptyHint')}
        />
      </View>
    </BrandsLayout>
  );
}
