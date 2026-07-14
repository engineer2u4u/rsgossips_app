import React, {useState, useEffect} from 'react';
import {View, Text, Image, FlatList, Pressable, Dimensions} from 'react-native';
import Animated, {FadeInRight} from 'react-native-reanimated';
import {Star} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {invokeFn} from '../lib/api';

const {width} = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

interface Campaign {
  id: string;
  title: string;
  location: string;
  budget: number;
  daysLeft: number;
  image?: string;
}

const FALLBACK_DATA = [
  {
    id: '1',
    title: 'Luxury Perfume Launch',
    location: 'Mumbai, India',
    budget: 150,
    daysLeft: 14,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800',
  },
  {
    id: '2',
    title: 'Wellness Spa Retreat',
    location: 'Goa, India',
    budget: 250,
    daysLeft: 21,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
  },
  {
    id: '3',
    title: 'Skincare Brand Collab',
    location: 'Delhi, India',
    budget: 200,
    daysLeft: 14,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
  },
];

export default function JourneyCarousel() {
  const {t} = useTranslation();
  const [campaigns, setCampaigns] = useState<Campaign[]>(FALLBACK_DATA);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{campaigns?: any[]}>('list-campaigns', {});
        if (cancelled) return;
        if (data?.campaigns?.length) {
          const active = data.campaigns
            .filter((c: any) => c.status === 'active' || c.status === 'Active')
            .slice(0, 6)
            .map((c: any) => ({
              id: c.id,
              title: c.title,
              location: c.location || 'India',
              budget: c.budget || 0,
              daysLeft: c.daysLeft || 0,
              image:
                c.image ||
                'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800',
            }));
          if (active.length) setCampaigns(active);
        }
      } catch {
        // Keep fallback data on error.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View className="w-full bg-white py-6">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 mb-4">
        <Text className="text-xl font-bold text-slate-800 uppercase">
          {t('JourneyCarousel.forYou')}
        </Text>
        <Pressable>
          <Text className="text-sm font-bold text-slate-500">
            {t('JourneyCarousel.seeAll')}
          </Text>
        </Pressable>
      </View>

      {/* Horizontal Carousel */}
      <FlatList
        data={campaigns}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={{paddingHorizontal: 16}}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          <Animated.View
            entering={FadeInRight.delay(index * 120)}
            style={{width: CARD_WIDTH}}
            className="mr-4">
            <Pressable className="bg-white rounded-[28px] overflow-hidden border border-slate-200">
              <Image
                source={{uri: item.image}}
                className="w-full h-44"
                resizeMode="cover"
              />
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
                        4.8
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row justify-between items-end mt-4">
                  <View>
                    <Text className="text-[10px] text-slate-400 font-black uppercase">
                      {t('JourneyCarousel.budget')}
                    </Text>
                    <Text className="text-lg font-black text-slate-900">
                      ₹{item.budget?.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View className="bg-pink-500 px-4 py-1.5 rounded-full">
                    <Text className="text-white text-[10px] font-black">
                      {t('JourneyCarousel.daysLeft', {count: item.daysLeft})}
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
