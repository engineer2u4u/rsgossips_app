import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, Animated } from 'react-native';

interface Props {
  onNext: () => void;
  loading?: boolean;
}

export default function SuccessScreen({ onNext, loading = false }: Props) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();

    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-6 space-y-8">
      {/* Illustration */}
      <View className="relative items-center justify-center">
        {/* Glow */}
        <View className="absolute w-[260px] h-[260px] bg-[#6347F9] opacity-10 rounded-full blur-3xl" />

        <Animated.View
          style={{
            transform: [{ scale }],
            opacity,
          }}
          className="w-72 h-72 items-center justify-center"
        >
          <Image
            source={require('../assets/login/SuccessIllustration.png')}
            resizeMode="contain"
            className="w-full h-full"
          />
        </Animated.View>
      </View>

      {/* Text */}
      <View className="items-center space-y-3 px-4">
        <Text className="text-2xl font-bold text-slate-900">
          You're All Set!
        </Text>

        <Text className="text-sm text-slate-500 text-center">
          Your profile is ready. Now let's verify your phone number to start
          closing deals.
        </Text>
      </View>

      {/* Button */}
      <View className="w-full pt-4">
        <Pressable
          onPress={onNext}
          disabled={loading}
          className="h-[54px] rounded-2xl bg-[#9810FA] items-center justify-center"
        >
          <Text className="text-white font-semibold text-base">
            {loading ? 'Creating Account...' : 'Start Using Platform'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
