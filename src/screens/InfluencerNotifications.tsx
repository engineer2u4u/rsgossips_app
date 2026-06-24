// Influencer notifications — real `notifications` edge function data via the
// shared NotificationsList component (used by BrandNotifications too).

import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronLeft} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {NotificationsList} from '../components/NotificationsList';

export default function InfluencerNotifications() {
  const navigation = useNavigation();
  // SafeAreaView + a single in-screen header (no InfluencerLayout wrapper)
  // — that way the back button + "Notifications" title render together on
  // first paint instead of staggering behind the layout's TopBar.
  return (
    <SafeAreaView
      className="flex-1"
      edges={['top']}
      style={{backgroundColor: '#F5F4F8'}}>
      {/* Header — always visible from the first frame. */}
      <View className="bg-white px-5 py-5 flex-row items-center justify-between shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
          <ChevronLeft size={24} color="#E60076" />
        </Pressable>
        <Text className="text-xl font-bold text-slate-800">Notifications</Text>
        <View className="w-10" />
      </View>

      <NotificationsList
        accentColor="#E60076"
        emptyHint="You'll be notified about brand offers, application updates, and payouts."
      />
    </SafeAreaView>
  );
}
