import React, { useEffect } from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

export default function CompleteProfileCard() {
  const steps = [
    {
      id: 1,
      title: 'Create your account',
      subtitle: "You're all set",
      completed: true,
    },
    {
      id: 2,
      title: 'Connect Instagram',
      subtitle: 'Brands discover you instantly',
      action: 'Connect',
      active: true,
    },
    {
      id: 3,
      title: 'Generate AI Media Kit',
      subtitle: 'Look pro in 60 seconds',
      action: 'Create',
    },
    {
      id: 4,
      title: 'Set your rate card',
      subtitle: 'Know your worth',
      action: 'Set Rates',
    },
    {
      id: 5,
      title: 'Apply to first campaign',
      subtitle: 'Land your first deal',
      action: 'Browse',
    },
  ];

  const progress = useSharedValue(0);

  useEffect(() => {
    // Animating to 20% to match the "1/5 steps" logic
    progress.value = withTiming(0.2, { duration: 1000 });
  }, []);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View className="w-full px-4 mb-6">
      <View className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
        {/* HEADER */}
        <View className="mb-6">
          <View className="flex-row items-center gap-4 mb-5">
            {/* Progress Circle with Gradient Border effect */}
            <View className="w-16 h-16 rounded-full border-4 border-slate-50 items-center justify-center relative">
              <Text className="text-pink-600 font-black text-lg">20%</Text>
            </View>

            <View className="flex-1">
              <Text className="text-xl font-black text-slate-900 leading-tight">
                Get Your First Brand Deal
              </Text>
              <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                1/5 steps — keep going!
              </Text>
            </View>
          </View>

          {/* Progress Bar with Gradient */}
          <View className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <Animated.View style={progressStyle} className="h-full">
              <LinearGradient
                colors={['#8E2DE2', '#F6339A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
        </View>

        {/* STEPS LIST */}
        <View>
          {steps.map(step => (
            <View
              key={step.id}
              className="flex-row items-center justify-between py-4 border-b border-slate-50 last:border-0"
            >
              <View className="flex-row items-center gap-4 flex-1">
                {/* STEP INDICATOR */}
                {step.completed ? (
                  <LinearGradient
                    colors={['#8E2DE2', '#F6339A']}
                    style={{
                      borderRadius: 100,
                    }}
                    className="w-8 h-8 rounded-full items-center justify-center"
                  >
                    <Check size={16} color="white" strokeWidth={4} />
                  </LinearGradient>
                ) : (
                  <View
                    className={`w-8 h-8 rounded-full border-2 items-center justify-center
                      ${step.active ? 'border-pink-500' : 'border-slate-200'}`}
                  >
                    <Text
                      className={`text-xs font-black
                        ${step.active ? 'text-pink-500' : 'text-slate-300'}`}
                    >
                      {step.id}
                    </Text>
                  </View>
                )}

                {/* TEXT CONTENT */}
                <View className="flex-1 pr-2">
                  <Text
                    className={`font-black text-sm ${
                      step.completed
                        ? 'text-slate-300 line-through'
                        : 'text-slate-800'
                    }`}
                  >
                    {step.title}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-bold">
                    {step.subtitle}
                  </Text>
                </View>
              </View>

              {/* ACTION BUTTON WITH GRADIENT */}
              {step.action && !step.completed && (
                <TouchableOpacity activeOpacity={0.8}>
                  {step.active ? (
                    <LinearGradient
                      colors={['#8E2DE2', '#F6339A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 16 }}
                      className="px-4 py-2 rounded-xl"
                    >
                      <Text className="text-white text-[10px] font-black uppercase">
                        {step.action}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50">
                      <Text className="text-slate-400 text-[10px] font-black uppercase">
                        {step.action}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
