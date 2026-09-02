import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
const { width } = Dimensions.get('window');

// Playback uses react-native-video (ExoPlayer on Android). We moved off
// react-native-vlc-media-player because it crashes under the New Architecture:
// it calls MediaPlayer.pause() on every host-pause (app backgrounded OR Metro
// reload) and throws "can't get VLCObject instance" — a production crash, not
// just a dev redbox. react-native-video handles the paused/lifecycle path
// correctly. Only the active card mounts a player; the rest show the poster.

type Story = {
  name: string;
  image: string;
  link: string;
};

// Direct-mp4 reels hosted on the web app's public folder
// (rgossips_web/public/creatorReels). These are the real, muted, loopable
// clips VLC can stream — the earlier list pointed at a placeholder
// `yourcdn.com` host and Instagram *page* URLs, neither of which is a
// playable media stream, which is why nothing rendered.
//
// This mirrors the `fallbackStories` list in the web's CreatorStories.jsx
// (same creators, same avatars) so the two homepages stay in parity.
const REELS_BASE = 'https://rgossips.com/creatorReels';
const stories: Story[] = [
  {
    name: 'sahilanandofficial',
    image:
      'https://lh3.googleusercontent.com/d/1gpAUlvG4g-c8fCqx_YJUPZYDwUTDSSfL',
    link: `${REELS_BASE}/sahil.mp4`,
  },
  {
    name: 'nonaberrry',
    image:
      'https://lh3.googleusercontent.com/d/17FV8146Zu6KAYNxfTEj-SGxj40nlyo_5',
    link: `${REELS_BASE}/nonaberry.mp4`,
  },
  {
    name: 'aditirajputofficial',
    image:
      'https://lh3.googleusercontent.com/d/18IKmd6vgmGBOz9T5KVBAm8Oozl5iQyyo',
    link: `${REELS_BASE}/aditi.mp4`,
  },
  {
    name: 'alifestyledition',
    image:
      'https://lh3.googleusercontent.com/d/1cCyYWXM-rJ8SV3s6EX3xYxvXCOYKmYNu',
    link: `${REELS_BASE}/ali.mp4`,
  },
  {
    name: 'theyayawar',
    image:
      'https://lh3.googleusercontent.com/d/1Gw5GOW8qUE0kXI6gj0ak23tN7oVIFtV7',
    link: `${REELS_BASE}/yaya.mp4`,
  },
  {
    name: 'karishmatalwar93',
    image:
      'https://lh3.googleusercontent.com/d/10tTiJ3qm15UAS8KUDr5Hs7EFdGPo7pvG',
    link: `${REELS_BASE}/karishma.mp4`,
  },
  {
    name: 'vees_corner57',
    image:
      'https://lh3.googleusercontent.com/d/1m2g3DGzTjlWrXoxibPvFsqq2wc5xy8Ni',
    link: `${REELS_BASE}/veers.mp4`,
  },
  {
    name: 'nawab__adnan',
    image:
      'https://lh3.googleusercontent.com/d/19CMc1g0nMAFE61V_aeYk9G6gGT2A9mMX',
    link: `${REELS_BASE}/nawab.mp4`,
  },
];

// Individual story card
function StoryCard({ item }: { item: Story }) {
  const CARD_WIDTH = width * 0.75;
  // Show a loader over the poster from the moment the player mounts until the
  // first frame is ready to display (or it errors out).
  const [loading, setLoading] = useState(true);

  return (
    <View
      style={{ width: CARD_WIDTH }}
      className="rounded-2xl overflow-hidden bg-black"
    >
      {/* Every card ALWAYS mounts a looping, muted, autoplaying player — all
          reels keep playing at once, on screen or not. `repeat` loops each one.
          The `poster` shows the creator image until the first frame is ready. */}
      <View className="aspect-[9/16] bg-black items-center justify-center">
        <Video
          source={{ uri: item.link }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          repeat
          muted
          paused={false}
          // Multiple players run at once. Without this they fight over audio
          // focus — each one starting pauses the others, freezing the row.
          // They're muted, so they never need focus; disabling it lets every
          // reel keep playing simultaneously.
          disableFocus
          mixWithOthers="mix"
          playInBackground={false}
          playWhenInactive={false}
          poster={{ source: { uri: item.image }, resizeMode: 'cover' }}
          onLoadStart={() => setLoading(true)}
          onReadyForDisplay={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
        {loading ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.15)',
            }}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : null}
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
  const [current, setCurrent] = useState(0);
  const CARD_WIDTH = width * 0.75;
  const STEP = CARD_WIDTH + 12;

  return (
    <View className="w-full px-4 py-6">
      {/* Title */}
      <Text className="text-xl font-black text-[#1C115A] mb-6">
        {t('CreatorStories.title')}
      </Text>

      {/* Carousel — a plain ScrollView (not FlatList) so every card stays
          mounted and its reel keeps playing, on screen or not. FlatList would
          virtualize the off-screen cards and stop their videos. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12 }}
        onMomentumScrollEnd={e => {
          setCurrent(Math.round(e.nativeEvent.contentOffset.x / STEP));
        }}>
        {stories.map(item => (
          <StoryCard key={item.name} item={item} />
        ))}
      </ScrollView>

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
