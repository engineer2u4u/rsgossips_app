import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';

type Location = {
  id: number;
  name: string;
  image: string;
  attribution?: string;
};

const locations: Location[] = [
  {
    id: 1,
    name: 'Mumbai',
    image:
      'https://images.unsplash.com/photo-1598434192043-71111c1b3f41?q=80&w=735&auto=format&fit=crop',
  },
  {
    id: 2,
    name: 'Delhi',
    image:
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 3,
    name: 'Bangalore',
    image:
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 4,
    name: 'Chennai',
    image:
      'https://images.unsplash.com/photo-1679214803434-af50c2c92009?q=80&w=1974&auto=format&fit=crop',
  },
  {
    id: 5,
    name: 'Hyderabad',
    image:
      'https://images.unsplash.com/photo-1598434192043-71111c1b3f41?q=80&w=735&auto=format&fit=crop',
  },
  {
    id: 6,
    name: 'Kolkata',
    image:
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 7,
    name: 'Pune',
    image:
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 8,
    name: 'Gurgaon',
    image:
      'https://images.unsplash.com/photo-1679214803434-af50c2c92009?q=80&w=1974&auto=format&fit=crop',
  },
];

export const CreatorsByLocation = () => {
  return (
    <View className="w-full px-4 py-8 bg-white mt-8 mb-10">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-[#1C115A]">
          Creators by Location
        </Text>

        <Text className="text-slate-500 text-sm">
          Discover local talent right now
        </Text>
      </View>

      {/* Grid */}
      <View className="flex-row flex-wrap justify-between gap-y-4">
        {locations.map(location => (
          <Pressable
            key={location.id}
            className="w-[48%] h-36 rounded-3xl overflow-hidden shadow-md"
          >
            {/* Background Image */}
            <Image
              source={{ uri: location.image }}
              resizeMode="cover"
              className="absolute w-full h-full"
            />

            {/* Dark Gradient Overlay */}
            <View className="absolute bottom-0 w-full h-1/2 bg-black/60" />

            {/* Centered Text */}
            <View className="absolute inset-0 items-center justify-center px-2">
              <Text className="text-white text-base font-black tracking-tight uppercase text-center">
                {location.name}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
