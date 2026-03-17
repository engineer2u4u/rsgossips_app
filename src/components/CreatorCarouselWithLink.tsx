import React, { useState, useRef } from 'react';
import { View, Text, Dimensions, Pressable } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import CreatorCard from './CreatorCard';

const creators = [
  {
    name: 'sahilanandofficial',
    verified: true,
    image:
      'https://lh3.googleusercontent.com/d/1gpAUlvG4g-c8fCqx_YJUPZYDwUTDSSfL',
    posts: '1454',
    followers: '1.4M',
    following: '1123',
    bio: 'Sahil Nanda | Male',
    link: 'https://www.instagram.com/sahilanandofficial/',
  },
  {
    name: 'nonaberrry',
    verified: true,
    image:
      'https://lh3.googleusercontent.com/d/17FV8146Zu6KAYNxfTEj-SGxj40nlyo_5',
    posts: '860',
    followers: '798K',
    following: '1181',
    bio: 'Naina Singh | Female',
    link: 'https://www.instagram.com/nonaberrry/',
  },
  {
    name: 'aditirajputofficial',
    verified: false,
    image:
      'https://lh3.googleusercontent.com/d/18IKmd6vgmGBOz9T5KVBAm8Oozl5iQyyo',
    posts: '319',
    followers: '166K',
    following: '102',
    bio: 'Aditi Rajput | Female',
    link: 'https://www.instagram.com/aditirajputofficial/',
  },
];

export default function CreatorsCarouselWithLink() {
  const [current, setCurrent] = useState(0);
  const carouselRef = useRef(null);
  const { width } = Dimensions.get('window');

  return (
    <View className="w-full py-6">
      {/* Title */}
      <Text className="text-center text-xl font-black mb-8">
        OUR TOP CREATORS
      </Text>

      {/* Carousel */}
      <Carousel
        ref={carouselRef}
        width={width}
        style={{ width }}
        height={380}
        data={creators}
        loop
        autoPlay
        autoPlayInterval={3500}
        scrollAnimationDuration={900}
        onSnapToItem={index => setCurrent(index)}
        renderItem={({ item }) => (
          <View className="items-center">
            <CreatorCard {...item} />
          </View>
        )}
      />

      {/* Navigation Buttons */}
      <View className="flex-row justify-center gap-10 mt-6">
        <Pressable
          onPress={() => carouselRef.current?.prev()}
          className="p-3 bg-white rounded-full shadow border border-gray-200"
        >
          <ChevronLeft size={22} />
        </Pressable>

        <Pressable
          onPress={() => carouselRef.current?.next()}
          className="p-3 bg-white rounded-full shadow border border-gray-200"
        >
          <ChevronRight size={22} />
        </Pressable>
      </View>

      {/* Dots */}
      <View className="flex-row justify-center mt-6 gap-2">
        {creators.map((_, i) => (
          <Pressable
            key={i}
            onPress={() =>
              carouselRef.current?.scrollTo({ index: i, animated: true })
            }
            className={`h-2.5 rounded-full ${
              current === i ? 'bg-purple-600 w-10' : 'bg-gray-300 w-2.5'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
