import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useNavigation } from '@react-navigation/native';
import { Instagram } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const DUMMY_STAYS = [
  {
    id: 'stay-1',
    displayTitle: 'The Azure Glass Resort',
    location: 'Maldives, Indian Ocean',
    imageUrl:
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800',
    brand: { instagramFollowers: '120K' },
  },
  {
    id: 'stay-2',
    displayTitle: 'Urban Oasis Suites',
    location: 'Downtown Tokyo, Japan',
    imageUrl:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800',
    brand: { instagramFollowers: '45K' },
  },
  {
    id: 'stay-3',
    displayTitle: 'Alpine Heritage Lodge',
    location: 'Zermatt, Switzerland',
    imageUrl:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800',
    brand: { instagramFollowers: '88K' },
  },
  {
    id: 'stay-4',
    displayTitle: 'Terrace Palms Boutique',
    location: 'Marrakech, Morocco',
    imageUrl:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800',
    brand: { instagramFollowers: '250K' },
  },
];

export default function StayCarousel() {
  const navigation = useNavigation();

  return (
    <View className="py-6 flex items-center mx-auto">
      <Text className="text-center text-xl font-black mb-6">
        PLAN YOUR STAY WITH US
      </Text>

      <Carousel
        width={width * 0.85}
        height={420}
        data={DUMMY_STAYS}
        loop
        autoPlay
        autoPlayInterval={4000}
        renderItem={({ item }) => (
          <Pressable className="bg-white rounded-[30px] overflow-hidden shadow-lg">
            {/* Image */}
            <View className="relative">
              <Image
                source={{ uri: item.imageUrl }}
                className="w-full h-[240px]"
              />

              {/* Glass Badge */}
              <View className="absolute top-4 left-4 bg-white/30 px-4 py-1 rounded-full">
                <Text className="text-white text-[10px] font-black uppercase">
                  Day Luxury
                </Text>
              </View>
            </View>

            {/* Content */}
            <View className="p-5">
              <Text className="text-lg font-black text-slate-800">
                {item.displayTitle}
              </Text>

              <Text className="text-slate-500 text-sm mb-4">
                {item.location}
              </Text>

              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center bg-slate-100 px-3 py-2 rounded-xl">
                  <Instagram size={18} color="#F6339A" />
                  <Text className="ml-2 font-bold text-xs">
                    {item.brand.instagramFollowers}
                  </Text>
                </View>

                <View className="flex-row gap-x-2">
                  <TouchableOpacity className="flex-1 max-w-32">
                    <LinearGradient
                      colors={['#9810fa', '#e60076']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="py-3.5 rounded-2xl items-center"
                      style={{
                        borderRadius: 16,
                        paddingBottom: 14,
                        paddingTop: 14,
                      }}
                    >
                      <Text className="text-white font-black text-xs">
                        Apply
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
