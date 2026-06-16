import React from 'react';
import {View, Text, Image, TouchableOpacity, ScrollView, FlatList, Dimensions} from 'react-native';
import {ChevronLeft, Plus, Instagram, Edit2} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import BottomNav from './BottomNav';

const {width} = Dimensions.get('window');

interface Props {
  onBack: () => void;
  onAddReel: () => void;
  onEditProfile?: () => void;
}

function formatCount(n: number | undefined) {
  if (!n) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const METRIC_COLORS: Record<string, string> = {
  blue: '#3B82F6',
  pink: '#EC4899',
  green: '#10B981',
  amber: '#F59E0B',
  cyan: '#06B6D4',
  purple: '#8B5CF6',
};

const MyInformationDetail: React.FC<Props> = ({onBack, onAddReel, onEditProfile}) => {
  const {profile} = useAuth();

  const name = profile?.full_name || 'Creator';
  const handle = profile?.instagram_handle || profile?.username || 'creator';
  const photo = profile?.profile_photo_url;
  const followers = profile?.followers_count || 0;
  const following = profile?.follows_count || 0;
  const posts = profile?.media_count || 0;
  const categories = profile?.categories || [];
  const topReels = profile?.top_reels || [];

  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const metrics = [
    {label: 'Engagement', value: profile?.engagement_rate ? `${profile.engagement_rate}%` : '—', color: 'blue'},
    {label: 'Followers', value: formatCount(followers), color: 'purple'},
    {label: 'Avg Likes', value: formatCount(profile?.avg_likes), color: 'pink'},
    {label: 'Avg Comments', value: formatCount(profile?.avg_comments), color: 'green'},
    {label: 'Impressions', value: formatCount(profile?.total_impressions), color: 'amber'},
    {label: 'Reach', value: formatCount(profile?.total_reach), color: 'cyan'},
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Back Button */}
      <View className="px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
          <ChevronLeft size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Card with gradient border */}
        <LinearGradient
          colors={['#9810FA', '#E60076', '#FF6BA1']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{marginHorizontal: 20, marginTop: 8, borderRadius: 20, padding: 2}}>
        <View className="bg-white p-6 rounded-[18px] items-center">
          {/* Avatar */}
          <View className="relative mb-4">
            {photo ? (
              <Image
                source={{uri: photo}}
                className="w-24 h-24 rounded-2xl"
                // elevation isn't on ImageStyle in RN types but works at runtime.
                style={
                  {
                    shadowColor: '#EC4899',
                    shadowOffset: {width: 0, height: 4},
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 6,
                  } as any
                }
              />
            ) : (
              <LinearGradient
                colors={['#FF2D78', '#FF6BA1']}
                style={{width: 96, height: 96, borderRadius: 16, alignItems: 'center', justifyContent: 'center'}}>
                <Text className="text-white text-3xl font-bold">{initials}</Text>
              </LinearGradient>
            )}
            <TouchableOpacity className="absolute -bottom-2 -right-2 bg-[#1A1A1A] p-2 rounded-xl" style={{borderWidth: 2, borderColor: 'white'}}>
              <Edit2 size={10} color="white" />
            </TouchableOpacity>
          </View>

          {/* Name + Handle */}
          <Text className="text-xl font-extrabold text-[#1A1A1A]">{name}</Text>
          <Text className="text-sm text-gray-400 italic">@{handle}</Text>

          {/* Instagram handle pill */}
          <View className="flex-row items-center mt-2 bg-pink-50 px-3 py-1 rounded-full" style={{gap: 4}}>
            <Instagram size={12} color="#E60076" />
            <Text className="text-[11px] font-medium text-pink-600">@{handle}</Text>
          </View>

          {/* Stats Row */}
          <View className="flex-row w-full mt-5 pt-4 border-t border-gray-100 justify-around">
            <View className="items-center">
              <Text className="text-lg font-black text-[#1A1A1A]">{formatCount(posts)}</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Posts</Text>
            </View>
            <View className="w-px h-9 bg-gray-100" />
            <View className="items-center">
              <Text className="text-lg font-black text-[#1A1A1A]">{formatCount(followers)}</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Followers</Text>
            </View>
            <View className="w-px h-9 bg-gray-100" />
            <View className="items-center">
              <Text className="text-lg font-black text-[#1A1A1A]">{formatCount(following)}</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Following</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity className="w-full mt-4" onPress={onEditProfile}>
            <LinearGradient
              colors={['#E60076', '#FF6BA1']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{borderRadius: 12, height: 44}}
              className="flex-row items-center justify-center">
              <Edit2 size={16} color="white" />
              <Text className="text-white font-bold text-sm ml-2">Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </LinearGradient>

        {/* Engagement Metrics */}
        <View className="mx-5 mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <View className="flex-row items-center mb-4" style={{gap: 6}}>
            <Text className="text-lg">√</Text>
            <Text className="text-base font-black text-[#1A1A1A]">Engagement Metrics</Text>
          </View>

          <View className="flex-row flex-wrap" style={{gap: 10}}>
            {metrics.map(m => (
              <View
                key={m.label}
                style={{width: '47%'}}
                className="bg-slate-50 rounded-xl p-3">
                <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {m.label}
                </Text>
                {m.value !== '—' ? (
                  <Text className="text-lg font-black" style={{color: METRIC_COLORS[m.color] || '#1A1A1A'}}>
                    {m.value}
                  </Text>
                ) : (
                  <View className="h-1 w-8 rounded-full mt-2" style={{backgroundColor: METRIC_COLORS[m.color]}} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* My Work / Reels */}
        <View className="mx-5 mt-6 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center" style={{gap: 6}}>
              <View className="w-1 h-5 bg-[#E60076] rounded-full" />
              <Text className="text-lg font-black text-[#1A1A1A]">My Work</Text>
              <Text className="text-sm text-gray-400 font-bold">{topReels.length || posts}</Text>
            </View>
            <TouchableOpacity onPress={onAddReel}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                style={{borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <Plus size={14} color="white" />
                <Text className="text-white text-xs font-bold">Add Reel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Reel Grid */}
          {topReels.length > 0 ? (
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              {topReels.map((reel: any, i: number) => (
                <View key={reel.id || i} style={{width: (width - 50) / 2}} className="h-48 rounded-2xl overflow-hidden bg-slate-100">
                  {reel.thumbnail ? (
                    <Image source={{uri: reel.thumbnail}} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 items-center justify-center">
                      <Instagram size={24} color="#CBD5E1" />
                    </View>
                  )}
                  {reel.category && (
                    <View className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-md">
                      <Text className="text-[8px] font-bold text-white uppercase">{reel.category}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-row" style={{gap: 8}}>
              {[1, 2].map(i => (
                <View key={i} style={{width: (width - 50) / 2}} className="h-48 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100">
                  <Instagram size={24} color="#CBD5E1" />
                  <Text className="text-[10px] text-slate-300 font-bold mt-2">No content yet</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </View>
    </View>
  );
};

export default MyInformationDetail;
