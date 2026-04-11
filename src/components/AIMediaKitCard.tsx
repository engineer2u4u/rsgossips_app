import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import {
  ArrowRight,
  Users,
  TrendingUp,
  Eye,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

function formatCount(n: number | undefined) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function AiMediaKitCard() {
  const { profile } = useAuth();
  const navigation = useNavigation();
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

  const userName = profile?.full_name || 'Creator';
  const userHandle =
    profile?.instagram_handle || profile?.username || 'creator';
  const userPhoto = profile?.profile_photo_url;

  const stats = [
    {
      icon: <Users size={18} color="#CBD5E1" />,
      label: 'FOLLOWERS',
      value: formatCount(profile?.followers_count),
    },
    {
      icon: <TrendingUp size={18} color="#CBD5E1" />,
      label: 'POSTS',
      value: formatCount(profile?.media_count),
    },
    {
      icon: <Eye size={18} color="#CBD5E1" />,
      label: 'FOLLOWING',
      value: formatCount(profile?.follows_count),
    },
  ];

  return (
    <View className="w-full">
      <Animated.View
        style={animatedStyle}
        className="w-full bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden p-6"
      >
        {/* Header */}
        <View className="flex-row justify-between items-start">
          <View>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Text className="text-xl font-black text-slate-900 tracking-tight">
                AI Media Kit
              </Text>
              <Sparkles size={20} color="#3B82F6" />
            </View>
            <Text className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-widest">
              Real-time analytics
            </Text>
          </View>
          <View className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
            <Text className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Preview
            </Text>
          </View>
        </View>

        {/* Profile Section */}
        <View className="items-center py-8">
          {/* Avatar with gradient border */}
          <View className="mb-6">
            <LinearGradient
              colors={['#9810fa', '#ff8ba7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 3,
                borderRadius: 50,
                shadowColor: '#9810fa',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <View className="w-20 h-20 rounded-full bg-white p-1 overflow-hidden">
                {userPhoto ? (
                  <Image
                    source={{ uri: userPhoto }}
                    className="w-full h-full rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={['#A855F7', '#EC4899']}
                    className="w-full h-full items-center justify-center"
                  >
                    <Text className="text-white text-2xl font-bold">
                      {userName.charAt(0)}
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Name & Handle */}
          <Text className="text-xl font-black text-slate-800 leading-tight">
            {userName}
          </Text>
          <Text className="text-sm font-bold text-slate-400 tracking-wide mt-1">
            @{userHandle}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row mb-6" style={{ gap: 8 }}>
          {stats.map((stat, i) => (
            <View
              key={i}
              className="flex-1 items-center bg-slate-50/50 border border-slate-100 rounded-3xl py-4"
            >
              <View className="mb-2">{stat.icon}</View>
              <Text className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                {stat.label}
              </Text>
              <Text className="text-base font-black text-slate-800">
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('InfluencerMediaKit' as never)}
        >
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16 }}
            className="w-full py-4 rounded-2xl items-center justify-center flex-row"
          >
            <Text className="text-white font-black text-xs uppercase tracking-widest">
              Generate Media Kit
            </Text>
            <ArrowRight size={18} color="white" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
