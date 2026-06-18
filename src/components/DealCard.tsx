import React, { useEffect } from 'react';
import { View, Text, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

interface DealCardProps {
  card: any;
  positionFromTop: number;
  isTop: boolean;
  onSwipe: (direction?: 'left' | 'right') => void;
  autoSwipe?: boolean;
}

export default function DealCard({
  card,
  positionFromTop,
  isTop,
  onSwipe,
  autoSwipe,
}: DealCardProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const exiting = useSharedValue(false);

  // AUTO SWIPE
  useEffect(() => {
    if (autoSwipe && isTop && !exiting.value) {
      exiting.value = true;

      x.value = withTiming(width, { duration: 350 }, finished => {
        if (finished) {
          runOnJS(onSwipe)();
          x.value = 0;
          y.value = 0;
          exiting.value = false;
        }
      });
    }
  }, [autoSwipe]);

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate(e => {
      x.value = e.translationX;
      y.value = e.translationY;
    })
    .onEnd(e => {
      if (
        Math.abs(e.translationX) > SWIPE_THRESHOLD ||
        Math.abs(e.translationY) > SWIPE_THRESHOLD
      ) {
        exiting.value = true;

        x.value = withTiming(
          e.translationX > 0 ? width : -width,
          { duration: 250 },
          finished => {
            if (finished) {
              runOnJS(onSwipe)();
              x.value = 0;
              y.value = 0;
              exiting.value = false;
            }
          },
        );
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const yOffset = interpolate(positionFromTop, [0, 1, 2], [0, 25, 50]);

    const scale = interpolate(positionFromTop, [0, 1, 2], [1, 0.95, 0.9]);

    const opacity = interpolate(positionFromTop, [0, 1, 2, 3], [1, 1, 1, 0]);

    const rotateX = interpolate(y.value, [-100, 100], [10, -10]) + 'deg';
    const rotateY = interpolate(x.value, [-100, 100], [-10, 10]) + 'deg';
    const rotateZ =
      interpolate(x.value, [-width, 0, width], [-20, 0, 20]) + 'deg';

    return {
      opacity,
      zIndex: 50 - positionFromTop,
      transform: [
        { translateX: x.value },
        { translateY: y.value + yOffset },
        { scale },
        { perspective: 1200 },
        { rotateX: isTop ? rotateX : '0deg' },
        { rotateY: isTop ? rotateY : '0deg' },
        { rotateZ: isTop ? rotateZ : '0deg' },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={animatedStyle}
        className="absolute w-[340px] aspect-[4/5] bg-white rounded-[45px] shadow-xl border border-slate-100 overflow-hidden"
      >
        <View className="h-[70%] w-full bg-slate-100">
          <Image
            source={{ uri: card.img }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        <View className="p-6 flex-1 justify-between bg-white">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-black text-slate-800 uppercase">
                Deal Of The Day
              </Text>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Limited Time Offer
              </Text>
            </View>

            <View className="bg-slate-50 px-2 py-1 rounded-lg">
              <Text className="text-pink-500 font-mono font-bold">
                06:44:22
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            className="w-full py-4 items-center shadow-lg"
            style={{borderRadius: 16, overflow: 'hidden'}}
          >
            <LinearGradient
              colors={['#8E2DE2', '#F6339A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Text className="text-white font-black text-xs uppercase tracking-widest">
              Apply Now
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
