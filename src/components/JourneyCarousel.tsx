import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const CARD_WIDTH = width * 0.7;

const journeyData = [
  {
    id: 1,
    title: 'Luxury Perfume Launch',
    location: 'Mumbai, India',
    rating: 4.9,
    price: 150,
    duration: '2 Weeks',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800',
  },
  {
    id: 2,
    title: 'Wellness Spa Retreat',
    location: 'Goa, India',
    rating: 4.8,
    price: 250,
    duration: '3 Weeks',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
  },
  {
    id: 3,
    title: 'Skincare Brand Collab',
    location: 'Delhi, India',
    rating: 4.7,
    price: 200,
    duration: '2 Weeks',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
  },
];

export default function JourneyCarousel() {
  return (
    <View className="w-full bg-white py-6">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 mb-4">
        <Text className="text-xl font-bold text-slate-800 uppercase">
          For You
        </Text>

        <Pressable>
          <Text className="text-sm font-bold text-slate-500">See all</Text>
        </Pressable>
      </View>

      {/* Horizontal Carousel */}
      <FlatList
        data={journeyData}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInRight.delay(index * 120)}
            style={{ width: CARD_WIDTH }}
            className="mr-4"
          >
            <Pressable className="bg-white rounded-[28px] overflow-hidden border border-slate-200">
              {/* Image */}
              <Image
                source={{ uri: item.image }}
                className="w-full h-44"
                resizeMode="cover"
              />

              {/* Content */}
              <View className="p-4">
                <View className="flex-row justify-between">
                  <Text className="text-lg font-black text-slate-900 flex-1">
                    {item.title}
                  </Text>

                  <View className="items-end">
                    <Text className="text-[11px] text-slate-400 font-bold uppercase">
                      {item.location}
                    </Text>

                    <View className="flex-row items-center mt-1">
                      <Star size={14} color="#FACC15" fill="#FACC15" />
                      <Text className="text-sm font-black text-slate-700 ml-1">
                        {item.rating}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View className="flex-row justify-between items-end mt-4">
                  <View>
                    <Text className="text-[10px] text-slate-400 font-black uppercase">
                      Start from
                    </Text>

                    <Text className="text-lg font-black text-slate-900">
                      $ {item.price}
                      <Text className="text-[10px] text-slate-400"> /pax</Text>
                    </Text>
                  </View>

                  {/* Duration badge */}
                  <View className="bg-pink-500 px-4 py-1.5 rounded-full">
                    <Text className="text-white text-[10px] font-black">
                      {item.duration}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}
      />
    </View>
  );
}
