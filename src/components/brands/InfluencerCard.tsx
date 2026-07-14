// Influencer card on brand-side Search.
//
// Renders real fields from the list-influencers edge function response
// (full_name / instagram_handle / followers_count / categories / city).
// Tapping the card opens the influencer's public media kit page on
// rgossips.com via the system browser (RN doesn't have a native media-kit
// viewer yet). "Invite" is stubbed — there's no invite edge function on
// the web either; brands invite via campaigns instead.

import React from 'react';
import {Alert, Image, Linking, Pressable, Text, View} from 'react-native';
import {Instagram, MapPin, Plus} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';

export type SearchInfluencer = {
  influencer_id: string;
  full_name?: string;
  username?: string;
  instagram_handle?: string;
  profile_photo_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  categories?: string[];
  city?: string;
};

interface Props {
  influencer: SearchInfluencer;
}

function formatCount(n?: number) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export function InfluencerCard({influencer}: Props) {
  const {t} = useTranslation();
  const name =
    influencer.full_name ||
    influencer.username ||
    influencer.instagram_handle ||
    t('BrandsInfluencerCard.creatorFallback');
  const handle = influencer.instagram_handle || influencer.username || '';
  const followers = formatCount(influencer.followers_count);
  const initial = name.charAt(0).toUpperCase();

  const openMediaKit = () => {
    if (!handle) {
      Alert.alert(
        t('BrandsInfluencerCard.noMediaKitTitle'),
        t('BrandsInfluencerCard.noMediaKitMessage'),
      );
      return;
    }
    Linking.openURL(`https://rgossips.com/kit/${handle}`);
  };

  const invite = () => {
    // Web doesn't have a generic invite either — brands invite by creating a
    // campaign and letting the matching engine surface this creator.
    Alert.alert(
      t('BrandsInfluencerCard.inviteTitle'),
      t('BrandsInfluencerCard.inviteMessage'),
    );
  };

  return (
    <Pressable
      onPress={openMediaKit}
      android_ripple={{color: '#e2e8f0'}}
      className="flex-row items-center px-5 py-3.5 border-b border-gray-100">
      {/* Avatar */}
      {influencer.profile_photo_url ? (
        <Image
          source={{uri: influencer.profile_photo_url}}
          className="w-14 h-14 rounded-full bg-gray-200"
        />
      ) : (
        <View className="w-14 h-14 rounded-full bg-purple-500 items-center justify-center">
          <Text className="text-white text-lg font-bold">{initial}</Text>
        </View>
      )}

      {/* Info */}
      <View className="flex-1 ml-3.5" style={{gap: 2}}>
        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
          {name}
        </Text>
        {handle ? (
          <Text className="text-[11px] text-gray-400" numberOfLines={1}>
            @{handle}
          </Text>
        ) : null}
        <View className="flex-row items-center" style={{gap: 12, marginTop: 2}}>
          <View className="flex-row items-center" style={{gap: 4}}>
            <Instagram size={12} color="#E60076" />
            <Text className="text-[11px] font-semibold text-gray-600">
              {followers}
            </Text>
          </View>
          {influencer.city ? (
            <View className="flex-row items-center" style={{gap: 4}}>
              <MapPin size={11} color="#94a3b8" />
              <Text className="text-[11px] text-gray-500" numberOfLines={1}>
                {influencer.city}
              </Text>
            </View>
          ) : null}
        </View>
        {influencer.categories && influencer.categories.length > 0 ? (
          <Text className="text-[10px] text-gray-400 mt-1" numberOfLines={1}>
            {influencer.categories.slice(0, 3).join(' · ')}
          </Text>
        ) : null}
      </View>

      {/* Invite Button */}
      <Pressable
        onPress={invite}
        hitSlop={4}
        className="bg-[#4C75BE] px-4 py-2 rounded-full flex-row items-center"
        style={{gap: 6}}>
        <Plus size={12} color="white" />
        <Text className="text-white text-[11px] font-bold">
          {t('BrandsInfluencerCard.inviteButton')}
        </Text>
      </Pressable>
    </Pressable>
  );
}
