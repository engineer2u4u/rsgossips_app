import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, Easing} from 'react-native';
import {Loader2} from 'lucide-react-native';

interface Props {
  message?: string;
}

export default function LoadingSpinner({message = 'Loading...'}: Props) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="absolute inset-0 z-50 bg-white/80 items-center justify-center rounded-t-[40px]">
      <View className="relative w-12 h-12 items-center justify-center">
        <View
          className="absolute w-12 h-12 rounded-full border-4 border-slate-100"
        />
        <Animated.View style={{transform: [{rotate: spin}]}}>
          <Loader2 size={48} color="#E60076" strokeWidth={2.5} />
        </Animated.View>
      </View>
      <Text className="text-sm text-slate-600 font-semibold mt-3">
        {message}
      </Text>
    </View>
  );
}
