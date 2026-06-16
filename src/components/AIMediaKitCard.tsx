import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import {ArrowRight, Sparkles, BadgeCheck} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {BRAND, BRAND_GRADIENT, BRAND_GRADIENT_WARM, CARD_SHADOW} from '../theme/brand';

function formatCount(n: number | undefined) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function AiMediaKitCard() {
  const {profile} = useAuth();
  const navigation = useNavigation();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, {duration: 500});
    translateY.value = withTiming(0, {duration: 500});
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: translateY.value}],
  }));

  const userName = profile?.full_name || 'Creator';
  const userHandle = profile?.instagram_handle || profile?.username || 'creator';
  const userPhoto = profile?.profile_photo_url;

  const stats = [
    {label: 'FOLLOWERS', value: formatCount(profile?.followers_count)},
    {label: 'POSTS', value: formatCount(profile?.media_count)},
    {label: 'FOLLOWING', value: formatCount(profile?.follows_count)},
  ];

  return (
    <Animated.View
      style={[
        animatedStyle,
        CARD_SHADOW,
        {
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(25,22,43,0.06)',
          padding: 20,
        },
      ]}>
      {/* Title row — compact heading + accent PREVIEW pill */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center" style={{gap: 6}}>
          <Text className="text-[16px] font-bold text-slate-900">
            AI Media Kit
          </Text>
          <Sparkles size={14} color={BRAND.accent} />
        </View>
        <View
          className="px-2.5 py-1 rounded-full"
          style={{backgroundColor: 'rgba(210,65,143,0.12)'}}>
          <Text
            className="text-[10px] font-bold tracking-widest"
            style={{color: BRAND.accent}}>
            PREVIEW
          </Text>
        </View>
      </View>

      {/* Centered REAL-TIME ANALYTICS subtitle */}
      <Text
        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-3">
        Real-Time Analytics
      </Text>

      {/* Avatar with gradient ring */}
      <View className="items-center mt-4">
        <LinearGradient
          colors={[...BRAND_GRADIENT]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{
            padding: 3,
            borderRadius: 50,
            shadowColor: BRAND.accent,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5,
          }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#ffffff',
              padding: 3,
              overflow: 'hidden',
            }}>
            {userPhoto ? (
              <Image
                source={{uri: userPhoto}}
                style={{flex: 1, borderRadius: 40}}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#8b6df0', '#6a64c0']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={{flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center'}}>
                <Text className="text-white text-2xl font-bold">
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </View>
        </LinearGradient>

        {/* Name with inline green verified check */}
        <View className="flex-row items-center mt-3" style={{gap: 5}}>
          <Text className="text-[18px] font-bold text-slate-900">
            {userName}
          </Text>
          {profile?.instagram_handle && (
            <BadgeCheck size={16} color={BRAND.green} fill={BRAND.green} stroke="#fff" />
          )}
        </View>
        <Text className="text-[13px] font-medium text-slate-400 mt-0.5">
          @{userHandle}
        </Text>
      </View>

      {/* 3-column stats with vertical dividers */}
      <View className="flex-row mt-4">
        {stats.map((stat, i) => (
          <View
            key={stat.label}
            className="flex-1 items-center"
            style={{
              paddingVertical: 4,
              borderLeftWidth: i === 0 ? 0 : 1,
              borderLeftColor: 'rgba(25,22,43,0.06)',
            }}>
            <Text className="text-[20px] font-bold text-slate-900">
              {stat.value}
            </Text>
            <Text className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Full-width gradient CTA */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('InfluencerMediaKit' as never)}
        style={{marginTop: 16}}>
        <LinearGradient
          colors={[...BRAND_GRADIENT_WARM]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{
            borderRadius: 14,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            shadowColor: BRAND.accent,
            shadowOffset: {width: 0, height: 6},
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 5,
          }}>
          <Text className="text-white font-bold text-[13px] uppercase tracking-widest">
            {profile?.media_kit_published ? 'View Media Kit' : 'Generate Media Kit'}
          </Text>
          <ArrowRight size={16} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
