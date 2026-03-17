import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Star, Bookmark } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const services = [
  {
    img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80',
    creator: 'Zachary Will',
    role: 'Fashion Stylist',
    title: 'Try-on Haul Video for TikTok',
    rating: '4.8',
    reviews: '89',
    price: '150',
  },
  {
    img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80',
    creator: 'Jessica Che',
    role: 'Beauty Guru',
    title: 'Detailed Makeup Tutorial & Review',
    rating: '5.0',
    reviews: '210',
    price: '250',
  },
];

export default function TopServices() {
  return (
    <ScrollView style={{ padding: 20, backgroundColor: '#fff' }}>
      {/* HEADER */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View>
          <Text className="text-xl font-black text-slate-900 uppercase">
            TOP SERVICES
          </Text>
          <Text className="text-xs text-slate-400 font-medium">
            Popular creator services right now
          </Text>
        </View>
        <TouchableOpacity>
          <Text className="text-pink-600 font-bold text-xs uppercase">
            View All ›
          </Text>
        </TouchableOpacity>
      </View>

      <FeaturedService />

      <View style={{ marginTop: 20, paddingBottom: 40 }}>
        {services.map((service, i) => (
          <ServiceRow key={i} {...service} />
        ))}
      </View>
    </ScrollView>
  );
}

function FeaturedService() {
  return (
    <View className="border border-slate-200 rounded-[32px] overflow-hidden bg-white shadow-sm">
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
        }}
        style={{ width: '100%', height: 220 }}
      />
      <View className="p-5">
        <View className="flex-row items-center mb-3">
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?u=emma' }}
            className="w-9 h-9 rounded-full mr-3"
          />
          <View>
            <Text className="font-black text-slate-800">Emma Davis</Text>
            <Text className="text-[10px] font-bold text-slate-400 uppercase">
              Lifestyle & Decor
            </Text>
          </View>
        </View>

        <Text className="text-lg font-black text-slate-900 leading-tight mb-2">
          Premium Product Photography & Reel
        </Text>
        <Text className="text-xs text-slate-500 font-medium mb-4">
          I will create high-quality aesthetic Instagram Reels and product
          photos.
        </Text>

        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Package Price
            </Text>
            <Text className="text-2xl font-black text-slate-900">$350</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient
              colors={['#8E2DE2', '#F6339A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-6 py-3 rounded-2xl"
              style={{
                borderRadius: 16,
              }}
            >
              <Text className="text-white font-black text-xs uppercase">
                Book Now
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ServiceRow({
  img,
  creator,
  role,
  title,
  rating,
  reviews,
  price,
}: any) {
  return (
    <View className="flex-row border border-slate-100 rounded-[24px] p-3 mb-4 bg-white shadow-sm">
      <Image source={{ uri: img }} className="w-24 h-24 rounded-[18px] mr-4" />

      <View className="flex-1 justify-between">
        <View>
          <Text className="text-[10px] font-bold text-slate-400 uppercase">
            {creator} • {role}
          </Text>
          <Text
            className="font-black text-slate-800 text-sm leading-tight my-1"
            numberOfLines={1}
          >
            {title}
          </Text>
          <View className="flex-row items-center">
            <Star size={12} color="#FACC15" fill="#FACC15" />
            <Text className="ml-1 text-[11px] font-bold text-slate-700">
              {rating} ({reviews})
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-lg font-black text-slate-900">${price}</Text>

          <View className="flex-row items-center gap-x-2">
            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient
                colors={['#8E2DE2', '#F6339A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-4 py-2 rounded-xl"
                style={{
                  borderRadius: 16,
                }}
              >
                <Text className="text-white font-black text-[10px] uppercase">
                  Book
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity className="p-2 border border-slate-100 rounded-xl bg-slate-50">
              <Bookmark size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
