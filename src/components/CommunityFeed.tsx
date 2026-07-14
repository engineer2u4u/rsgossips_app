import React from 'react';
import {View, Text, Image, Pressable} from 'react-native';
import {useTranslation} from 'react-i18next';
import Animated, {FadeInUp} from 'react-native-reanimated';
import {
  Heart,
  MessageSquare,
  Eye,
  Flame,
  Plus,
  UserPlus,
} from 'lucide-react-native';

const posts = [
  {
    name: 'Sarah Jenkins',
    handle: '@sarah',
    time: '2h ago',
    title: 'How I landed my first ₹10K deal as a 5K creator',
    desc: 'It took a lot of cold emailing, but I finally figured out a framework that actually gets responses from brand managers...',
    comments: 24,
    likes: 112,
    views: '2.4k',
    pinned: true,
  },
  {
    name: 'David Chen',
    handle: '@david',
    time: '5h ago',
    title: "Rate card thread — what's everyone charging?",
    desc: "Let's be transparent. I'm currently at 20k on IG and 50k on TikTok. Here's my current rate card for 2024...",
    comments: 18,
    likes: 85,
    views: '1.2k',
    pinned: false,
  },
];

const contributors = [
  {
    name: 'Alex Rivera',
    points: '1.2k',
    img: 'https://i.pravatar.cc/100?img=11',
  },
  {
    name: 'Elena Rodriguez',
    points: '850',
    img: 'https://i.pravatar.cc/100?img=12',
  },
  {
    name: 'Marcus Johnson',
    points: '720',
    img: 'https://i.pravatar.cc/100?img=13',
  },
];

export default function CommunityFeed() {
  const {t} = useTranslation();
  return (
    <View className="bg-white px-4 py-8">
      {/* Header */}
      <View className="mb-5">
        <Text className="text-xl font-black text-slate-900 uppercase tracking-tight">
          {t('CommunityFeed.title')}
        </Text>
        <Text className="text-xs text-slate-400 font-medium mt-1">
          {t('CommunityFeed.subtitle')}
        </Text>
      </View>

      {/* Start Discussion */}
      <Pressable className="bg-purple-600 flex-row items-center justify-center py-3.5 rounded-2xl mb-5" style={{gap: 8}}>
        <Plus size={16} color="white" />
        <Text className="text-white font-bold text-sm">{t('CommunityFeed.startDiscussion')}</Text>
      </Pressable>

      {/* Posts */}
      <View style={{gap: 12}}>
        {posts.map((post, index) => (
          <Animated.View
            key={index}
            entering={FadeInUp.delay(index * 100)}
            className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            {/* User */}
            <View className="flex-row items-center mb-3" style={{gap: 10}}>
              <Image
                source={{uri: `https://i.pravatar.cc/150?img=${index + 3}`}}
                className="w-9 h-9 rounded-full"
              />
              <View className="flex-1">
                <View className="flex-row items-center" style={{gap: 6}}>
                  <Text className="font-bold text-sm text-slate-800">
                    {post.name}
                  </Text>
                  {post.pinned && (
                    <View className="bg-purple-50 px-2 py-0.5 rounded-full">
                      <Text className="text-purple-600 text-[9px] font-black uppercase">
                        {t('CommunityFeed.pinned')}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-[11px] text-slate-400 font-medium">
                  {post.handle} · {post.time}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text className="font-bold text-sm text-slate-800 mb-1.5">
              {post.title}
            </Text>

            {/* Description */}
            <Text className="text-xs text-slate-500 leading-relaxed mb-4">
              {post.desc}
            </Text>

            {/* Footer */}
            <View className="flex-row justify-between items-center pt-3 border-t border-slate-50">
              <View className="flex-row" style={{gap: 16}}>
                <View className="flex-row items-center" style={{gap: 4}}>
                  <Heart size={14} color="#94A3B8" />
                  <Text className="text-xs text-slate-500 font-medium">
                    {post.likes}
                  </Text>
                </View>
                <View className="flex-row items-center" style={{gap: 4}}>
                  <MessageSquare size={14} color="#94A3B8" />
                  <Text className="text-xs text-slate-500 font-medium">
                    {post.comments}
                  </Text>
                </View>
                <View className="flex-row items-center" style={{gap: 4}}>
                  <Eye size={14} color="#94A3B8" />
                  <Text className="text-xs text-slate-500 font-medium">
                    {post.views}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center" style={{gap: 4}}>
                <Flame size={12} color="#F97316" />
                <Text className="text-[11px] text-orange-500 font-bold">
                  {t('CommunityFeed.trending')}
                </Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Load More */}
      <Pressable className="bg-slate-50 py-3 rounded-xl items-center mt-4 mb-6">
        <Text className="text-slate-500 text-xs font-bold">
          {t('CommunityFeed.loadMore')}
        </Text>
      </Pressable>

      {/* Community Stats + Contributors Row */}
      <View style={{gap: 12}}>
        <View className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Text className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">
            {t('CommunityFeed.communityStats')}
          </Text>
          <View className="flex-row" style={{gap: 10}}>
            <View className="flex-1 items-center bg-slate-50 py-5 rounded-2xl">
              <UserPlus size={18} color="#64748B" />
              <Text className="text-xl font-black text-slate-800 mt-2">
                12.4k
              </Text>
              <Text className="text-[10px] text-slate-400 font-bold">
                {t('CommunityFeed.members')}
              </Text>
            </View>
            <View className="flex-1 items-center bg-slate-50 py-5 rounded-2xl">
              <MessageSquare size={18} color="#64748B" />
              <Text className="text-xl font-black text-emerald-600 mt-2">
                342
              </Text>
              <Text className="text-[10px] text-slate-400 font-bold">
                {t('CommunityFeed.online')}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <Text className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">
            {t('CommunityFeed.topContributors')}
          </Text>
          <View style={{gap: 10}}>
            {contributors.map((c, i) => (
              <View
                key={i}
                className="flex-row justify-between items-center">
                <View className="flex-row items-center" style={{gap: 10}}>
                  <Image
                    source={{uri: c.img}}
                    className="w-8 h-8 rounded-full"
                  />
                  <Text className="text-sm font-semibold text-slate-700">
                    {c.name}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-slate-400">
                  {t('CommunityFeed.points', {points: c.points})}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
