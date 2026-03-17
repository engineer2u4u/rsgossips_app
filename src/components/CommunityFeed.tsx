import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
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
  return (
    <ScrollView className="flex-1 bg-white px-4 py-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-slate-900 uppercase">
          Creator Community
        </Text>

        <Text className="text-sm text-slate-500 mt-2">
          Connect with other creators, share wins, and get advice.
        </Text>
      </View>

      {/* Start Discussion */}
      <Pressable className="bg-purple-600 flex-row items-center justify-center gap-2 py-3 rounded-2xl mb-6">
        <Plus size={16} color="white" />
        <Text className="text-white font-semibold">Start Discussion</Text>
      </Pressable>

      {/* Posts */}
      {posts.map((post, index) => (
        <Animated.View
          key={index}
          entering={FadeInUp.delay(index * 100)}
          className="bg-white border border-slate-200 rounded-2xl p-4 mb-4"
        >
          {/* User */}
          <View className="flex-row items-center mb-3">
            <Image
              source={{ uri: `https://i.pravatar.cc/150?img=${index + 3}` }}
              className="w-8 h-8 rounded-full mr-3"
            />

            <View>
              <View className="flex-row items-center">
                <Text className="font-semibold text-slate-800">
                  {post.name}
                </Text>

                {post.pinned && (
                  <Text className="text-purple-500 text-xs ml-2 font-semibold">
                    PINNED
                  </Text>
                )}
              </View>

              <Text className="text-xs text-slate-400">
                {post.handle} · {post.time}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="font-semibold text-slate-800 mb-2">
            {post.title}
          </Text>

          {/* Description */}
          <Text className="text-sm text-slate-500 mb-4">{post.desc}</Text>

          {/* Footer */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row gap-4">
              <View className="flex-row items-center">
                <Heart size={14} color="#64748B" />
                <Text className="text-xs text-slate-500 ml-1">
                  {post.likes}
                </Text>
              </View>

              <View className="flex-row items-center">
                <MessageSquare size={14} color="#64748B" />
                <Text className="text-xs text-slate-500 ml-1">
                  {post.comments}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Eye size={14} color="#64748B" />
                <Text className="text-xs text-slate-500 ml-1">
                  {post.views}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Flame size={12} color="#F97316" />
              <Text className="text-xs text-orange-500 ml-1 font-semibold">
                Trending
              </Text>
            </View>
          </View>
        </Animated.View>
      ))}

      {/* Load More */}
      <Pressable className="bg-slate-100 py-3 rounded-xl items-center mt-2 mb-8">
        <Text className="text-slate-500 text-sm">Load more discussions</Text>
      </Pressable>

      {/* Community Stats */}
      <View className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
        <Text className="text-sm font-semibold mb-4">COMMUNITY STATS</Text>

        <View className="flex-row justify-between">
          <View className="items-center bg-slate-100 w-[48%] py-6 rounded-2xl">
            <UserPlus size={18} />
            <Text className="text-xl font-bold mt-1">12.4k</Text>
            <Text className="text-xs text-slate-400">Members</Text>
          </View>

          <View className="items-center bg-slate-100 w-[48%] py-6 rounded-2xl">
            <MessageSquare size={18} />
            <Text className="text-xl font-bold text-green-600 mt-1">342</Text>
            <Text className="text-xs text-slate-400">Online</Text>
          </View>
        </View>
      </View>

      {/* Contributors */}
      <View className="bg-white border border-slate-200 rounded-2xl p-5">
        <Text className="text-sm font-semibold mb-4">TOP CONTRIBUTORS</Text>

        {contributors.map((c, i) => (
          <View key={i} className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Image
                source={{ uri: c.img }}
                className="w-7 h-7 rounded-full mr-2"
              />

              <Text className="text-sm text-slate-700">{c.name}</Text>
            </View>

            <Text className="text-xs text-slate-400">{c.points}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
