import React, {useEffect, useState} from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {Sparkles, ChevronRight, Zap, Crown} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import {useAuth} from '../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {
  NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY,
} from '@env';

export default function ProStatusCard() {
  const {profile} = useAuth();
  const navigation = useNavigation();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [brandCount, setBrandCount] = useState(0);

  const createdAt = profile?.created_at
    ? new Date(profile.created_at)
    : new Date();
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  const trialDaysLeft = Math.max(0, 30 - daysSinceCreation);
  const trialProgress = Math.min(1, daysSinceCreation / 30);
  const expired = trialDaysLeft === 0;

  const displayName = profile?.full_name || 'Creator';
  const avatarUrl = profile?.profile_photo_url;
  const currentPlan = profile?.subscription_plan || 'free';
  const hasPaidPlan = currentPlan !== 'free';

  useEffect(() => {
    opacity.value = withTiming(1, {duration: 600});
    progress.value = withDelay(
      500,
      withTiming(trialProgress, {duration: 1000}),
    );
  }, [trialProgress]);

  // Fetch brand count from Supabase
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/list-brands`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: '{}',
        });
        const data = await res.json();
        if (data?.brands?.length) {
          setBrandCount(data.brands.length);
        }
      } catch {}
    };
    fetchBrands();
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Animated.View
      style={{opacity}}
      className="w-full bg-white border border-slate-200 rounded-[32px] p-5 shadow-sm">
      {/* 1. Header: Avatar & Greeting */}
      <View className="flex-row items-center mb-4" style={{gap: 12}}>
        <View className="relative">
          {avatarUrl ? (
            <Image
              source={{uri: avatarUrl}}
              className="w-14 h-14 rounded-full"
              style={{borderWidth: 2, borderColor: 'white'}}
            />
          ) : (
            <LinearGradient
              colors={['#9810fa', '#e60076']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text className="text-white text-lg font-black">
                {displayName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </LinearGradient>
          )}
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
        </View>

        <View className="flex-1">
          <Text className="text-xl font-black text-slate-800 leading-tight">
            Hi, {displayName.split(' ')[0]}
          </Text>
          <View className="bg-emerald-50 px-2 py-0.5 rounded-md mt-1 self-start">
            <Text className="text-[10px] font-bold text-emerald-600 tracking-tight">
              PLAN:{' '}
              <Text className="text-slate-900">
                {hasPaidPlan
                  ? currentPlan
                      .replace('_', ' ')
                      .replace(/\b\w/g, (c: string) => c.toUpperCase())
                  : expired
                    ? 'Free'
                    : 'Starter Trial'}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Brand Match Card */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('InfluencerSearch' as never)}
        className="flex-row items-center bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm"
        style={{elevation: 2, gap: 12}}>
        <View className="p-2.5 bg-purple-50 rounded-full">
          <Sparkles size={18} color="#a855f7" />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-600">
            <Text style={{color: '#9810fa', fontWeight: '800'}}>
              {brandCount || 142} brands
            </Text>
            {' are looking for creators in your niche'}
          </Text>
        </View>

        <View className="p-1 bg-slate-50 rounded-full">
          <ChevronRight size={16} color="#cbd5e1" />
        </View>
      </TouchableOpacity>

      {/* 3. Trial Status + Upgrade */}
      <View className="flex-row items-center" style={{gap: 10}}>
        <View
          className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex-row items-center"
          style={{elevation: 2}}>
          {hasPaidPlan ? (
            <View className="flex-row items-center" style={{gap: 8}}>
              <Zap size={14} color="#9333EA" fill="#9333EA" />
              <Text className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Active Plan
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-3" style={{gap: 6}}>
                  <Zap
                    size={14}
                    color={expired ? '#94A3B8' : '#9333EA'}
                    fill={expired ? '#94A3B8' : '#9333EA'}
                  />
                  <Text className="text-[10px] font-black text-slate-500 tracking-widest uppercase">
                    {expired ? 'Trial Expired' : 'Free Trial'}
                  </Text>
                </View>

                <View className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <Animated.View style={[progressStyle]} className="h-full">
                    <LinearGradient
                      colors={expired ? ['#F87171', '#F87171'] : ['#9810fa', '#e60076']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={{flex: 1, borderRadius: 100}}
                    />
                  </Animated.View>
                </View>
              </View>

              <View className="items-center border-l border-slate-100 pl-4">
                <MaskedView
                  style={{height: 36, flexDirection: 'row'}}
                  maskElement={
                    <Text className="text-3xl font-black bg-transparent">
                      {trialDaysLeft}
                    </Text>
                  }>
                  <LinearGradient
                    colors={expired ? ['#F87171', '#F87171'] : ['#9810fa', '#e60076']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={{flex: 1, height: '100%'}}
                  />
                </MaskedView>
                <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Days Left
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Upgrade Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('InfluencerPricing' as never)
          }>
          <LinearGradient
            colors={['#9810fa', '#e60076']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              shadowColor: '#9810fa',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
            <Crown size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
