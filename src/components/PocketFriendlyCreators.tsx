import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

type Creator = {
  name: string;
  category: string;
  followers: string;
  image: string;
};

const creators: Creator[] = [
  {
    name: 'Rohan Sharma',
    category: 'Tech & Gadgets',
    followers: '45K followers',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop',
  },
  {
    name: 'Ananya Singh',
    category: 'Fashion & Style',
    followers: '120K followers',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop',
  },
  {
    name: 'Aryan Mehta',
    category: 'Fitness & Health',
    followers: '80K followers',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop',
  },
  {
    name: 'Sneha Kapoor',
    category: 'Travel & Lifestyle',
    followers: '60K followers',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop',
  },
  {
    name: 'Vikram Goel',
    category: 'Food & Cafe',
    followers: '35K followers',
    image:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=200&h=200&auto=format&fit=crop',
  },
];

export default function PocketFriendlyCreators() {
  const CARD_WIDTH = width * 0.75;

  return (
    <View className="w-full px-4 py-10 bg-white">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-[#1C115A]">
          Pocket Friendly Creators
        </Text>

        <Text className="text-sm text-slate-500">
          High engagement creators within your budget
        </Text>
      </View>

      {/* Horizontal List */}
      <FlatList
        data={creators}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.name}
        contentContainerStyle={{ gap: 16 }}
        renderItem={({ item }) => (
          <View
            style={{ width: CARD_WIDTH }}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 items-center"
          >
            {/* Profile Image with Gradient Border */}
            <View className="w-24 h-24 mb-4 items-center justify-center">
              {/* Gradient Border */}
              <View className="absolute w-full h-full rounded-full bg-indigo-500" />

              <View className="bg-white rounded-full p-1 w-[90px] h-[90px]">
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-full rounded-full"
                />
              </View>
            </View>

            {/* Name */}
            <Text className="font-bold text-[#1C115A] text-lg text-center">
              {item.name}
            </Text>

            {/* Category Badge */}
            <View className="bg-indigo-50 px-3 py-1 rounded-full mt-3">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {item.category}
              </Text>
            </View>

            {/* Followers */}
            <Text className="text-xs text-slate-400 mt-2 font-medium">
              {item.followers}
            </Text>

            {/* Button */}
            <Pressable className="mt-6 w-full py-3 bg-[#1C115A] rounded-2xl items-center">
              <Text className="text-white text-xs font-bold">View Profile</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
