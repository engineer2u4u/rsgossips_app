import React, { useEffect } from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { Instagram, ArrowRight } from 'lucide-react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

export default function AiMediaKitCard() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withTiming(0, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View className="px-4 w-full items-center">
      <Animated.View
        style={animatedStyle}
        className="w-full bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
      >
        <View className="p-4">
          {/* HEADER */}
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-xl font-bold text-slate-900">
                AI Media Kit
              </Text>

              <Text className="text-slate-500 text-sm mt-1">
                Professional analytics in seconds.
              </Text>
            </View>

            <View className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
              <Text className="text-[10px] font-bold text-blue-600 uppercase">
                Free with trial
              </Text>
            </View>
          </View>

          {/* PREVIEW */}
          <View className="relative rounded-2xl bg-slate-50 border border-slate-100 p-6 mb-6 items-center">
            {/* Avatar */}
            <View className="p-[2px] rounded-full bg-purple-600 mb-4">
              <View className="w-16 h-16 rounded-full bg-white items-center justify-center overflow-hidden">
                <View className="w-full h-full bg-slate-200" />
              </View>
            </View>

            <Text className="text-lg font-bold text-slate-800">Your Name</Text>

            <View className="flex-row items-center gap-1 mb-6">
              <Instagram size={14} color="#ec4899" />
              <Text className="text-slate-500 text-sm">@yourhandle</Text>
            </View>

            {/* STATS */}
            <View className="flex-row justify-between w-full border-t border-slate-200 pt-6">
              {['Followers', 'Eng. Rate', 'Avg. Views'].map(label => (
                <View key={label} className="items-center flex-1">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                    {label}
                  </Text>

                  <View className="h-[6px] w-10 bg-slate-200 rounded-full" />
                </View>
              ))}
            </View>
          </View>

          {/* ACTION */}
          <View className="gap-4">
            <Text className="text-center text-sm text-slate-500 px-4">
              Connect your socials to sync real-time data and generate your kit.
            </Text>

            <TouchableOpacity activeOpacity={0.9}>
              <LinearGradient
                colors={['#8E2DE2', '#F6339A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16 }}
                className="w-full py-4 rounded-2xl items-center shadow-lg"
              >
                <Text className="text-white font-black text-xs uppercase tracking-widest">
                  Generate My Media Kit
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
