import React from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Crown, TrendingUp } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BRAND, BRAND_GRADIENT_WARM, CARD_SHADOW } from '../theme/brand';

interface CreatorCardProps {
  name: string;
  verified?: boolean;
  image: string;
  posts: string | number;
  followers: string | number;
  following: string | number;
  bio: string;
  link: string;
  /** Rank within "this week" — drives the pink "#N this week" badge.
   *  Falls back to no badge when zero/undefined. */
  rank?: number;
  /** Whether to render the green "Trending" pill on the top-right. */
  trending?: boolean;
}

// Deterministically pick a bright fill colour for the avatar bubble so each
// creator has a distinct identity even when no photo loads.
function avatarTone(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const palette: [string, string][] = [
    ['#F59E0B', '#EA580C'], // orange (matches screenshot featured card)
    ['#EC4899', '#BE185D'], // pink
    ['#3B82F6', '#1D4ED8'], // blue
    ['#10B981', '#047857'], // emerald
    ['#8B5CF6', '#6D28D9'], // violet
    ['#0EA5E9', '#0369A1'], // sky
  ];
  return palette[Math.abs(h) % palette.length];
}

export default function CreatorCard({
  name,
  verified,
  image,
  posts,
  followers,
  following,
  link,
  rank,
  trending = true,
}: CreatorCardProps) {
  const { t } = useTranslation();
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const [bgA, bgB] = avatarTone(name || '?');

  return (
    <View
      className="rounded-[28px] p-6 mx-5 w-[80%]"
      style={[
        { backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9' },
        CARD_SHADOW,
      ]}
    >
      {/* TOP BADGES */}
      <View
        className="flex-row items-center justify-between"
        style={{ marginBottom: 16 }}
      >
        {rank ? (
          <View
            className="flex-row items-center px-3 py-1 rounded-full "
            style={{ backgroundColor: '#FBCFE8', gap: 4 }}
          >
            <Crown size={12} color="#9D174D" />
            <Text
              className="text-[11px] font-black"
              style={{ color: '#9D174D' }}
            >
              {t('CreatorCard.rankThisWeek', { rank })}
            </Text>
          </View>
        ) : (
          <View />
        )}
        {trending ? (
          <View
            className="flex-row items-center px-3 py-1 rounded-full"
            style={{ backgroundColor: '#D1FAE5', gap: 4 }}
          >
            <TrendingUp size={12} color="#047857" />
            <Text
              className="text-[11px] font-black"
              style={{ color: '#047857' }}
            >
              {t('CreatorCard.trending')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* GRADIENT-RINGED AVATAR */}
      <View className="items-center" style={{ marginBottom: 14 }}>
        <LinearGradient
          colors={['#8B5CF6', BRAND.accent, '#F59E0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            padding: 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={{
                width: 132,
                height: 132,
                borderRadius: 66,
                borderWidth: 3,
                borderColor: '#fff',
              }}
            />
          ) : (
            <LinearGradient
              colors={[bgA, bgB]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 132,
                height: 132,
                borderRadius: 66,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: '#fff',
              }}
            >
              <Text className="text-white font-black" style={{ fontSize: 56 }}>
                {initial}
              </Text>
            </LinearGradient>
          )}
        </LinearGradient>
      </View>

      {/* NAME + VERIFIED */}
      <View
        className="flex-row items-center justify-center"
        style={{ gap: 6, marginBottom: 6 }}
      >
        <Text className="text-base font-black text-slate-900">{name}</Text>
        {verified ? <CheckCircle2 size={14} color={BRAND.accent} /> : null}
      </View>

      {/* HERO FOLLOWER COUNT */}
      <View className="items-center" style={{ marginBottom: 4 }}>
        <Text
          className="font-black"
          style={{ fontSize: 32, color: BRAND.accent, lineHeight: 36 }}
        >
          {followers || '—'}
        </Text>
        <Text
          className="text-[10px] font-bold tracking-widest"
          style={{ color: '#94A3B8' }}
        >
          {t('CreatorCard.followers')}
        </Text>
      </View>

      {/* POSTS | FOLLOWING ROW */}
      {posts || following ? (
        <View
          className="flex-row items-center justify-center"
          style={{ marginTop: 14, marginBottom: 16, gap: 28 }}
        >
          {posts ? (
            <View className="items-center">
              <Text className="text-base font-black text-slate-900">
                {posts}
              </Text>
              <Text className="text-[10px] font-bold tracking-widest text-slate-400">
                {t('CreatorCard.posts')}
              </Text>
            </View>
          ) : null}
          {posts && following ? (
            <View
              style={{
                width: 1,
                height: 30,
                backgroundColor: '#E2E8F0',
              }}
            />
          ) : null}
          {following ? (
            <View className="items-center">
              <Text className="text-base font-black text-slate-900">
                {following}
              </Text>
              <Text className="text-[10px] font-bold tracking-widest text-slate-400">
                {t('CreatorCard.following')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* FOLLOW CREATOR BUTTON */}
      <Pressable
        onPress={() => link && Linking.openURL(link).catch(() => {})}
        style={{ borderRadius: 16, overflow: 'hidden', height: 48 }}
      >
        <LinearGradient
          colors={['#FA288A', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="text-white text-sm font-black tracking-widest">
            {t('CreatorCard.followCreator')}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
