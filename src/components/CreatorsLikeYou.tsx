import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

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
    <ScrollView className="w-full px-4 py-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-lg font-bold text-slate-900 uppercase">
            Creators Like You
          </Text>

          <Text className="text-sm text-slate-500">
            See how others are growing their income
          </Text>
        </View>

        <Pressable>
          <Text className="text-pink-500 font-semibold">Explore →</Text>
        </Pressable>
      </View>

      {/* Featured Card */}
      <Animated.View
        entering={FadeInUp.duration(500)}
        className="bg-white rounded-3xl p-6 border border-slate-200 mb-6"
      >
        <View className="flex-row items-center gap-3 mb-6">
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=4' }}
            className="w-12 h-12 rounded-full"
          />

          <View>
            <Text className="font-semibold text-base">Neha P.</Text>

            <Text className="text-xs text-slate-500">Fashion · 20K</Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-slate-800 leading-relaxed">
          “Brands started reaching out immediately after joining. Best
          platform!”
        </Text>

        <View className="mt-6 bg-[#009966] rounded-xl px-4 py-4">
          <Text className="text-xs text-white opacity-80 uppercase">
            Record Earnings
          </Text>

          <Text className="text-3xl font-bold text-white">₹55K</Text>

          <Text className="text-xs text-white opacity-80">in 5 weeks</Text>
        </View>
      </Animated.View>

      {/* Creator Cards */}
      <View className="flex-row flex-wrap justify-between">
        {creators.map((person, index) => (
          <Animated.View
            key={person.id}
            entering={FadeInUp.delay(index * 100)}
            className="w-[48%] bg-white rounded-2xl p-4 border border-slate-200 mb-4"
          >
            <View>
              <View className="flex-row items-center gap-2 mb-3">
                <Image
                  source={{ uri: person.image }}
                  className="w-10 h-10 rounded-full"
                />

                <View>
                  <Text className="font-semibold text-sm">{person.name}</Text>

                  <Text className="text-xs text-slate-500">
                    {person.role} · {person.followers}
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-slate-600 italic">
                "{person.quote}"
              </Text>
            </View>

            <View className="mt-4 flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-slate-400 uppercase">
                  Earnings
                </Text>

                <Text className="font-semibold">{person.earnings}</Text>

                <Text className="text-xs text-slate-400">{person.time}</Text>
              </View>

              <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                <Text>↗</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}
