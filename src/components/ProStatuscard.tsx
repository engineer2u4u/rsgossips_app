import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronRight, Zap } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

export default function ProStatusCard() {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    progress.value = withDelay(500, withTiming(0.7, { duration: 1000 }));
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Animated.View
      style={{ opacity }}
      className="w-full bg-white border border-slate-100 rounded-[40px] p-6 shadow-sm"
    >
      {/* 1. Header: Avatar & Greeting */}
      <View className="flex-row items-center gap-4 mb-5">
        <View className="relative">
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?u=jones' }}
            className="w-14 h-14 rounded-full"
          />
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
        </View>

        <View>
          <Text className="text-xl font-black text-slate-900">Hi, Jones</Text>
          <View className="bg-emerald-50 px-2 py-1 rounded-md mt-1 self-start">
            <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              EARNINGS: <Text className="text-emerald-600">₹2,00,000</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Brand Match Card */}
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-row items-center bg-white border border-slate-100 rounded-3xl p-4 mb-4 shadow-sm"
        style={{ elevation: 2 }}
      >
        <View className="w-12 h-12 bg-purple-50 rounded-full items-center justify-center mr-4">
          <Sparkles size={20} color="#a855f7" />
        </View>

        <View className="flex-1">
          {/* GRADIENT TEXT START */}
          <MaskedView
            style={{ height: 20, flexDirection: 'row' }}
            maskElement={
              <Text className="text-sm font-black bg-transparent">
                142 brands
              </Text>
            }
          >
            <LinearGradient
              colors={['#9810fa', '#e60076']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, height: '100%' }}
            />
          </MaskedView>
          {/* GRADIENT TEXT END */}

          <Text className="text-[11px] font-bold text-slate-400">
            are looking for creators in your niche
          </Text>
        </View>

        <View className="bg-slate-50 p-2 rounded-full">
          <ChevronRight size={14} color="#cbd5e1" />
        </View>
      </TouchableOpacity>

      {/* 3. Pro Trial Card */}
      <View
        className="bg-white border border-slate-100 rounded-3xl p-5 flex-row items-center shadow-sm"
        style={{ elevation: 2 }}
      >
        <View className="flex-1 mr-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Zap size={14} color="#a855f7" fill="#a855f7" />
            <Text className="text-[10px] font-black text-slate-700 tracking-widest uppercase">
              Pro Trial Active
            </Text>
          </View>

          <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <Animated.View
              style={[progressStyle]}
              className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full"
            />
          </View>
        </View>

        <View className="items-center border-l border-slate-100 pl-4">
          <MaskedView
            style={{ height: 40, flexDirection: 'row' }}
            maskElement={
              <Text className="text-3xl font-black bg-transparent">27</Text>
            }
          >
            <LinearGradient
              colors={['#9810fa', '#e60076']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, height: '100%' }}
            />
          </MaskedView>
          <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            Days Left
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
