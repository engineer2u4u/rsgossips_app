import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Menu } from 'lucide-react-native';

import BottomNav from '../components/BottomNav';
import SidebarContent from '../components/SidebarContent';
import Footer from '../components/Footer';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.7;

export default function InfluencerLayout({ children }) {
  const [open, setOpen] = useState(false);
  const translateX = useSharedValue(-SIDEBAR_WIDTH);

  const toggleSidebar = () => {
    const next = !open;
    setOpen(next);
    translateX.value = withTiming(next ? 0 : -SIDEBAR_WIDTH, {
      duration: 250,
    });
  };

  const sidebarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 1. Sidebar (Absolute Z-Index) */}
      <Animated.View
        style={[sidebarStyle]}
        className="absolute left-0 top-0 bottom-0 bg-white z-[60] w-[70%] shadow-xl"
      >
        <SidebarContent closeSidebar={toggleSidebar} />
      </Animated.View>

      {/* 2. Fixed Top Navbar */}
      <View className="h-14 flex-row items-center px-4 border-b border-slate-200 bg-white z-40">
        <Pressable onPress={toggleSidebar}>
          <Menu size={24} color="#334155" />
        </Pressable>
      </View>

      {/* 3. Scrollable Content Area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center w-full">{children}</View>

        {/* Footer is now at the bottom of the scrollable list */}
        <Footer />

        {/* Padding at bottom so BottomNav doesn't cover footer text */}
        <View className="h-20" />
      </ScrollView>

      {/* 4. Fixed Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}
