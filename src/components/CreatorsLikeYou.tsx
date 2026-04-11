import React from 'react';
import {View, Text, Image, Pressable} from 'react-native';
import Animated, {FadeInUp} from 'react-native-reanimated';

const creators = [
  {
    id: 1,
    name: 'Sara J.',
    role: 'Hair',
    followers: '18K',
    quote: 'Finally monetizing my content! The brand matches are spot on.',
    earnings: '₹41K',
    time: 'in 1 month',
    image: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: 2,
    name: 'Priya M.',
    role: 'Skincare',
    followers: '14K',
    quote: 'Turned my small audience into a steady income stream.',
    earnings: '₹37K',
    time: 'in 4 weeks',
    image: 'https://i.pravatar.cc/150?img=6',
  },
  {
    id: 3,
    name: 'Ananya S.',
    role: 'Beauty',
    followers: '15K',
    quote: 'Got my first brand deal in just 4 days of signing up.',
    earnings: '₹32K',
    time: 'in 3 weeks',
    image: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: 4,
    name: 'Aisha R.',
    role: 'Lifestyle',
    followers: '9K',
    quote: 'My first paid collaboration happened here.',
    earnings: '₹18K',
    time: 'in 2 weeks',
    image: 'https://i.pravatar.cc/150?img=5',
  },
];

export default function CreatorsLikeYou() {
  return (
    <View className="w-full px-4 py-8 bg-[#F7F7FB]">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-lg font-black text-slate-900 uppercase tracking-tight">
            Creators Like You
          </Text>
          <Text className="text-xs text-slate-400 font-medium mt-1">
            See how others are growing their income
          </Text>
        </View>
        <Pressable>
          <Text className="text-pink-500 font-bold text-xs">Explore →</Text>
        </Pressable>
      </View>

      {/* Featured Card */}
      <Animated.View
        entering={FadeInUp.duration(500)}
        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
        <View className="flex-row items-center mb-4" style={{gap: 12}}>
          <Image
            source={{uri: 'https://i.pravatar.cc/150?img=4'}}
            className="w-12 h-12 rounded-full"
          />
          <View>
            <Text className="font-bold text-base text-slate-800">Neha P.</Text>
            <Text className="text-xs text-slate-400 font-medium">
              Fashion · 20K followers
            </Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-slate-800 leading-relaxed mb-4">
          "Brands started reaching out immediately after joining. Best
          platform!"
        </Text>

        <View className="bg-[#009966] rounded-2xl px-4 py-4">
          <Text className="text-[10px] text-white/80 uppercase font-bold tracking-wider">
            Record Earnings
          </Text>
          <Text className="text-3xl font-black text-white mt-1">₹55K</Text>
          <Text className="text-xs text-white/70 mt-0.5">in 5 weeks</Text>
        </View>
      </Animated.View>

      {/* Creator Cards Grid */}
      <View className="flex-row flex-wrap" style={{gap: 10}}>
        {creators.map((person, index) => (
          <Animated.View
            key={person.id}
            entering={FadeInUp.delay(index * 100)}
            style={{width: '48.5%'}}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <View className="flex-row items-center mb-3" style={{gap: 8}}>
              <Image
                source={{uri: person.image}}
                className="w-9 h-9 rounded-full"
              />
              <View className="flex-1">
                <Text className="font-bold text-sm text-slate-800">
                  {person.name}
                </Text>
                <Text className="text-[10px] text-slate-400 font-medium">
                  {person.role} · {person.followers}
                </Text>
              </View>
            </View>

            <Text
              className="text-xs text-slate-500 italic leading-relaxed mb-3"
              numberOfLines={3}>
              "{person.quote}"
            </Text>

            <View className="flex-row justify-between items-center pt-3 border-t border-slate-50">
              <View>
                <Text className="text-[9px] text-slate-400 uppercase font-bold">
                  Earnings
                </Text>
                <Text className="font-black text-sm text-slate-800">
                  {person.earnings}
                </Text>
                <Text className="text-[10px] text-slate-400">
                  {person.time}
                </Text>
              </View>
              <View className="w-8 h-8 bg-emerald-50 rounded-full items-center justify-center">
                <Text className="text-emerald-500 text-xs font-bold">↗</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
