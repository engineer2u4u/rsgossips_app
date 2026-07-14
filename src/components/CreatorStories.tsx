import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { VLCPlayer, VlCPlayerView } from 'react-native-vlc-media-player';
const { width } = Dimensions.get('window');
import Orientation from 'react-native-orientation-locker';

type Story = {
  name: string;
  image: string;
  link: string;
};

const stories: Story[] = [
  {
    name: 'sahilanandofficial',
    image:
      'https://lh3.googleusercontent.com/d/1gpAUlvG4g-c8fCqx_YJUPZYDwUTDSSfL',
    link: 'https://www.youtube.com/shorts/CMqF7gBJhMk',
  },
  {
    name: 'nonaberrry',
    image:
      'https://lh3.googleusercontent.com/d/17FV8146Zu6KAYNxfTEj-SGxj40nlyo_5',
    link: 'https://yourcdn.com/reels/nonaberry.mp4',
  },
  {
    name: 'aditirajputofficial',
    image:
      'https://lh3.googleusercontent.com/d/18IKmd6vgmGBOz9T5KVBAm8Oozl5iQyyo',
    link: 'https://yourcdn.com/reels/aditi.mp4',
  },
  {
    name: 'alifestyledition',
    image:
      'https://lh3.googleusercontent.com/d/1cCyYWXM-rJ8SV3s6EX3xYxvXCOYKmYNu',
    link: 'https://yourcdn.com/reels/ali.mp4',
  },
];

// Individual story card
function StoryCard({ item, isActive }: { item: Story; isActive: boolean }) {
  const CARD_WIDTH = width * 0.75;

  return (
    <View
      style={{ width: CARD_WIDTH }}
      className="rounded-2xl overflow-hidden bg-black"
    >
      {/* Video */}
      <View className="aspect-[9/16] bg-black">
        {/* <VlCPlayerView
          source={{ uri: item.link }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          repeat={isActive}
          muted
          paused={!isActive}
          autoplay={isActive}
          // onError={error => console.log('VLC Error:', error)}
        /> */}
        <VLCPlayer
          style={{ width: '100%', height: '100%' }}
          source={{ uri: item.link }}
        />
      </View>

      {/* Creator Avatar */}
      <View className="absolute bottom-4 left-4 flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
          <Image source={{ uri: item.image }} className="w-full h-full" />
        </View>
      </View>

      {/* Username */}
      <Text className="absolute bottom-2 right-4 text-white text-sm">
        {item.name}
      </Text>
    </View>
  );
}

export default function CreatorStories() {
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);
  const CARD_WIDTH = width * 0.75;

  // Autoplay carousel
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (current + 1) % stories.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrent(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [current]);

  return (
    <View className="w-full px-4 py-6">
      {/* Title */}
      <Text className="text-xl font-black text-[#1C115A] mb-6">
        {t('CreatorStories.title')}
      </Text>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        keyExtractor={item => item.name}
        contentContainerStyle={{ gap: 12 }}
        onMomentumScrollEnd={e => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / (CARD_WIDTH + 12),
          );
          setCurrent(index);
        }}
        renderItem={({ item, index }) => (
          <StoryCard item={item} isActive={index === current} />
        )}
      />

      {/* Pagination Dots */}
      <View className="flex-row justify-center mt-4 gap-2">
        {stories.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full ${
              current === i ? 'w-4 bg-purple-600' : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
