import React, {useState} from 'react';
import {View, SafeAreaView, Pressable, Dimensions, ScrollView, Image, Text} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {Menu, Search, Bell} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';

import BottomNav from '../components/BottomNav';
import SidebarContent from '../components/SidebarContent';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.75;

export default function InfluencerLayout({children}: {children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const navigation = useNavigation();
  const {profile} = useAuth();

  const toggleSidebar = () => {
    const next = !open;
    setOpen(next);
    translateX.value = withTiming(next ? 0 : -SIDEBAR_WIDTH, {
      duration: 250,
    });
  };

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Sidebar Overlay */}
      {open && (
        <Pressable
          onPress={toggleSidebar}
          className="absolute inset-0 bg-black/40 z-[55]"
        />
      )}

      {/* Sidebar */}
      <Animated.View
        style={[sidebarStyle, {width: SIDEBAR_WIDTH}]}
        className="absolute left-0 top-0 bottom-0 bg-white z-[60] shadow-2xl">
        <SidebarContent closeSidebar={toggleSidebar} />
      </Animated.View>

      {/* Top Navbar */}
      <View className="h-14 flex-row items-center justify-between px-4 bg-white border-b border-slate-100 z-40">
        {/* Left: Hamburger */}
        <Pressable
          onPress={toggleSidebar}
          className="p-2 rounded-xl">
          <Menu size={22} color="#334155" />
        </Pressable>

        {/* Right: Search + Notifications + Profile */}
        <View className="flex-row items-center" style={{gap: 6}}>
          <Pressable
            onPress={() => navigation.navigate('InfluencerSearch' as never)}
            className="p-2 rounded-xl">
            <Search size={20} color="#475569" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('InfluencerNotifications' as never)}
            className="p-2 rounded-xl relative">
            <Bell size={20} color="#475569" />
            <View className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('InfluencerProfile' as never)}
            className="ml-1">
            {profile?.profile_photo_url ? (
              <Image
                source={{uri: profile.profile_photo_url}}
                className="w-8 h-8 rounded-full"
                style={{borderWidth: 2, borderColor: 'white'}}
              />
            ) : (
              <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center">
                <Text className="text-purple-600 text-xs font-bold">
                  {(profile?.full_name || 'U').charAt(0)}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{flexGrow: 1}}
        showsVerticalScrollIndicator={false}>
        <View className="w-full">{children}</View>
        <View className="h-20" />
      </ScrollView>

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}
